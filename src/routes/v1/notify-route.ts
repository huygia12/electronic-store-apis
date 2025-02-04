import express from "express";
import notificationController from "../../controllers/notification-controller";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();
router.post(
    "/",
    expressSchemaValidator("/notification"),
    notificationController.signupForNotification
);

export default router;
