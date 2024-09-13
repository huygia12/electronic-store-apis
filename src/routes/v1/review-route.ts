import express from "express";
import reviewController from "@/controllers/review-controller";

const router = express.Router();

router.get("/", reviewController.getReviews);

export default router;
