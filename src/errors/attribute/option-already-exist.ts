import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class AttributeOptionAlreadyExistError extends ResponsableError {
    StatusCode: number = StatusCodes.CONFLICT;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, AttributeOptionAlreadyExistError.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default AttributeOptionAlreadyExistError;
