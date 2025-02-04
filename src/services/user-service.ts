import {compareSync, hashSync} from "bcrypt";
import {
    LoginRequest,
    PasswordUpdateRequest,
    SignupRequest,
    UserUpdateRequest,
} from "@/common/schemas";
import {type User, userRole} from "@prisma/client";
import prisma from "@/common/prisma-client";
import {UserDTO, UserInTokenPayload, UserResponseDTO} from "@/common/types";
import UserAlreadyExistError from "@/errors/user/user-already-exist";
import {AuthToken, ResponseMessage} from "@/common/constants";
import UserNotFoundError from "@/errors/user/user-not-found";
import WrongPasswordError from "@/errors/user/wrong-password";
import jwtService from "./jwt-service";
import UserIsBanned from "@/errors/user/user-is-banned";
import InvalidTokenError from "@/errors/auth/invalid-token";
import * as crypto from "crypto";

const saltOfRound = 10;
const userSizeLimit = 10;

const getUserByEmail = async (email: string): Promise<User | null> => {
    const user: User | null = await prisma.user.findFirst({
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
    const findByEmail: User | null = await getUserByEmail(email);

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
    const user: UserResponseDTO | null = await prisma.user.findUnique({
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
    const user: UserDTO | null = await prisma.user.findUnique({
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
    prevRT: string | undefined,
    validPayload: LoginRequest
): Promise<{refreshToken: string; accessToken: string}> => {
    try {
        if (typeof prevRT == "string") {
            // Get userId from refreshtoken payload
            const userDecoded = jwtService.decodeToken(
                prevRT
            ) as UserInTokenPayload;

            // If refresh token already existed in DB so delete it
            await deleteRefreshToken(prevRT, userDecoded.userID);
        }
    } catch (error: any) {
        console.error(`[user service]: login : ${JSON.stringify(error)}`);
    }

    const validUser: UserDTO = await getValidUserDTO(
        validPayload.email,
        validPayload.password
    );

    if (validUser.isBanned) {
        throw new UserIsBanned(ResponseMessage.USER_IS_BANNED);
    }

    const tokenPayload: UserInTokenPayload = {
        userID: validUser.userID,
        userName: validUser.userName,
        email: validUser.email,
        role: validUser.role,
        avatar: validUser.avatar,
    };

    //create AT, RT
    const accessToken: string | null = jwtService.generateAuthToken(
        tokenPayload,
        AuthToken.AC
    );

    const refreshToken: string | null = jwtService.generateAuthToken(
        tokenPayload,
        AuthToken.RF
    );

    if (!accessToken || !refreshToken)
        throw new Error(ResponseMessage.GENERATE_TOKEN_ERROR);

    //set two token to cookie
    //Push refresh token to DB
    await pushRefreshToken(refreshToken, validUser.userID);
    return {refreshToken, accessToken};
};

const logout = async (prevRT: string, userID: string) => {
    await deleteRefreshToken(prevRT, userID);
};

const refreshToken = async (
    prevRT: string
): Promise<{refreshToken: string; accessToken: string}> => {
    try {
        const userDecoded = jwtService.verifyAuthToken(
            prevRT,
            AuthToken.RF
        ) as UserInTokenPayload;

        //Hacker's request: must clear all refresh token to login again
        const existing: boolean = await checkIfRefreshTokenExistInDB(
            prevRT,
            userDecoded.userID
        );

        if (!existing) {
            await clearUserRefreshTokenUsed(userDecoded.userID);
            throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
        }

        //Down here token must be valid
        const userDTO: UserDTO = await getUserDTOByID(userDecoded.userID);

        deleteRefreshToken(prevRT, userDecoded.userID);
        const tokenPayload: UserInTokenPayload = {
            userID: userDTO.userID,
            userName: userDTO.userName,
            email: userDTO.email,
            role: userDTO.role,
            avatar: userDTO.avatar,
        };

        //create AT, RT
        const accessToken: string | null = jwtService.generateAuthToken(
            tokenPayload,
            AuthToken.AC
        );

        const refreshToken: string | null = jwtService.generateAuthToken(
            tokenPayload,
            AuthToken.RF
        );

        if (!accessToken || !refreshToken)
            throw new Error(ResponseMessage.GENERATE_TOKEN_ERROR);

        //Push refresh token to DB
        pushRefreshToken(refreshToken, userDTO.userID);
        return {refreshToken, accessToken};
    } catch {
        throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
    }
};

const insertUser = async (
    validPayload: SignupRequest
): Promise<UserResponseDTO> => {
    const duplicatedUser: User | null = await getUserByEmail(
        validPayload.email
    );

    if (duplicatedUser) {
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
        const userHolder: User | null = await getUserByEmail(
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
    const newRefreshTokens: string[] | undefined = await prisma.user
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
    const user: User | null = await prisma.user.findFirst({
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

const otpStorage = new Map<
    string,
    {otp: string; numberOfCheckingTime: number; timeout: NodeJS.Timeout}
>();
const generateOTP = async (email: string): Promise<string> => {
    const user = await getUserByEmail(email);

    if (!user) {
        throw new UserNotFoundError(ResponseMessage.USER_NOT_FOUND);
    }

    if (otpStorage.has(email)) {
        clearTimeout(otpStorage.get(email)!.timeout);
        otpStorage.delete(email);
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const numberOfCheckingTime = 5;
    const timeout = setTimeout(
        () => {
            otpStorage.delete(email);
        },
        2 * 60 * 1000 // 2 minutes
    );

    otpStorage.set(email, {otp, numberOfCheckingTime, timeout});

    return otp;
};

const verifyOTP = async (
    email: string,
    otp: string
): Promise<string | null> => {
    const entry = otpStorage.get(email);
    if (!entry || entry.otp !== otp) {
        if (entry) {
            entry.numberOfCheckingTime--;
            if (entry.numberOfCheckingTime == 0) {
                banUserWithEmail(email);
                clearTimeout(entry.timeout);
                otpStorage.delete(email);
            }
        }
        return null;
    }

    const newPassword = crypto.randomInt(100000, 999999).toString();

    // otp is verified from now on
    await prisma.user.update({
        where: {
            email: email,
        },
        data: {
            password: hashSync(newPassword, saltOfRound),
        },
    });

    clearTimeout(entry.timeout);
    otpStorage.delete(email);
    return newPassword;
};

const banUserWithEmail = async (email: string) => {
    await prisma.user.update({
        where: {
            email: email,
        },
        data: {
            isBanned: true,
        },
    });
};

export default {
    login,
    logout,
    insertUser,
    refreshToken,
    updateUserInfo,
    getUserResponseByID,
    getUserDTOByID,
    getUserResponseDTOs,
    getNumberOfUsers,
    deleteUserByID,
    updatePassword,
    generateOTP,
    verifyOTP,
};
