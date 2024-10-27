import express from "express";
import providerController from "../../controllers/provider-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();

router.get("/", providerController.getProviders);
router.post(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    expressSchemaValidator("/providers"),
    providerController.createProvider
);
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    expressSchemaValidator("/providers/:id"),
    providerController.updateProvider
);
router.delete(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    providerController.deleteProvider
);

export default router;
