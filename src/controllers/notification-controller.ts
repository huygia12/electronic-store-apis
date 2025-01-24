import {ResponseMessage} from "@/common/constants";
import mailService from "@/services/mail-service";
import notificationService from "@/services/notification-service";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const signupForNotification = async (req: Request, res: Response) => {
    const email = req.body.email;

    notificationService.signupForNotification(email);

    const mailContent = mailService.getReceiveNotificationHTMLContent();
    mailService.sendEmail(
        email,
        "Đăng ký nhận thông báo từ HG Store",
        mailContent
    );

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

export default {signupForNotification};
