import express from "express";
import { getAds, createAd, updateAd, deleteAd } from "../controllers/adcontroller.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.get("/", getAds);
router.post("/", protect, authorizeAdmin, createAd);
router.put("/:id", protect, authorizeAdmin, updateAd);
router.delete("/:id", protect, authorizeAdmin, deleteAd);

export default router;
