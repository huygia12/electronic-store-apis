import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import productService from "../services/product-service";
import {ProductFullJoin} from "@/common/types";
import {ProductRequest} from "@/common/schemas";
import {ResponseMessage} from "@/common/constants";

const createProduct = async (req: Request, res: Response) => {
    const productCreateReq: ProductRequest = req.body;

    await productService.createProduct(productCreateReq);

    console.debug(
        `[product controller]: create product ${productCreateReq.productName} successfull`
    );
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateProduct = async (req: Request, res: Response) => {
    const productID: string = req.params.id;
    const productUpdateReq: ProductRequest = req.body;

    await productService.updateProduct(productUpdateReq, productID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const deleteProduct = async (req: Request, res: Response) => {
    const productID: string = req.params.id;

    await productService.deleteProduct(productID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getProduct = async (req: Request, res: Response) => {
    const productID: string = req.params.id;

    const product: ProductFullJoin =
        await productService.getProductFullJoinWithID(productID);

    console.debug(`[product controller]: get product successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: product,
    });
};

const getProducts = async (req: Request, res: Response) => {
    const categoryID = req.query.categoryID as string;
    const providerID = req.query.providerID as string;
    const detail = Number(req.query.detail);

    let payload = null;
    if (detail === 1) {
        payload = await productService.getProductsSummary();
    } else {
        payload = await productService.getProductsFullJoinAfterFilter(
            categoryID,
            providerID
        );
    }
    console.debug(`[product controller]: get products successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

export default {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProduct,
};
