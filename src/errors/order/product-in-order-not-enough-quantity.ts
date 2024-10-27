import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class ProductInOrderNotEnoughQuantity extends ResponsableError {
    StatusCode: number = StatusCodes.CONFLICT;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ProductInOrderNotEnoughQuantity.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default ProductInOrderNotEnoughQuantity;
