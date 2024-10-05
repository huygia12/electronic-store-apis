import config from "@/common/app-config";
import {zaloPayConfig} from "@/common/payment-config";
import {OrderRequest} from "@/common/schemas";
import {ProductJoinWithItems, UserDTO, ZaloPaymentOrder} from "@/common/types";
import {HmacSHA256} from "crypto-js";
import moment from "moment";
import userService from "./user-service";
import productService from "./product-service";
import prisma from "@/common/prisma-client";
import {invoiceStatus, paymentMethod} from "@prisma/client";
import {ResponseMessage} from "@/common/constants";
import ProductNotFoundError from "@/errors/product/product-not-found";

const getZaloPayemtOrder = (validPayload: OrderRequest): ZaloPaymentOrder => {
    const embed_data = {
        redirecturl: zaloPayConfig.redirect,
    };

    const transID: number = Math.floor(Math.random() * 1000000);

    const order: ZaloPaymentOrder = {
        app_id: parseInt(zaloPayConfig.app_id!),
        app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
        app_user: "user123",
        app_time: Date.now(),
        item: JSON.stringify([validPayload]),
        embed_data: JSON.stringify(embed_data),
        amount: 50000,
        description: `GH Shop - Payment for the order #${transID}`,
        bank_code: "",
        callback_url: `${config.APP_DOMAIN}/v1/invoices/callback`,
        mac: "",
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data: string =
        zaloPayConfig.app_id +
        "|" +
        order.app_trans_id +
        "|" +
        order.app_user +
        "|" +
        order.amount +
        "|" +
        order.app_time +
        "|" +
        order.embed_data +
        "|" +
        order.item;
    order.mac = HmacSHA256(data, zaloPayConfig.key1!).toString();

    return order;
};

// const createOrderProducts = (
//     products: ProductJoinWithItems[],
//     invoiceID: string
// ): OrderProductInsertion[] => {
//     return products.reduce<OrderProductInsertion[]>((prev, curr) => {
//         curr.productItems.forEach((item) => {
//             prev.push({
//                 discount: item.discount,
//                 price: item.price,
//                 productName: item.productCode,
//                 quantity: item.quantity,
//                 invoiceID: invoiceID,
//                 productID: curr.productID,
//                 productCode: item.productCode,
//                 thump: item.thump,
//                 color: item.color,
//                 storage: item.storage,
//                 categoryName: curr.category.categoryName,
//                 providerName: curr.provider.providerName,
//             });
//         });
//         return prev;
//     }, []);
// };

const makeOrder = async (validPayload: OrderRequest, paymentID: string) => {
    const user: UserDTO = await userService.getUserDTOByID(validPayload.userID);

    const products: ProductJoinWithItems[] =
        await productService.getProductsWithSpecificItem(
            validPayload.invoiceProducts
        );

    if (products.length <= 0) {
        console.debug(`[payment service]: products in order not found`);
        throw new ProductNotFoundError(ResponseMessage.PRODUCT_NOT_FOUND);
    }

    await prisma.$transaction(async (prisma) => {
        const invoiceID: string = (
            await prisma.invoice.create({
                data: {
                    status: invoiceStatus.NEW,
                    payment: paymentMethod.BANKING,
                    district: validPayload.district,
                    ward: validPayload.ward,
                    province: validPayload.province,
                    phoneNumber: validPayload.phoneNumber,
                    detailAddress: validPayload.detailAddress,
                    createdAt: new Date(),
                    email: validPayload.email,
                    userID: user.userID,
                    userName: user.userName,
                    note: validPayload.note,
                    paymentID: paymentID,
                    shippingFee: validPayload.shippingFee,
                    shippingTime: validPayload.shippingTime,
                },
                select: {
                    invoiceID: true,
                },
            })
        ).invoiceID;

        // await prisma.invoiceProduct.createMany({
        //     data: createOrderProducts(products, invoiceID),
        // });
    });
};

export default {
    getZaloPayemtOrder,
    makeOrder,
};
