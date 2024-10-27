import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class InvoiceNotFound extends ResponsableError {
    StatusCode: number = StatusCodes.NOT_FOUND;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, InvoiceNotFound.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default InvoiceNotFound;
