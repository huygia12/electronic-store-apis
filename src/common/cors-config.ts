import {CorsOptions} from "cors";
import config from "./app-config";

export const options: CorsOptions = {
    origin: [config.CLIENT_DOMAIN, `https://admin.socket.io`],
    optionsSuccessStatus: 200,
    credentials: true,
    methods: "*",
    allowedHeaders: "*",
};
