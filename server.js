import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import logger from "./src/Utils/logger.js";
import authRoutes from "./src/routes/authRoutes.js";
import riderAuthRoutes from "./src/routes/riderAuthRoutes.js";
import riderOrderRoutes from "./src/routes/riderOrderRoutes.js";
import riderCODRoutes from "./src/routes/riderCODRoutes.js";
import riderPayoutRoutes from "./src/routes/riderPayoutRoutes.js";
import riderLocationRoutes from "./src/routes/riderLocationRoutes.js";
//import riderIssueRoutes from "./src/routes/riderissueRoutes.js"
import productRoutes from "./src/routes/productRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import cartOrderRoutes from "./src/routes/cartOrderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import shipmentRoutes from "./src/routes/shipmentRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import adRoutes from "./src/routes/adRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import riderRoutes from "./src/routes/riderRoutes.js";
import productRequestRoutes from "./src/routes/productRequestRoutes.js";
import { handleConnection } from "./src/controllers/chatController.js";
import { handleRiderConnection, handleAdminConnection } from "./src/controllers/riderSocketHandler.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://bike-parts-frontend.vercel.app",
    methods: ["GET", "POST","put","delete"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin:"https://bike-parts-frontend.vercel.app",
   methods: ["GET", "POST","put","delete"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));






// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Attach io to req for real-time features
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/rider/auth", riderAuthRoutes);
app.use("/api/rider", riderOrderRoutes);
app.use("/api/rider", riderCODRoutes);
app.use("/api/rider", riderPayoutRoutes);
app.use("/api/rider", riderLocationRoutes);
//app.use("/api/rider", riderIssueRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart-order", cartOrderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/product-requests", productRequestRoutes);

// Handle socket connections
handleConnection(io);
handleRiderConnection(io);
handleAdminConnection(io);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack, error: err })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    apiUrl: `http://localhost:${PORT}/api`
  });

  // Console logs for development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🚴 Rider API: http://localhost:${PORT}/api/rider`);
    console.log(`🔗 Products: http://localhost:${PORT}/api/products`);
  }
});
 