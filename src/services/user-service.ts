import {compareSync, hashSync} from "bcrypt";
import {
    LoginRequest,
    PasswordUpdateRequest,
    SignupRequest,
    UserUpdateRequest,
} from "@/common/schemas";
import {type User, userRole} from "@prisma/client";
import prisma from "@/common/prisma-client";
import {
    Nullable,
    Optional,
    UserDTO,
    UserInTokenPayload,
    UserResponseDTO,
} from "@/common/types";
import UserAlreadyExistError from "@/errors/user/user-already-exist";
import {AuthToken, ResponseMessage} from "@/common/constants";
import UserNotFoundError from "@/errors/user/user-not-found";
import WrongPasswordError from "@/errors/user/wrong-password";
import jwtService from "./jwt-service";
import ms from "ms";
import {Response} from "express";
import UserIsBanned from "@/errors/user/user-is-banned";

const saltOfRound = 10;
const userSizeLimit = 10;

const getUserByEmail = async (email: string): Promise<Nullable<User>> => {
    const user: Nullable<User> = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            email: email,
        },
    });

    return user;
};

const getValidUserDTO = async (
    email: string,
    password: string
): Promise<UserDTO> => {
    const findByEmail: Nullable<User> = await getUserByEmail(email);

    if (!findByEmail) {
        throw new UserNotFoundError(ResponseMessage.USER_NOT_FOUND);
    }

    // Check whether password is valid
    const match = compareSync(password, findByEmail.password);
    if (!match) {
        throw new WrongPasswordError(ResponseMessage.WRONG_PASSWORD);
    }

    const user: UserDTO = {
        userID: findByEmail.userID,
        userName: findByEmail.userName,
        email: findByEmail.email,
        phoneNumber: findByEmail.phoneNumber,
        avatar: findByEmail.avatar,
        isBanned: findByEmail.isBanned,
        role: findByEmail.role,
        createdAt: findByEmail.createdAt,
        updateAt: findByEmail.updateAt,
        refreshTokensUsed: findByEmail.refreshTokensUsed,
    };
    return user;
};

const getUserResponseByID = async (
    userID: string
): Promise<UserResponseDTO> => {
    const user: Nullable<UserResponseDTO> = await prisma.user.findUnique({
        where: {
            deletedAt: null,
            userID: userID,
        },
        select: {
            userID: true,
            userName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            isBanned: true,
            role: true,
            createdAt: true,
            updateAt: true,
        },
    });

    if (!user) {
        throw new UserNotFoundError(ResponseMessage.USER_NOT_FOUND);
    }

    return user;
};

const getUserDTOByID = async (userID: string): Promise<UserDTO> => {
    const user: Nullable<UserDTO> = await prisma.user.findUnique({
        where: {
            deletedAt: null,
            userID: userID,
        },
        select: {
            userID: true,
            userName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            isBanned: true,
            role: true,
            createdAt: true,
            updateAt: true,
            refreshTokensUsed: true,
        },
    });

    if (!user) {
        throw new UserNotFoundError(ResponseMessage.USER_NOT_FOUND);
    }

    return user;
};

const login = async (
    res: Response,
    validPayload: LoginRequest
): Promise<string> => {
    const validUser: UserDTO = await getValidUserDTO(
        validPayload.email,
        validPayload.password
    );

    if (validUser.isBanned) {
        throw new UserIsBanned(ResponseMessage.USER_IS_BANNED);
    }

    const userInPayLoad: UserInTokenPayload = {
        userID: validUser.userID,
        userName: validUser.userName,
        email: validUser.email,
        role: validUser.role,
        avatar: validUser.avatar,
    };

    //create AT, RT
    const accessToken: Nullable<string> = jwtService.generateAuthToken(
        userInPayLoad,
        AuthToken.AC
    );

    const refreshToken: Nullable<string> = jwtService.generateAuthToken(
        userInPayLoad,
        AuthToken.RF
    );

    if (!accessToken || !refreshToken)
        throw new Error(ResponseMessage.GENERATE_TOKEN_ERROR);

    //set two token to cookie
    res.cookie(AuthToken.RF, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms(jwtService.REFRESH_TOKEN_LIFE_SPAN),
    });

    //Push refresh token to DB
    await pushRefreshToken(refreshToken, validUser.userID);
    return accessToken;
};

const refreshToken = async (res: Response, userID: string): Promise<string> => {
    const userDTO: UserDTO = await getUserDTOByID(userID);

    const userInPayLoad: UserInTokenPayload = {
        userID: userDTO.userID,
        userName: userDTO.userName,
        email: userDTO.email,
        role: userDTO.role,
        avatar: userDTO.avatar,
    };

    //create AT, RT
    const accessToken: Nullable<string> = jwtService.generateAuthToken(
        userInPayLoad,
        AuthToken.AC
    );

    const refreshToken: Nullable<string> = jwtService.generateAuthToken(
        userInPayLoad,
        AuthToken.RF
    );

    if (!accessToken || !refreshToken)
        throw new Error(ResponseMessage.GENERATE_TOKEN_ERROR);

    //set two token to cookie
    res.cookie(AuthToken.RF, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ms(jwtService.REFRESH_TOKEN_LIFE_SPAN),
    });
    //Push refresh token to DB
    await pushRefreshToken(refreshToken, userID);
    return accessToken;
};

