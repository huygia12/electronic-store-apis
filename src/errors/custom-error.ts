abstract class CustomError extends Error {
    constructor(public message: string) {
        super(message);
    }
    abstract StatusCode: number;
    abstract serialize(): {
        message: string;
    };
}

abstract class ResponsableError extends CustomError {}

interface ValidationError {
    status: string;
    details: {
        code: string;
        message?: string;
        path?: string;
    }[];
}

export type {ValidationError};
export {CustomError, ResponsableError};