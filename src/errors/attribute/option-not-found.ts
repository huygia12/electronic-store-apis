import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class AttributeOptionNotFound extends ResponsableError {
    StatusCode: number = StatusCodes.NOT_FOUND;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, AttributeOptionNotFound.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default AttributeOptionNotFound;
