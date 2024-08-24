import paymentController from "@/controllers/payment-controller";
import schemaValidator from "@/middleware/schema-validator";
import express from "express";

const router = express.Router();

router.post("/", schemaValidator("/invoices"), paymentController.createPayment);
router.post("/callback", paymentController.acceptPayment);

export default router;
