import {Request, Response, NextFunction} from "express";
import jwtService from "../services/jwt-service";
import {UserInTokenPayload} from "@/common/types";
import {AuthToken, ResponseMessage, UserRole} from "@/common/constants";
import MissingTokenError from "@/errors/auth/missing-token";
import InvalidTokenError from "@/errors/auth/invalid-token";
import AccessDenided from "@/errors/auth/access-denied";

const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    const accessToken: string | string[] | undefined =
        req.headers["authorization"];

    checkAuth(accessToken);

    next();
};

const checkAuth = (token: string | undefined) => {
    if (typeof token !== "string") {
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    try {
        jwtService.verifyAuthToken(token.replace("Bearer ", ""), AuthToken.AC);
    } catch {
        throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
    }
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken: string | string[] | undefined =
        req.headers["authorization"];

    if (typeof accessToken !== "string") {
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    const user = jwtService.decodeToken(
        accessToken.replace("Bearer ", "")
    ) as UserInTokenPayload;

    if (user.role !== UserRole.ADMIN) {
        throw new AccessDenided(ResponseMessage.ACCESS_DENIED);
    }

    next();
};

export const authMiddleware = {
    isAuthorized,
    isAdmin,
    checkAuth,
};
