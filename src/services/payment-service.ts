import config from "@/common/app-config";
import {zaloPayConfig} from "@/common/payment-config";
import {ZaloPaymentOrder} from "@/common/types";
import {HmacSHA256} from "crypto-js";
import moment from "moment";

const getZaloPayemtOrder = (
    invoiceID: string,
    userID: string,
    invoiceAmount: number
): ZaloPaymentOrder => {
    const embed_data = {
        redirecturl: `${config.CLIENT_DOMAIN}/?paidInvoiceID=${invoiceID}&userID=${userID}`,
    };

    const transID: number = Math.floor(Math.random() * 1000000);

    const order: ZaloPaymentOrder = {
        app_id: parseInt(zaloPayConfig.app_id!),
        app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
        app_user: "user123",
        app_time: Date.now(),
        item: JSON.stringify([invoiceID]),
        embed_data: JSON.stringify(embed_data),
        amount: invoiceAmount,
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

export default {
    getZaloPayemtOrder,
};
