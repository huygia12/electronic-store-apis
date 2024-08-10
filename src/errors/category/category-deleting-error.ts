import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class CategoryDeletingError extends ResponsableError {
    StatusCode: number = StatusCodes.CONFLICT;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, CategoryDeletingError.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default CategoryDeletingError;
