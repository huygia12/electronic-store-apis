import schemas from "@/common/schemas";
import {ValidationError} from "@/errors/custom-error";
import {RequestHandler} from "express";
import {ZodError, ZodIssueOptionalMessage} from "zod";

const schemaValidator = (
    path: string,
    useZodError: boolean = true
): RequestHandler => {
    const schemaObject = schemas[path];
    if (!schemaObject) {
        throw new Error(`Method and schema not found for path: ${path}`);
    }

    return (req, res, next) => {
        console.debug(
            `[schema validator] request body : ${JSON.stringify(
                req.body,
                null,
                2
            )}`
        );

        const schema = schemaObject[req.method];
        if (!schema) {
            throw new Error(
                `Does not match any method-schema defined in schemas.ts: ${req.method}`
            );
        }

        try {
            schema.parse(req.body);
        } catch (error: unknown) {
            console.debug(
                `[schema validator] zod detect errors : ${JSON.stringify(
                    error,
                    null,
                    2
                )}`
            );

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

        // validation successful
        console.debug(`[schema validator] succeed}`);
        return next();
    };
};

export default schemaValidator;
