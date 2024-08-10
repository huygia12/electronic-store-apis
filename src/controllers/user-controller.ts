import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import jwtService from "../services/jwt-service";
import userService from "../services/user-service";
import {TokenExpiredError} from "jsonwebtoken";
import {LoginRequest, SignupRequest, UserUpdateRequest} from "@/common/schemas";
import {
    Nullable,
    Optional,
    UserDTO,
    UserInTokenPayload,
    UserResponseDTO,
} from "@/common/types";
import {AuthToken, ResponseMessage} from "@/common/constants";
import UserNotFoundError from "@/errors/user/user-not-found";
import UserAlreadyLoginError from "@/errors/user/user-already-login";
import InvalidTokenError from "@/errors/auth/invalid-token";
import MissingTokenError from "@/errors/auth/missing-token";

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
    const userSignupReq: SignupRequest = req.body;

    await userService.insertUser(userSignupReq);

    console.debug(
        `[user controller]: Signup: user with email ${userSignupReq.email} has been signup successfull`
    );
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
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
    const loginReq: LoginRequest = req.body;

    //If both token are verified and refresh token is stored in DB, then will not create new token
    try {
        const accessTokenFromCookie: string = req.cookies.accessToken;
        const refreshTokenFromCookie: string = req.cookies.refreshToken;

        console.debug(
            `[user controller]: Login: refreshToken=${refreshTokenFromCookie} and \n accessToken=${accessTokenFromCookie}`
        );
        // Get userID from accesstoken payload
        const userDecoded = jwtService.verifyAuthToken(
            accessTokenFromCookie,
            AuthToken.AC
        ) as UserInTokenPayload;

        console.debug(
            `[user controller]: Login: userDecoded=${JSON.stringify(
                userDecoded
            )}`
        );
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
                    console.debug(
                        `[user controller]: Login: token generating denied`
                    );
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
            console.debug(
                `[user controller]: Login: user already been logged in`
            );
            throw new UserAlreadyLoginError(ResponseMessage.USER_ALREADY_LOGIN);
        }

        console.debug(
            `[user controller]: login : error=${JSON.stringify(error)}`
        );
    }

    console.debug(`[user controller]: Login: starting login process...`);
    await userService.login(res, loginReq);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

/**
 * Log user out, clear user's token
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const logout = async (req: Request, res: Response) => {
    const refreshTokenFromCookie: Optional<string> = req.cookies.refreshToken;

    if (refreshTokenFromCookie) {
        const user = jwtService.decodeToken(
            refreshTokenFromCookie
        ) as UserInTokenPayload;

        await userService.deleteRefreshToken(
            refreshTokenFromCookie,
            user.userID
        );
    }

    console.debug(`[user controller]: Logout successfull`);
    res.clearCookie(AuthToken.AC);
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
    const refreshTokenFromCookie: Optional<string> = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
        console.debug(
            `[user controller]: refresh token: Refresh token not found`
        );
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
            console.debug(
                `[user controller]: Unknown refresh token: auto clear all refresh token in database`
            );
            await userService.clearUserRefreshTokenUsed(userDecoded.userID);
            throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
        }

        //Down here token must be valid
        await userService.refreshToken(res, userDecoded.userID);
        res.status(StatusCodes.OK).json({
            message: "Update succeed",
        });
    } catch {
        console.debug(
            `[user controller] Check refresh token's authorization failure: invalid token`
        );
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
    const userID: string = req.params.id;
    const userUpdateReq: UserUpdateRequest = req.body;

    const updatedUser: UserResponseDTO = await userService.updateUserInfo(
        userID,
        userUpdateReq
    );

    console.debug(`[user controller] update user successfull`);
    res.status(StatusCodes.OK).json({
        message: "Update succeed",
        infor: updatedUser,
    });
};

const getUser = async (req: Request, res: Response) => {
    const userID: string = req.params.id;

    const user: Nullable<UserResponseDTO> =
        await userService.getUserResponseByID(userID);

    console.debug(`[user controller]: get user successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        infor: user,
    });
};

const getUsers = async (req: Request, res: Response) => {
    const users: UserResponseDTO[] = await userService.getUserResponseDTOs();

    console.debug(`[user controller]: get users successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        infor: users,
    });
};

export default {
    signup,
    login,
    logout,
    refreshToken,
    updateInfo,
    getUser,
    getUsers,
};