const insertUser = async (
    validPayload: SignupRequest
): Promise<UserResponseDTO> => {
    const userHolder: Nullable<User> = await getUserByEmail(validPayload.email);

    if (userHolder) {
        throw new UserAlreadyExistError(ResponseMessage.USER_ALREADY_EXISTS);
    }

    const user = await prisma.user.create({
        data: {
            userName: validPayload.userName,
            email: validPayload.email,
            password: hashSync(validPayload.password, saltOfRound),
            avatar: validPayload.avatar || null,
            phoneNumber: validPayload.phoneNumber || null,
            role: userRole.CLIENT,
            refreshTokensUsed: [],
        },
        select: {
            userID: true,
            userName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            isBanned: true,
            role: true,
            createdAt: true,
            updateAt: true,
        },
    });
    return user;
};

const updateUserInfo = async (
    userID: string,
    validPayload: UserUpdateRequest
): Promise<UserResponseDTO> => {
    if (validPayload.email) {
        const userHolder: Nullable<User> = await getUserByEmail(
            validPayload.email
        );

        if (userHolder && userHolder.userID !== userID) {
            throw new UserAlreadyExistError(
                ResponseMessage.USER_ALREADY_EXISTS
            );
        }
    }

    const user: UserResponseDTO = await prisma.user.update({
        where: {
            userID: userID,
        },
        data: {
            userName: validPayload.userName,
            email: validPayload.email,
            phoneNumber: validPayload.phoneNumber,
            avatar: validPayload.avatar,
            isBanned: validPayload.isBanned,
            updateAt: new Date(),
        },
        select: {
            userID: true,
            userName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            isBanned: true,
            role: true,
            createdAt: true,
            updateAt: true,
        },
    });

    return user;
};

const deleteRefreshToken = async (refreshToken: string, userID: string) => {
    const newRefreshTokens: Optional<string[]> = await prisma.user
        .findUnique({where: {userID: userID}})
        .then((user) =>
            user?.refreshTokensUsed.filter((token) => token !== refreshToken)
        );

    if (!newRefreshTokens) {
        throw new Error();
    }

    await prisma.user.update({
        where: {
            userID: userID,
        },
        data: {
            refreshTokensUsed: newRefreshTokens,
        },
    });
};

const pushRefreshToken = async (refreshToken: string, userID: string) => {
    await prisma.user.update({
        where: {
            userID: userID,
        },
        data: {
            refreshTokensUsed: {
                push: refreshToken,
            },
        },
    });
};

const clearUserRefreshTokenUsed = async (userID: string) => {
    await prisma.user.update({
        where: {userID: userID},
        data: {
            refreshTokensUsed: [],
        },
    });
};

const getUserResponseDTOs = async (params: {
    date?: Date;
    searching?: string;
    currentPage: number;
}): Promise<UserResponseDTO[]> => {
    const startOfDay =
        params.date && new Date(params.date.setHours(0, 0, 0, 0));
    const endOfDay =
        params.date && new Date(params.date.setHours(23, 59, 59, 999));

    const users: UserResponseDTO[] = await prisma.user.findMany({
        where: {
            deletedAt: null,
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
            userName: {
                contains: params.searching,
                mode: "insensitive",
            },
        },
        select: {
            userID: true,
            userName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            isBanned: true,
            role: true,
            createdAt: true,
            updateAt: true,
        },
        skip: (params.currentPage - 1) * userSizeLimit,
        take: userSizeLimit,
    });

    return users;
};

const deleteUserByID = async (id: string) => {
    await prisma.user.update({
        data: {
            deletedAt: new Date(),
        },
        where: {
            userID: id,
        },
    });
};

const checkIfRefreshTokenExistInDB = async (
    refreshToken: string,
    userID: string
): Promise<boolean> => {
    const user: Nullable<User> = await prisma.user.findFirst({
        where: {
            userID: userID,
            refreshTokensUsed: {has: refreshToken},
        },
    });

    return user !== null;
};

const getNumberOfUsers = async (params: {
    date?: Date;
    searching?: string;
}): Promise<number> => {
    const startOfDay =
        params.date && new Date(params.date.setHours(0, 0, 0, 0));
    const endOfDay =
        params.date && new Date(params.date.setHours(23, 59, 59, 999));
    const quantity: number = await prisma.user.count({
        where: {
            deletedAt: null,
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
            userName: {
                contains: params.searching,
                mode: "insensitive",
            },
        },
    });
    return quantity;
};

const updatePassword = async (
    email: string,
    validPayload: PasswordUpdateRequest
) => {
    const validUser: UserDTO = await getValidUserDTO(
        email,
        validPayload.oldPassword
    );

    await prisma.user.update({
        where: {
            userID: validUser.userID,
        },
        data: {
            password: hashSync(validPayload.newPassword, saltOfRound),
        },
    });
};

export default {
    getUserResponseByID,
    insertUser,
    deleteRefreshToken,
    pushRefreshToken,
    clearUserRefreshTokenUsed,
    updateUserInfo,
    getUserResponseDTOs,
    getUserDTOByID,
    login,
    refreshToken,
    checkIfRefreshTokenExistInDB,
    deleteUserByID,
    getNumberOfUsers,
    updatePassword,
};
