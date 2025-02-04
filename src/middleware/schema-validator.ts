import {ResponseMessage} from "@/common/constants";
import schemas from "@/common/schemas";
import {ValidationError} from "@/errors/custom-error";
import {RequestHandler} from "express";
import {StatusCodes} from "http-status-codes";
import {ZodError, ZodIssueOptionalMessage} from "zod";

const expressSchemaValidator = (
    path: string,
    useZodError: boolean = true
): RequestHandler => {
    const schemaObject = schemas[path];
    if (!schemaObject) {
        throw new Error(`Method and schema not found for path: ${path}`);
    }

    return (req, res, next) => {
        const schema = schemaObject[req.method];
        if (!schema) {
            throw new Error(
                `Does not match any method-schema defined in schemas.ts: ${req.method}`
            );
        }

        try {
            schema.parse(req.body);
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                const zodError: ValidationError = {
                    status: "failed",
                    details: error.errors.map(
                        ({code, message, path}: ZodIssueOptionalMessage) => ({
                            code: code,
                            message: message,
                            path: path.toString(),
                        })
                    ),
                };
                return res.status(422).json(useZodError && zodError);
            }
            throw new Error(
                `Unexpected error during schema validation: ${error}`
            );
        }

        return next();
    };
};

const socketIOSchemaValidator = (
    clientEvent: string,
    payload: unknown,
    callback: Function
): boolean => {
    const eventBroker: string[] = clientEvent.split(":");

    const schema = schemas[eventBroker[0]][eventBroker[1]];
    if (!schema) {
        throw new Error(`Schema not found for clientEvent: ${clientEvent}`);
    }

    try {
        schema.parse(payload);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const zodError: ValidationError = {
                status: "failed",
                details: error.errors.map(
                    ({code, message, path}: ZodIssueOptionalMessage) => ({
                        code: code,
                        message: message,
                        path: path.toString(),
                    })
                ),
            };
            callback({
                status: StatusCodes.UNPROCESSABLE_ENTITY,
                detail: zodError,
            });
        } else {
            callback({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                message: ResponseMessage.UNEXPECTED_ERROR,
            });
        }
        return false;
    }

    return true;
};

export {expressSchemaValidator, socketIOSchemaValidator};
