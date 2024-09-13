import express from "express";
import {authMiddleware} from "@/middleware/auth-middleware";
import invoiceController from "@/controllers/invoice-controller";

const router = express.Router();

router.use(authMiddleware.isAuthorized);

router.get("/", invoiceController.getInvoices);

export default router;
