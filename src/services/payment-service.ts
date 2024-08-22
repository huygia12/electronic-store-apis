import config from "@/common/app-config";
import {zaloPayConfig} from "@/common/payment-config";
import {OrderRequest} from "@/common/schemas";
import {UserDTO, ZaloPaymentOrder} from "@/common/types";
import {HmacSHA256} from "crypto-js";
import moment from "moment";
import userService from "./user-service";

const getZaloPayemtOrder = (): ZaloPaymentOrder => {
    const embed_data = {
        redirecturl: zaloPayConfig.redirect,
    };

    const transID: number = Math.floor(Math.random() * 1000000);

    const order: ZaloPaymentOrder = {
        app_id: parseInt(zaloPayConfig.app_id!),
        app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
        app_user: "user123",
        app_time: Date.now(),
        item: JSON.stringify([]),
        embed_data: JSON.stringify(embed_data),
        amount: 50000,
        description: `GH Shop - Payment for the order #${transID}`,
        bank_code: "",
        callback_url: `${config.APP_DOMAIN}/v1/payment/callback`,
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

const makeOrder = async (validPayload: OrderRequest) => {
    const user: UserDTO = await userService.getUserDTOByID(validPayload.userID);

    // const;
    // await prisma.$transaction([]);
};

export default {
    getZaloPayemtOrder,
    makeOrder,
};
