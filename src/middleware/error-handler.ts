import {ResponsableError} from "@/errors/custom-error";
import {ErrorRequestHandler, Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const errorHandler: ErrorRequestHandler = (
    error: Error,
    req: Request,
    res: Response
) => {
    console.debug(`[error handler] ${error.name} : ${error.stack}`);

    if (error instanceof ResponsableError) {
        return res.status(error.StatusCode).json({
            message: error.message,
        });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Unexpected Error",
    });
};

export default errorHandler;
