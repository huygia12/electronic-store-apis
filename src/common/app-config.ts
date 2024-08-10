import dotenv from "dotenv";
import {resolve} from "path";

type Config = {
    serverPort: number;
    AT_KEY: string;
    RT_KEY: string;
};

const ENV_FILE_PATH: string = resolve(".env");
const isEnvFound = dotenv.config({
    path: ENV_FILE_PATH,
});

if (isEnvFound.error) {
    throw new Error("Cannot find .env file");
} else {
    console.info("[app-config]: Using .env file to load environment variables");
}

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const config: Config = {
    serverPort: parseInt(process.env.PORT || "8000", 10),
    AT_KEY: process.env.AT_SECRET_KEY || "",
    RT_KEY: process.env.RT_SECRET_KEY || "",
};

export default config;
