import express from "express";
import {authMiddleware} from "@/middleware/auth-middleware";
import invoiceController from "@/controllers/invoice-controller";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();

router.get("/:id", invoiceController.getInvoice);
router.post(
    "/count",
    authMiddleware.isAuthorized,
    invoiceController.countInvoices
);
router.get("/", authMiddleware.isAuthorized, invoiceController.getInvoices);
router.post(
    "/",
    authMiddleware.isAuthorized,
    expressSchemaValidator("/invoices"),
    invoiceController.createNewOrder
);
router.patch(
    "/:id/payment",
    authMiddleware.isAuthorized,
    invoiceController.makePayment
);
router.patch(
    "/:id",
    authMiddleware.isAuthorized,
    expressSchemaValidator("/invoices/:id"),
    invoiceController.updateInvoice
);
router.post("/callback", invoiceController.acceptPayment);

export default router;
