import isValidDate from "@/common/helper";
import {InvoiceFullJoin, UserDTO, ZaloPaymentOrder} from "@/common/types";
import invoiceService from "@/services/invoice-service";
import {invoiceStatus, paymentMethod} from "@prisma/client";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {zaloPayConfig} from "@/common/payment-config";
import {OrderRequest, OrderUpdateRequest} from "@/common/schemas";
import {ZaloPaymentResult} from "@/common/types";
import {HmacSHA256} from "crypto-js";
import productService from "@/services/product-service";
import userService from "@/services/user-service";
import InvoiceNotFound from "@/errors/order/order-not-found";
import axios from "axios";
import paymentService from "@/services/payment-service";

const getInvoice = async (req: Request, res: Response) => {
    const invoiceID = req.params.id as string;

    const invoice = await invoiceService.getInvoice(invoiceID);

    if (!invoice) {
        throw new InvoiceNotFound(invoiceID);
    }

    res.status(StatusCodes.OK).json({
        info: invoice,
    });
};

const getInvoices = async (req: Request, res: Response) => {
    const statusParam = req.query.status as string;
    const dateParam = req.query.date as string;
    const userName = req.query.searching as string;
    const currentPage = Number(req.query.currentPage) || 1;
    const userID = req.query.userID as string;
    const invoiceID = req.query.invoiceID as string;

    let date;

    if (isValidDate(dateParam)) {
        date = new Date(dateParam);
    }

    const invoices: InvoiceFullJoin[] = await invoiceService.getInvoices({
        date: date,
        status: statusParam as invoiceStatus,
        userName: userName,
        userID: userID,
        invoiceID: invoiceID,
        currentPage: currentPage,
    });

    const totalInvoices = await invoiceService.getNumberOfInvoices({
        from: date,
        to: date,
        status: statusParam as invoiceStatus,
        invoiceID: invoiceID,
        userName: userName,
    });

    res.status(StatusCodes.OK).json({
        info: {
            invoices: invoices,
            totalInvoices: totalInvoices,
        },
    });
};

const updateInvoice = async (req: Request, res: Response) => {
    const invoiceID = req.params.id as string;
    let payload = req.body as OrderUpdateRequest;

    let invoice = await invoiceService.getInvoice(invoiceID);

    if (!invoice) {
        throw new InvoiceNotFound(ResponseMessage.INVOICE_NOT_FOUND);
    }

    const updatedInvoice = await invoiceService.updateInvoice(
        invoiceID,
        payload
    );

    if (payload.status) {
        if (
            invoiceService.checkIfOrderTurnIntoInvoice(
                invoice.status,
                updatedInvoice.status
            )
        ) {
            const invoice = await invoiceService.getInvoice(invoiceID);
            if (!invoice) {
                throw new InvoiceNotFound(invoiceID);
            }

            //check if products in invoice still valid
            const productsInInvoice =
                invoiceService.getProductsOutOfInvoice(invoice);
            const itemDictionary =
                await productService.getValidProductsInOrder(productsInInvoice);

            //decrease items quantity
            await productService.decearseItemsQuantity(itemDictionary);
        }
    }

    res.status(StatusCodes.OK).json({
        info: updatedInvoice,
    });
};

const createNewOrder = async (req: Request, res: Response) => {
    const order = req.body as OrderRequest;

    let itemDictionary = await productService.getValidProductsInOrder(
        order.invoiceProducts
    );
    const user: UserDTO = await userService.getUserDTOByID(order.userID);

    const validProductsInOrder = invoiceService.getProductsInOrderToInsert(
        order.invoiceProducts,
        itemDictionary
    );

    const invoice = await invoiceService.insertOrder(
        order,
        user,
        validProductsInOrder
    );
    const payload = await invoiceService.getInvoice(invoice.invoiceID);

    if (!payload) {
        throw new InvoiceNotFound(ResponseMessage.INVOICE_NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

const makePayment = async (req: Request, res: Response) => {
    const invoiceID = req.params.id as string;

    const invoice = await invoiceService.getInvoice(invoiceID);
    if (!invoice) {
        throw new InvoiceNotFound(invoiceID);
    }

    //check if products in invoice still valid
    const productsInInvoice = invoiceService.getProductsOutOfInvoice(invoice);
    await productService.getValidProductsInOrder(productsInInvoice);

    // create zalo paymenturl
    const paymentOrder: ZaloPaymentOrder = paymentService.getZaloPayemtOrder(
        invoiceID,
        invoice.userID
    );

    const zaloResponse = await axios.post(zaloPayConfig.endpoint, null, {
        params: paymentOrder,
    });

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: zaloResponse.data.order_url,
    });
};

const acceptPayment = async (req: Request, res: Response) => {
    let result: ZaloPaymentResult = {
        return_code: 0,
        return_message: "",
    };

    try {
        let rawData: string = req.body.data;
        let reqMac: string = req.body.mac;
        let mac: string = HmacSHA256(rawData, zaloPayConfig.key2).toString();

        // Check callback from zaloPay valid or not
        if (reqMac !== mac) {
            // callback invalid
            result.return_code = -1;
            result.return_message = ResponseMessage.REQUEST_MAC_NOT_EQUAL;
        } else {
            // Payment successful
            result.return_code = 1;
            result.return_message = "success";

            // Main payment logic
            const dataJson = JSON.parse(rawData);
            const invoiceID = JSON.parse(dataJson.item)[0] as string;
            const paymentID = dataJson.app_trans_id as string;

            const invoice = await invoiceService.getInvoice(invoiceID);
            if (!invoice) {
                throw new InvoiceNotFound(invoiceID);
            }

            //check if products in invoice still valid
            const productsInInvoice =
                invoiceService.getProductsOutOfInvoice(invoice);
            const itemDictionary =
                await productService.getValidProductsInOrder(productsInInvoice);

            //update invoice
            await invoiceService.updateInvoice(invoiceID, {
                status: invoiceStatus.SHIPPING,
                payment: paymentMethod.BANKING,
                paymentID: paymentID,
            });

            //decrease items quantity
            await productService.decearseItemsQuantity(itemDictionary);
        }
    } catch (error) {
        console.debug(
            `[payment controller]: acceptPayment : fail ${JSON.stringify(
                error,
                null,
                2
            )}`
        );
        result.return_code = 0;
        if (error instanceof Error) {
            result.return_message = error.message;
        }
    }

    // response to zalo
    return res.json(result);
};

export default {
    getInvoices,
    createNewOrder,
    makePayment,
    acceptPayment,
    updateInvoice,
    getInvoice,
};
