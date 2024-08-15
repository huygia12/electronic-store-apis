import express from "express";
import categoryController from "../../controllers/category-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();

router.get("/", categoryController.getCategories);
router.post(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    schemaValidator("/categories"),
    categoryController.createCategory
);
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    schemaValidator("/categories/:id"),
    categoryController.updateCategory
);
router.delete(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    categoryController.deleteCategory
);

export default router;
