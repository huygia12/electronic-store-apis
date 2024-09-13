import paymentController from "@/controllers/payment-controller";
import {expressSchemaValidator} from "@/middleware/schema-validator";
import express from "express";

const router = express.Router();

router.post(
    "/",
    expressSchemaValidator("/invoices"),
    paymentController.createPayment
);
router.post("/callback", paymentController.acceptPayment);

export default router;
