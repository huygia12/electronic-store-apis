import {CorsOptions} from "cors";
import config from "./app-config";

export const options: CorsOptions = {
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: [
        "Authorization" as const,
        "Accept",
        "Content-Type",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    exposedHeaders: [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
    ],
    optionsSuccessStatus: 200,
    credentials: true,
    preflightContinue: true,
    origin: [config.CLIENT_DOMAIN, `https://admin.socket.io`],
};
