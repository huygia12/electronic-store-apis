import {CorsOptions} from "cors";

export const options: CorsOptions = {
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true, //allow receive cookies from request
};
