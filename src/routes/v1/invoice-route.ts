import express from "express";
import {authMiddleware} from "@/middleware/auth-middleware";
import invoiceController from "@/controllers/invoice-controller";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();

router.get("/", authMiddleware.isAuthorized, invoiceController.getInvoices);
router.post(
    "/",
    authMiddleware.isAuthorized,
    expressSchemaValidator("/invoices"),
    invoiceController.createNewOrder
);
router.patch(
    "/:id",
    authMiddleware.isAuthorized,
    invoiceController.makePayment
);
router.post("/callback", invoiceController.acceptPayment);

export default router;
