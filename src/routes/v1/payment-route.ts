import paymentController from "@/controllers/payment-controller";
import express from "express";

const router = express.Router();

router.post("/", paymentController.createPayment);
router.post("/callback", paymentController.acceptPayment);

export default router;
