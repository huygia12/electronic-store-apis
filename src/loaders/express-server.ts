import express, {Express} from "express";
import {createServer, Server} from "node:http";
import cors from "cors";
import config from "@/common/app-config";
import {options} from "@/common/cors-config";
import "express-async-errors";
import {API_v1} from "@/routes";
import errorHandler from "@/middleware/error-handler";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";

class ExpressServer {
    private _app: Express;
    private _server: Server;

    public constructor() {
        this.listen();
    }

    private listen(): void {
        this._app = express();
        this._app.use(morgan("dev"));
        this._app.use(helmet());
        this._app.use(compression());
        this._app.use(cors(options));
        this._app.use(cookieParser());
        this._app.use(express.json());
        this._app.use("/", API_v1);
        this._app.use("*", errorHandler);

        this._server = createServer(this._app);
        this._server.listen(config.serverPort, () => {
            console.info(
                `[express server]: Server is running at port ${config.serverPort}`
            );
        });
    }

    public close(): void {
        this._server.close((error) => {
            if (error) throw error;

            console.info("[express server]: Stopped");
        });
    }
}

export default ExpressServer;
