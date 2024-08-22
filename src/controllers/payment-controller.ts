import {ResponseMessage} from "@/common/constants";
import {zaloPayConfig} from "@/common/payment-config";
import {ZaloPaymentResult} from "@/common/types";
import paymentService from "@/services/payment-service";
import axios from "axios";
import {HmacSHA256} from "crypto-js";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const createPayment = async (req: Request, res: Response) => {
    const response = await axios.post(zaloPayConfig.endpoint!, null, {
        params: paymentService.getZaloPayemtOrder(),
    });

    console.debug(`[payment controller]: createPayment : success`);
    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: response.data,
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
        let mac: string = HmacSHA256(rawData, zaloPayConfig.key2!).toString();

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
            console.debug(
                `[payment controller]: acceptPayment : app_trans_id ${dataJson["app_trans_id"]}`
            );
        }
    } catch (error) {
        console.debug(
            `[payment controller]: acceptPayment : fail ${JSON.stringify(
                error
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

export default {createPayment, acceptPayment};
