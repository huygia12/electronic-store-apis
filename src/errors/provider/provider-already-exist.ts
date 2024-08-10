import {StatusCodes} from "http-status-codes";
import {ResponsableError} from "../custom-error";

class ProviderAlreadyExistError extends ResponsableError {
    StatusCode: number = StatusCodes.CONFLICT;
    constructor(public message: string) {
        super(message);
        Object.setPrototypeOf(this, ProviderAlreadyExistError.prototype);
    }
    serialize(): {message: string} {
        return {message: this.message};
    }
}

export default ProviderAlreadyExistError;
