import express, {Request, Response} from "express";
import userRoute from "./v1/user-route";
import productRoute from "./v1/product-route";
import providerRoute from "./v1/provider-route";
import categoryRoute from "./v1/category-route";
import attributeRoute from "./v1/attribute-route";
import paymentRoute from "./v1/payment-route";
import {NextFunction} from "express-serve-static-core";

const router = express.Router();
const space = (req: Request, res: Response, next: NextFunction) => {
    console.log("\n");
    next();
};

router.use("/v1/users", space, userRoute);
router.use("/v1/providers", space, providerRoute);
router.use("/v1/categories", space, categoryRoute);
router.use("/v1/attributes", space, attributeRoute);
router.use("/v1/products", space, productRoute);
router.use("/v1/invoices", space, paymentRoute);
router.get("/healthcheck", (req: Request, res: Response) =>
    res.sendStatus(200)
);
export const API_v1 = router;
