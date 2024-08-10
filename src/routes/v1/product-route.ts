import express from "express";
import productController from "../../controllers/product-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();
router.use(authMiddleware.isAuthorized);

router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);
router.post(
    "/",
    authMiddleware.isAdmin,
    schemaValidator("/products"),
    productController.createProduct
);
router.put(
    "/:id",
    authMiddleware.isAdmin,
    schemaValidator("/products/:id"),
    productController.updateProduct
);
router.delete("/:id", authMiddleware.isAdmin, productController.deleteProduct);

export default router;
