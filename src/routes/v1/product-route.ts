import express from "express";
import productController from "../../controllers/product-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    expressSchemaValidator("/products"),
    productController.createProduct
);
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    expressSchemaValidator("/products/:id"),
    productController.updateProduct
);
router.delete("/:id", authMiddleware.isAdmin, productController.deleteProduct);

export default router;
