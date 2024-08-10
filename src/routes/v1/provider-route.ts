import express from "express";
import providerController from "../../controllers/provider-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();
router.use(authMiddleware.isAuthorized);

router.get("/", providerController.getProviders);
router.post(
    "/",
    authMiddleware.isAdmin,
    schemaValidator("/providers"),
    providerController.createProvider
);
router.put(
    "/:id",
    authMiddleware.isAdmin,
    schemaValidator("/providers/:id"),
    providerController.updateProvider
);
router.delete(
    "/:id",
    authMiddleware.isAdmin,
    providerController.deleteProvider
);

export default router;
