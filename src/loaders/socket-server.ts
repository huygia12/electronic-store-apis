import {Namespace, Server} from "socket.io";
import {Server as ExpressServer} from "node:http";
import {SocketNamespace} from "@/common/constants";
import {instrument} from "@socket.io/admin-ui";
import reviewController from "@/controllers/review-controller";
import productController from "@/controllers/product-controller";
import {ClientEvents, ServerEvents} from "@/common/types";
interface Option {
    debug: boolean;
}

class SocketServer {
    private _io: Server;
    private _debug: boolean;
    private _commentNamespace: Namespace;
    private _notificationNamespace: Namespace;

    public constructor(
        expressServer: ExpressServer,
        clientEndpoint: string,
        opts?: Option
    ) {
        this._io = new Server<ClientEvents, ServerEvents>(expressServer, {
            cors: {
                origin: [clientEndpoint, `https://admin.socket.io`],
                methods: ["GET", "POST"],
                credentials: true,
            },
        });
        this._debug = opts?.debug || false;

        instrument(this._io, {
            auth: false,
            mode: "development",
            namespaceName: SocketNamespace.COMMENT,
        });

        this.listen();
    }

    private listen(): void {
        // this._io.use((socket, next) => {

        //     const token: string = socket.handshake.auth["token"];
        //     authMiddleware.checkAuth(token);
        //     next();
        // });
        this._commentNamespace = this._io
            .of(SocketNamespace.COMMENT)
            .on(`connection`, (socket) => {
                this.debug(`An user with socket ID of ${socket.id} connected`);

                reviewController.registerReviewSocketHandlers(
                    this._commentNamespace,
                    socket
                );

                productController.registerProductSocketHandlers(
                    this._commentNamespace,
                    socket
                );

                socket.on(`disconnect`, () => {
                    this.debug(
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

    private debug(msg: string): void {
        this._debug && console.debug(`[socket server]: ${msg}`);
    }
}

export default SocketServer;
