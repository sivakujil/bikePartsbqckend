import express from "express";
import { createReview, getProductReviews } from "../controllers/reviewcontroller.js";

import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/:product_id", getProductReviews);

export default router;
