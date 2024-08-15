import express from "express";
import providerController from "../../controllers/provider-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();

router.get("/", providerController.getProviders);
router.post(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    schemaValidator("/providers"),
    providerController.createProvider
);
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    schemaValidator("/providers/:id"),
    providerController.updateProvider
);
router.delete(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    providerController.deleteProvider
);

export default router;
