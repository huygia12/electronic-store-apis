import isValidDate from "@/common/helper";
import {InvoiceFullJoin, UserDTO} from "@/common/types";
import invoiceService from "@/services/invoice-service";
import {invoiceStatus} from "@prisma/client";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {zaloPayConfig} from "@/common/payment-config";
import {OrderRequest} from "@/common/schemas";
import {ZaloPaymentResult} from "@/common/types";
import {HmacSHA256} from "crypto-js";
import productService from "@/services/product-service";
import userService from "@/services/user-service";

const getInvoices = async (req: Request, res: Response) => {
    const statusParam = req.query.status as string;
    const dateParam = req.query.date as string;
    const limit = parseInt(req.query.limit as string, 10) || undefined;
    let status;
    let date;

    if (isValidDate(dateParam)) {
        date = new Date(dateParam);
    }

    Array(invoiceStatus).map((iter) => {
        if (`${iter}`.toUpperCase() === statusParam) {
            status = iter;
        }
    });

    console.debug(`[invoice controller]: getInvoices: ${limit}`);
    const invoices: InvoiceFullJoin[] = await invoiceService.getInvoices(
        date,
        status,
        limit
    );

    console.debug(`[invoice controller]: getInvoices: succeed `);
    res.status(StatusCodes.OK).json({
        info: invoices,
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

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

const makePayment = async (req: Request, res: Response) => {
    //TODO: check if the orderProducts still valid, update the order state, decrease the number of productItems
    const orderID = req.params.id as string;

    // await productService.checkIfProductsInOrderValid(order.invoiceProducts);

    // const paymentOrder: ZaloPaymentOrder =
    //     await paymentService.getZaloPayemtOrder(orderID);

    // const zaloResponse = await axios.post(zaloPayConfig.endpoint, null, {
    //     params: paymentOrder,
    // });

    // return res.status(StatusCodes.OK).json({
    //     message: ResponseMessage.SUCCESS,
    //     info: zaloResponse.data,
    // });
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

            // TODO: add order to DB
            let dataJson = JSON.parse(rawData);

            console.log(JSON.stringify(dataJson, null, 2));
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

export default {getInvoices, createNewOrder, makePayment, acceptPayment};
