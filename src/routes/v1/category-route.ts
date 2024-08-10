import express from "express";
import categoryController from "../../controllers/category-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();
router.use(authMiddleware.isAuthorized);

router.get("/", categoryController.getCategories);
router.post(
    "/",
    authMiddleware.isAdmin,
    schemaValidator("/categories"),
    categoryController.createCategory
);
router.put(
    "/:id",
    authMiddleware.isAdmin,
    schemaValidator("/categories/:id"),
    categoryController.updateCategory
);
router.delete(
    "/:id",
    authMiddleware.isAdmin,
    categoryController.deleteCategory
);

export default router;
