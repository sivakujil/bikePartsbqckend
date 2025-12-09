import express from "express";
import bodyParser from "body-parser";
import { createPayment, getPayments, stripeWebhook, getPaymentByOrderId, getPaymentBySessionId } from "../controllers/PaymentControllers.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/webhook", bodyParser.raw({ type: "application/json" }), stripeWebhook);
router.post("/", protect, createPayment);
router.get("/", protect, authorizeAdmin, getPayments);
router.get("/order/:orderId", protect, getPaymentByOrderId);
router.get("/session/:sessionId", protect, getPaymentBySessionId);

export default router;
