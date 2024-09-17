import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import productService from "../services/product-service";
import {
    ClientEvents,
    Optional,
    ProductFullJoin,
    ServerEvents,
} from "@/common/types";
import {ProductRequest} from "@/common/schemas";
import {ResponseMessage} from "@/common/constants";
import {Namespace, Server, Socket} from "socket.io";

const createProduct = async (req: Request, res: Response) => {
    const productCreateReq = req.body as ProductRequest;

    await productService.createProduct(productCreateReq);

    console.debug(
        `[product controller]: create product ${productCreateReq.productName} successfull`
    );
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateProduct = async (req: Request, res: Response) => {
    const productID = req.params.id as string;
    const productUpdateReq: ProductRequest = req.body;

    await productService.updateProduct(productUpdateReq, productID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const deleteProduct = async (req: Request, res: Response) => {
    const productID = req.params.id as string;

    await productService.deleteProduct(productID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getProduct = async (req: Request, res: Response) => {
    const productID = req.params.id as string;

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
    const productName = req.query.productName as string;
    const limit = Number(req.query.limit);
    const detail = Number(req.query.detail);

    let payload = null;
    if (detail === 1) {
        payload = await productService.getProductsSummary(productName, limit);
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

const registerProductSocketHandlers = (
    nameSpace: Namespace,
    socket: Socket<ClientEvents, ServerEvents>
) => {
    socket.on(`product:join`, (payload) => {
        socket.join(`product:${payload.productID}`);
        console.debug(
            `[socket server]: join user to product room : { socketID : ${socket.id}}`
        );
    });

    socket.on(`product:leave`, (payload) => {
        socket.leave(`product:${payload.productID}`);
        console.debug(
            `[socket server]: user leaving from product : { socketID : ${socket.id}}`
        );
    });
};

export default {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProduct,
    registerProductSocketHandlers,
};
