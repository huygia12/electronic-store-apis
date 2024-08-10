import express from "express";
import attributeController from "../../controllers/attribute-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();

router.use(authMiddleware.isAuthorized);

router.get("/", attributeController.getAttributes);
router.post(
    "/",
    authMiddleware.isAdmin,
    schemaValidator("/attributes"),
    attributeController.createAttributeType
);
router.put(
    "/:typeID",
    authMiddleware.isAdmin,
    schemaValidator("/attributes/:typeID"),
    attributeController.updateAttributeType
);
router.delete(
    "/:typeID",
    authMiddleware.isAdmin,
    attributeController.deleteAttributeType
);

// Options
router.post(
    "/:typeID/options",
    authMiddleware.isAdmin,
    schemaValidator("/attributes/:typeID/options"),
    attributeController.createAttributeOption
);
router.put(
    "/:typeID/options/:optionID",
    authMiddleware.isAdmin,
    schemaValidator("/attributes/:typeID/options/:optionID"),
    attributeController.updateAttributeOption
);
router.delete(
    "/:typeID/options/:optionID",
    authMiddleware.isAdmin,
    attributeController.deleteAttributeOption
);

export default router;
