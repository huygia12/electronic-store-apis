import dotenv from "dotenv";
import {resolve} from "path";

type Config = {
    SERVER_PORT: number;
    AT_KEY: string;
    RT_KEY: string;
    APP_DOMAIN: string;
    CLIENT_DOMAIN: string;
};

const localhost = "http://127.0.0.1";
const envConfig = dotenv.config({
    path: resolve(".env") as string,
});

if (envConfig.error) {
    console.error("[app-config]: Cannot find .env file");
} else {
    console.info("[app-config]: Using .env file to load environment variables");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.PORT = process.env.PORT || "8000";

if (!process.env.AT_SECRET_KEY || !process.env.RT_SECRET_KEY) {
    throw new Error("[app-config]: secret key is required");
}

const config: Config = {
    SERVER_PORT: parseInt(process.env.PORT, 10),
    AT_KEY: `${process.env.AT_SECRET_KEY}`,
    RT_KEY: `${process.env.RT_SECRET_KEY}`,
    APP_DOMAIN: process.env.APP_DOMAIN || `${localhost}:${process.env.PORT}`,
    CLIENT_DOMAIN:
        process.env.CLIENT_DOMAIN || `${localhost}:${process.env.CLIENT_PORT}`,
};

export default config;
