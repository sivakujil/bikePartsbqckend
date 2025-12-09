import express from "express";
import {
  getChatHistory,
  getChatUsers,
  sendAIMessage,
  getAIConversation,
  clearAIConversation
} from "../controllers/chatController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

// ============ AI CHAT ROUTES ============
// Send message to AI chatbot
router.post("/ai/send", protect, sendAIMessage);

// Get AI conversation history
router.get("/ai/conversation/:conversationId", protect, getAIConversation);
router.get("/ai/conversation", protect, getAIConversation);

// Clear AI conversation
router.delete("/ai/conversation/:conversationId", protect, clearAIConversation);
router.delete("/ai/conversation", protect, clearAIConversation);

// ============ LEGACY SUPPORT CHAT ROUTES ============
// Get chat history for a specific customer
router.get("/history/:customerId", protect, getChatHistory);

// Get all users with chat history
router.get("/users", protect, getChatUsers);

export default router;
