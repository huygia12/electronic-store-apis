import dotenv from "dotenv";
import {resolve} from "path";

type Config = {
    serverPort: number;
    AT_KEY: string;
    RT_KEY: string;
    APP_DOMAIN: string;
    CLIENT_ENDPOINT: string;
};

const ENV_FILE_PATH: string = resolve(".env");
const isEnvFound = dotenv.config({
    path: ENV_FILE_PATH,
});

if (isEnvFound.error) {
    console.info("[app-config]: Cannot find .env file");
} else {
    console.info("[app-config]: Using .env file to load environment variables");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.PORT = process.env.PORT || "8000";

const config: Config = {
    serverPort: parseInt(process.env.PORT, 10),
    AT_KEY: process.env.AT_SECRET_KEY || "",
    RT_KEY: process.env.RT_SECRET_KEY || "",
    APP_DOMAIN:
        process.env.APP_DOMAIN || `http://localhost:${process.env.PORT}`,
    CLIENT_ENDPOINT:
        process.env.CLIENT_ENDPOINT ||
        `http://localhost:${process.env.CLIENT_PORT}`,
};

export default config;
