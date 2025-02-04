import {Server} from "socket.io";
import {Server as ExpressServer} from "node:http";
import {instrument} from "@socket.io/admin-ui";
import reviewController from "@/controllers/review-controller";
import productController from "@/controllers/product-controller";
import {ClientEvents, ServerEvents} from "@/common/types";
import userController from "@/controllers/user-controller";
import {options} from "@/common/cors-config";
import invoiceController from "@/controllers/invoice-controller";

interface Option {
    debug: boolean;
}

class SocketServer {
    private _io: Server<ClientEvents, ServerEvents>;
    private _debug: boolean;

    public constructor(expressServer: ExpressServer, opts?: Option) {
        this._io = new Server<ClientEvents, ServerEvents>(expressServer, {
            cors: options,
        });
        this._debug = opts?.debug || false;

        instrument(this._io, {
            auth: false,
            mode: "development",
        });

        this.listen();
    }

    private listen(): void {
        // this._io.use((socket, next) => {
        //     const token: string = socket.handshake.auth["token"];
        //     authMiddleware.checkAuth(token);
        //     next();
        // });
        this._io.on(`connection`, (socket) => {
            console.info(`An user with socket ID of ${socket.id} connected`);

            reviewController.registerReviewSocketHandlers(this._io, socket);

            productController.registerProductSocketHandlers(this._io, socket);

            userController.registerUserSocketHandlers(this._io, socket);

            invoiceController.registerInvoiceSocketHandlers(this._io, socket);

            socket.on(`disconnect`, () => {
                console.info(
                    `An user with socket ID of ${socket.id} disconnected`
                );
            });
        });

        console.log("[socket server]: Server is listening");
    }

    public getIO() {
        return this._io;
    }

    public close(): void {
        this._io.close((error) => {
            if (error) throw error;

            console.log("[socket server]: Stopped");
        });
    }
}

export default SocketServer;
