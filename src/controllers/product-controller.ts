import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import productService from "../services/product-service";
import {ClientEvents, ProductFullJoin, ServerEvents} from "@/common/types";
import {ProductRequest} from "@/common/schemas";
import {ResponseMessage, Sort} from "@/common/constants";
import {Server, Socket} from "socket.io";

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
    const searching = req.query.searching as string;
    const categoryID = req.query.categoryID as string;
    const providerID = req.query.providerID as string;
    const exceptID = req.query.exceptID as string;
    const currentPage = Number(req.query.currentPage) || 1;
    const limit = Number(req.query.limit);
    const sale = Boolean(req.query.sale);
    const detail = Boolean(req.query.detail);
    const sortByPrice = req.query.sortByPrice as Sort;
    const sortByName = req.query.sortByname as Sort;
    const optionsString = req.query.optionIDs as string;
    const minPrice = Number(req.query.minPrice) || 100000;
    const maxPrice = Number(req.query.maxPrice) || 100000000;
    let products;

    let optionIDs: string[] | undefined;
    if (optionsString) {
        optionIDs = optionsString.split(",");
    }
    if (!detail) {
        products = await productService.getProductsSummary({
            categoryID: categoryID,
            providerID: providerID,
            searchingName: searching,
            currentPage: currentPage,
        });
    } else {
        products = await productService.getProductFullJoinList({
            categoryID: categoryID,
            providerID: providerID,
            sale: sale,
            limit: limit,
            sortByPrice: sortByPrice,
            sortByName: sortByName,
            exceptID: exceptID,
            maxPrice: maxPrice,
            minPrice: minPrice,
            optionIDs: optionIDs,
            currentPage: currentPage,
        });
    }

    let totalProducts = await productService.getNumberOfProducts({
        categoryID: categoryID,
        providerID: providerID,
        sale: sale,
        limit: limit,
        maxPrice: maxPrice,
        minPrice: minPrice,
        optionIDs: optionIDs,
        searchingName: searching,
        exceptID: exceptID,
    });

    console.debug(`[product controller]: get products successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            products: products,
            totalProducts: totalProducts,
        },
    });
};

const registerProductSocketHandlers = (
    io: Server<ClientEvents, ServerEvents>,
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
