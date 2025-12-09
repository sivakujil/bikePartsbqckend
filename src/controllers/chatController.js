import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import { generateAIResponse, getBikePartsSuggestions } from "../services/aiService.js";
import OpenAI from 'openai';

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Store active connections and rooms
const activeConnections = new Map();
const userRooms = new Map();
const typingUsers = new Set();

// ---------------------- SOCKET AUTH ----------------------
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};

// ---------------------- MAIN SOCKET HANDLER ----------------------
export const handleConnection = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.name} connected to chat`);

    // Save active connection
    activeConnections.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user,
      role: socket.user.role || "customer",
    });

    // ---------------------- ADMIN ROOM ----------------------
    if (socket.user.role === "admin") {
      socket.join("admin_room");
      console.log(`Admin ${socket.user.name} joined admin room`);

      // send initial user list
      const userList = Array.from(userRooms.entries()).map(
        ([userId, roomData]) => ({
          userId,
          ...roomData.userInfo,
          online: activeConnections.has(userId),
        })
      );

      socket.emit("user_list", userList);
    }

    // ---------------------- ADMIN JOINS A CUSTOMER ROOM ----------------------
    socket.on("join_customer_room", ({ customerId }) => {
      if (socket.user.role !== "admin") {
        return socket.emit("error", { message: "Unauthorized" });
      }

      socket.join(`customer_${customerId}`);
    });

    socket.on("leave_customer_room", ({ customerId }) => {
      socket.leave(`customer_${customerId}`);
    });

    // ---------------------- SEND MESSAGE ----------------------
    socket.on("send_message", (messageData) => {
      try {
        const message = {
          id: Date.now().toString(),
          senderId: socket.user._id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          text: messageData.text,
          timestamp: new Date().toISOString(),
          ...messageData,
        };

        let targetRoom =
          socket.user.role === "admin"
            ? `customer_${messageData.customerId}`
            : `customer_${socket.user._id}`;

        io.to(targetRoom).emit("new_message", message);

        if (socket.user.role !== "admin") {
          io.to("admin_room").emit("new_message", message);
        }

        // Update last message
        if (socket.user.role !== "admin") {
          userRooms.set(socket.user._id.toString(), {
            ...(userRooms.get(socket.user._id.toString()) || {}),
            lastMessage: messageData.text,
            lastMessageTime: new Date().toISOString(),
          });
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ---------------------- READ RECEIPT ----------------------
    socket.on("mark_as_read", ({ messageId }) => {
      socket.broadcast.emit("message_read", {
        messageId,
        readBy: socket.user._id,
        readAt: new Date().toISOString(),
      });
    });

    // ---------------------- TYPING ----------------------
    socket.on("typing_start", ({ customerId }) => {
      const targetRoom =
        socket.user.role === "admin"
          ? `customer_${customerId}`
          : "admin_room";

      io.to(targetRoom).emit("user_typing", {
        userId: socket.user._id,
        userName: socket.user.name,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ customerId }) => {
      const targetRoom =
        socket.user.role === "admin"
          ? `customer_${customerId}`
          : "admin_room";

      io.to(targetRoom).emit("user_typing", {
        userId: socket.user._id,
        userName: socket.user.name,
        isTyping: false,
      });
    });

    // ---------------------- CUSTOMER ROOM SETUP ----------------------
    if (socket.user.role !== "admin") {
      const roomName = `customer_${socket.user._id}`;
      socket.join(roomName);

      userRooms.set(socket.user._id.toString(), {
        userInfo: {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          phone: socket.user.phone || "N/A",
          avatar: socket.user.name.substring(0, 2).toUpperCase(),
          online: true,
        },
      });

      io.to("admin_room").emit("user_online", {
        userId: socket.user._id,
        userName: socket.user.name,
      });
    }

    // ---------------------- DISCONNECT ----------------------
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.name} disconnected`);

      activeConnections.delete(socket.user._id.toString());

      if (socket.user.role !== "admin") {
        io.to("admin_room").emit("user_offline", {
          userId: socket.user._id,
          userName: socket.user.name,
        });
      }
    });
  });
};

// ---------------------- AI CHAT API CONTROLLERS ----------------------

// Store conversation history for AI chat (in-memory for demo)
const aiConversations = new Map();

export const sendAIMessage = async (req, res) => {
  try {
    const { message, conversationId = 'default' } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get conversation history
    if (!aiConversations.has(userId)) {
      aiConversations.set(userId, new Map());
    }
    const userConversations = aiConversations.get(userId);
    if (!userConversations.has(conversationId)) {
      userConversations.set(conversationId, []);
    }
    const conversationHistory = userConversations.get(conversationId);

    // Add user message to history
    conversationHistory.push({ sender: 'user', text: message, timestamp: new Date() });

    // Generate AI response
    let aiResponse;
    if (!openai) {
      // Fallback response when OpenAI is not configured
      aiResponse = "I'm sorry, AI chat is currently not available. Please contact our support team for assistance.";
    } else {
      aiResponse = await generateAIResponse(message, conversationHistory.slice(-10));
    }

    // Add AI response to history
    conversationHistory.push({ sender: 'bot', text: aiResponse, timestamp: new Date() });

    // Keep only last 50 messages
    if (conversationHistory.length > 50) {
      conversationHistory.splice(0, conversationHistory.length - 50);
    }

    res.json({
      success: true,
      message: aiResponse,
      conversationId
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      message: "Failed to process AI message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAIConversation = async (req, res) => {
  try {
    const { conversationId = 'default' } = req.params;
    const userId = req.user.id;

    const conversationHistory = aiConversations.get(userId)?.get(conversationId) || [];

    res.json({
      success: true,
      conversationId,
      messages: conversationHistory
    });

  } catch (error) {
    console.error("Get AI Conversation Error:", error);
    res.status(500).json({ message: "Failed to get conversation" });
  }
};

export const clearAIConversation = async (req, res) => {
  try {
    const { conversationId = 'default' } = req.params;
    const userId = req.user.id;

    if (aiConversations.has(userId)) {
      aiConversations.get(userId).delete(conversationId);
    }

    res.json({
      success: true,
      message: "Conversation cleared"
    });

  } catch (error) {
    console.error("Clear AI Conversation Error:", error);
    res.status(500).json({ message: "Failed to clear conversation" });
  }
};

// ---------------------- LEGACY API CONTROLLERS ----------------------
export const getChatHistory = async (req, res) => {
  res.json({
    success: true,
    data: [],
  });
};

export const getChatUsers = async (req, res) => {
  res.json({
    success: true,
    data: [],
  });
};
