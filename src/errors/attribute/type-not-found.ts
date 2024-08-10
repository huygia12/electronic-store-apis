import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class AttributeTypeNotFound extends ResponsableError {
    StatusCode: number = StatusCodes.NOT_FOUND;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, AttributeTypeNotFound.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default AttributeTypeNotFound;
