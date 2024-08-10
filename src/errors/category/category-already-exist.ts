import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class CategoryAlreadyExistError extends ResponsableError {
    StatusCode: number = StatusCodes.CONFLICT;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, CategoryAlreadyExistError.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default CategoryAlreadyExistError;
