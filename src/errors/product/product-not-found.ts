import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class ProductNotFoundError extends ResponsableError {
    StatusCode: number = StatusCodes.NOT_FOUND;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ProductNotFoundError.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default ProductNotFoundError;
