import {Request, Response, NextFunction} from "express";
import jwtService from "../services/jwt-service";
import {Optional, UserInTokenPayload} from "@/common/types";
import {AuthToken, ResponseMessage, UserRole} from "@/common/constants";
import MissingTokenError from "@/errors/auth/missing-token";
import InvalidTokenError from "@/errors/auth/invalid-token";
import AccessDenided from "@/errors/auth/access-denied";

const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    const accessToken: Optional<string | string[]> =
        req.headers["authorization"];

    if (typeof accessToken !== "string") {
        console.debug(
            `[auth-middleware] Check request from admin failure: missing token`
        );
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    try {
        jwtService.verifyAuthToken(
            accessToken.replace("Bearer ", ""),
            AuthToken.AC
        );
    } catch {
        console.debug(
            `[auth-middleware]: Check token's authorization has been failed: invalid token`
        );
        throw new InvalidTokenError(ResponseMessage.TOKEN_INVALID);
    }

    console.debug(`[auth-middleware] Check token's authorization succeed`);
    next();
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken: Optional<string | string[]> =
        req.headers["authorization"];

    if (typeof accessToken !== "string") {
        console.debug(
            `[auth-middleware]: Check request from admin has been failed: missing token`
        );
        throw new MissingTokenError(ResponseMessage.TOKEN_MISSING);
    }

    const user = jwtService.decodeToken(
        accessToken.replace("Bearer ", "")
    ) as UserInTokenPayload;

    if (user.role !== UserRole.ADMIN) {
        console.debug(
            `[auth-middleware] Check request from admin has been failed: access denied`
        );
        throw new AccessDenided(ResponseMessage.ACCESS_DENIED);
    }

    console.debug(`[auth-middleware] Check request from admin succeed`);
    next();
};

export const authMiddleware = {
    isAuthorized,
    isAdmin,
};
