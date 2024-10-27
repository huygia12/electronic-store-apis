import cors from "cors";
import express from "express";
import storeController from "@/controllers/store-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import {expressSchemaValidator} from "@/middleware/schema-validator";
import {options} from "@/common/cors-config";

const router = express.Router();

router.use(cors(options));

router.get("/", storeController.getStore);
router.get("/:id/slides", storeController.getSliderImages);
// router.patch(
//     "/:id/slides",
//     authMiddleware.isAuthorized,
//     authMiddleware.isAdmin,
//     expressSchemaValidator("/stores/:id/slides"),
//     storeController
// );
router.patch(
    "/:id/banners",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    expressSchemaValidator("/stores/:id/banners"),
    storeController.updateBanner
);

export default router;
