import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import jwtService from "../services/jwt-service";
import userService from "../services/user-service";
import {TokenExpiredError} from "jsonwebtoken";
import {
    LoginRequest,
    PasswordUpdateRequest,
    SignupRequest,
    UserBanningRequest,
    UserUpdateRequest,
} from "@/common/schemas";
import {
    ClientEvents,
    Nullable,
    Optional,
    ServerEvents,
    UserDTO,
    UserInTokenPayload,
    UserResponseDTO,
} from "@/common/types";
import {AuthToken, ResponseMessage, UserRole} from "@/common/constants";
import UserNotFoundError from "@/errors/user/user-not-found";
import UserAlreadyLoginError from "@/errors/user/user-already-login";
import InvalidTokenError from "@/errors/auth/invalid-token";
import MissingTokenError from "@/errors/auth/missing-token";
import UserCannotBeDeleted from "@/errors/user/user-cannot-be-deleted";
import {Server, Socket} from "socket.io";
import {socketIOSchemaValidator} from "@/middleware/schema-validator";

/**
 * Make user registration
 * If input email had been registed by other user, then response 'user already exist'
 * If not, add user info to the DB with no provided token yet
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const signup = async (req: Request, res: Response) => {
    const userSignupReq = req.body as SignupRequest;

    const user = await userService.insertUser(userSignupReq);

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: user,
    });
};

/**
 * Log user in the user
 * If the current tokens are still valid, then return `Already login`
 * If not, create tokens and send back in header; body'response will go with the user'information
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const login = async (req: Request, res: Response) => {
    const loginReq = req.body as LoginRequest;

    //If both token are verified and refresh token is stored in DB, then will not create new token
    try {
        const accessToken: Optional<string | string[]> =
            req.headers["authorization"];
        const refreshTokenFromCookie: string = req.cookies.refreshToken;

        if (typeof accessToken !== "string") {
            throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
        }
        // Get userID from accesstoken payload
        const userDecoded = jwtService.verifyAuthToken(
            accessToken.replace("Bearer ", ""),
            AuthToken.AC
        ) as UserInTokenPayload;

        // Query user
        const userDTO: Nullable<UserDTO> = await userService.getUserDTOByID(
            userDecoded.userID
        );

        if (!userDTO)
            throw new UserNotFoundError(ResponseMessage.USER_NOT_FOUND);

        const tokenBucket: string[] = userDTO.refreshTokensUsed.filter(
            (token) => token === refreshTokenFromCookie
        );

        // If refresh token already existed in DB
        if (tokenBucket.length !== 0) {
            try {
                jwtService.verifyAuthToken(
                    refreshTokenFromCookie,
                    AuthToken.RF
                );
            } catch (error: any) {
                // If DB had that refreshToken which has been expired already so must delete that
                if (error instanceof TokenExpiredError) {
                    await userService.deleteRefreshToken(
                        refreshTokenFromCookie,
                        userDecoded.userID
                    );

                    // and keep processing the login
                    throw {};
                }
            }
            // User already been login
            throw new UserAlreadyLoginError("");
        }
    } catch (error: any) {
        if (error instanceof UserAlreadyLoginError) {
            // Go in here if user already been login
            throw new UserAlreadyLoginError(ResponseMessage.USER_ALREADY_LOGIN);
        }
    }

    const accessToken: string = await userService.login(res, loginReq);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            accessToken: accessToken,
        },
    });
};

/**
 * Log user out, clear user's token
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const logout = async (req: Request, res: Response) => {
    const refreshTokenFromCookie = req.cookies.refreshToken as string;

    if (refreshTokenFromCookie) {
        const user = jwtService.decodeToken(
            refreshTokenFromCookie
        ) as UserInTokenPayload;

        await userService.deleteRefreshToken(
            refreshTokenFromCookie,
            user.userID
        );
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
    const refreshTokenFromCookie = req.cookies.refreshToken as string;

    if (!refreshTokenFromCookie) {
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    try {
        const userDecoded = jwtService.verifyAuthToken(
            refreshTokenFromCookie,
            AuthToken.RF
        ) as UserInTokenPayload;

        //Hacker's request: must clear all refresh token to login again
        const existing: boolean =
            await userService.checkIfRefreshTokenExistInDB(
                refreshTokenFromCookie,
                userDecoded.userID
            );

        if (!existing) {
            await userService.clearUserRefreshTokenUsed(userDecoded.userID);
            throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
        }

        //Down here token must be valid
        await userService.deleteRefreshToken(
            refreshTokenFromCookie,
            userDecoded.userID
        );
        const accessToken: string = await userService.refreshToken(
            res,
            userDecoded.userID
        );
        res.status(StatusCodes.OK).json({
            message: ResponseMessage.SUCCESS,
            info: {
                accessToken: accessToken,
            },
        });
    } catch {
        throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
    }
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

    const user: Nullable<UserResponseDTO> =
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
    let date: Optional<Date>;

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

const registerUserSocketHandlers = (
    io: Server<ClientEvents, ServerEvents>,
    socket: Socket<ClientEvents, ServerEvents>
) => {
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

            io.emit("user:ban", {
                userID: payload.userID,
            });
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
};
