import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import jwtService from "../services/jwt-service";
import userService from "../services/user-service";
import {
    ForgotPasswordRequest,
    LoginRequest,
    PasswordUpdateRequest,
    SignupRequest,
    UserBanningRequest,
    UserUpdateRequest,
    VerifyOTPRequest,
} from "@/common/schemas";
import {
    ClientEvents,
    ServerEvents,
    UserInTokenPayload,
    UserResponseDTO,
} from "@/common/types";
import {AuthToken, ResponseMessage, UserRole} from "@/common/constants";
import MissingTokenError from "@/errors/auth/missing-token";
import UserCannotBeDeleted from "@/errors/user/user-cannot-be-deleted";
import {Server, Socket} from "socket.io";
import {socketIOSchemaValidator} from "@/middleware/schema-validator";
import ms from "ms";
import mailService from "@/services/mail-service";

const signup = async (req: Request, res: Response) => {
    const userSignupReq = req.body as SignupRequest;

    const user = await userService.insertUser(userSignupReq);

    const mailContent = mailService.getSignupHTMLContent(user.userName);
    mailService.sendEmail(
        user.email,
        "Đăng ký tài khoản HG Store",
        mailContent
    );

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: user,
    });
};

const login = async (req: Request, res: Response) => {
    const loginReq = req.body as LoginRequest;
    const rtInCookie = req.cookies.refreshToken as string | undefined;

    const {refreshToken, accessToken} = await userService.login(
        rtInCookie,
        loginReq
    );

    res.cookie(AuthToken.RF, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms(jwtService.REFRESH_TOKEN_LIFE_SPAN),
    });

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            accessToken: accessToken,
        },
    });
};

const logout = async (req: Request, res: Response) => {
    const rtFromCookie = req.cookies.refreshToken as string;

    if (rtFromCookie) {
        const user = jwtService.decodeToken(rtFromCookie) as UserInTokenPayload;

        await userService.logout(rtFromCookie, user.userID);
    }

    res.removeHeader("Authorization");
    res.clearCookie(AuthToken.RF);
    res.status(StatusCodes.OK).json({message: ResponseMessage.SUCCESS});
};

/**
 * Make new access token. Also checking if DB is containing this refresh token or not
 * If not, then clear all the refresh token in the DB and user must login again for new valid refresh token
 *
 * @param {Request} req
 * @param {Response} res
 */
const refreshToken = async (req: Request, res: Response) => {
    const rtFromCookie = req.cookies.refreshToken as string;

    if (!rtFromCookie) {
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    const {refreshToken, accessToken} =
        await userService.refreshToken(rtFromCookie);

    //set token to cookie
    res.cookie(AuthToken.RF, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms(jwtService.REFRESH_TOKEN_LIFE_SPAN),
    });

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            accessToken: accessToken,
        },
    });
};

/**
 * Update user information(not include password)
 * If updated email had already been existed in DB, return
 *
 * @param {Request} req
 * @param {Response} res
 */
const updateInfo = async (req: Request, res: Response) => {
    const userID = req.params.id as string;
    const userUpdateReq = req.body as UserUpdateRequest;

    const updatedUser: UserResponseDTO = await userService.updateUserInfo(
        userID,
        userUpdateReq
    );

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: updatedUser,
    });
};

const getUser = async (req: Request, res: Response) => {
    const userID = req.params.id as string;

    const user: UserResponseDTO | null =
        await userService.getUserResponseByID(userID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: user,
    });
};

const getUsers = async (req: Request, res: Response) => {
    const recently = Boolean(req.query.recently);
    const searching = req.query.searching as string;
    const currentPage = Number(req.query.currentPage) || 1;
    let date: Date | undefined;

    if (recently) {
        date = new Date();
    }

    const users: UserResponseDTO[] = await userService.getUserResponseDTOs({
        date: date,
        searching: searching,
        currentPage: currentPage,
    });

    const totalUsers = await userService.getNumberOfUsers({
        date: date,
        searching: searching,
    });

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            users: users,
            totalUsers: totalUsers,
        },
    });
};

const deleteUser = async (req: Request, res: Response) => {
    const userID = req.params.id as string;

    const user = await userService.getUserDTOByID(userID);

    if (user.role === UserRole.ADMIN) {
        throw new UserCannotBeDeleted(ResponseMessage.ADMIN_CANNOT_BE_DELETED);
    }

    await userService.deleteUserByID(userID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateUserPassword = async (req: Request, res: Response) => {
    const userID = req.params.id as string;
    const payload = req.body as PasswordUpdateRequest;

    const user = await userService.getUserDTOByID(userID);

    await userService.updatePassword(user.email, payload);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const forgotPassword = async (req: Request, res: Response) => {
    const payload = req.body as ForgotPasswordRequest;

    const otp = await userService.generateOTP(payload.email);
    const htmlContent = mailService.getOTPHTMLContent(otp);
    mailService.sendEmail(payload.email, `Mã OTP`, htmlContent);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const verifyOTP = async (req: Request, res: Response) => {
    const payload = req.body as VerifyOTPRequest;

    const newPassword = await userService.verifyOTP(payload.email, payload.otp);

    if (newPassword) {
        const htmlContent = mailService.getNewPasswordHTMLContent(newPassword);
        mailService.sendEmail(payload.email, `Mật khẩu mới`, htmlContent);
    }

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            result: newPassword !== null,
        },
    });
};

const registerUserSocketHandlers = (
    io: Server<ClientEvents, ServerEvents>,
    socket: Socket<ClientEvents, ServerEvents>
) => {
    socket.on(`user:join`, (payload) => {
        socket.join(`user:${payload.userID}`);
    });

    socket.on(`user:leave`, (payload) => {
        socket.leave(`user:${payload.userID}`);
    });

    socket.on(`admin:join`, () => {
        socket.join(`admin:room`);
    });

    socket.on(`admin:leave`, () => {
        socket.leave(`admin:room`);
    });

    const banUser = async (payload: UserBanningRequest, callback: unknown) => {
        if (typeof callback !== "function") {
            //not an acknowledgement
            return socket.disconnect();
        }
        const validateResult: boolean = socketIOSchemaValidator(
            `user:ban`,
            payload,
            callback
        );
        if (!validateResult) return;

        try {
            await userService.updateUserInfo(payload.userID, {
                isBanned: payload.banned,
            });

            io.to(`user:${payload.userID}`).emit("user:ban");
            callback(undefined);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[error handler] ${error.name} : ${error.stack}`);
            } else {
                console.error(`[error handler] unexpected error : ${error}`);
            }

            callback({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                message: ResponseMessage.UNEXPECTED_ERROR,
            });
        }
    };

    socket.on(`user:ban`, banUser);
};

export default {
    signup,
    login,
    logout,
    refreshToken,
    updateInfo,
    getUser,
    getUsers,
    deleteUser,
    registerUserSocketHandlers,
    updateUserPassword,
    forgotPassword,
    verifyOTP,
};
