import {Namespace, Server} from "socket.io";
import {Server as ExpressServer} from "node:http";
import config from "@/common/app-config";
import {SocketEvent, SocketNamespace} from "@/common/constants";
import {authMiddleware} from "@/middleware/auth-middleware";

interface Option {
    debug: boolean;
}

class SocketServer {
    private _io: Server;
    private _debug: boolean;
    private _paymentNamespace: Namespace;

    public constructor(expressServer: ExpressServer, opts?: Option) {
        this._io = new Server(expressServer, {
            cors: {
                origin: config.CLIENT_ENDPOINT,
                credentials: true,
            },
        });
        this._debug = opts?.debug || false;

        this.listen();
    }

    private debug(msg: string): void {
        this._debug && console.debug(`[socket server]: ${msg}`);
    }

    private listen(): void {
        this._io.use((socket, next) => {
            const token: string = socket.handshake.auth["token"];
            authMiddleware.checkAuth(token);
            next();
        });

        this._paymentNamespace = this._io
            .of(SocketNamespace.PAYMENT)
            .on(SocketEvent.CONNECT, (socket) => {
                this.debug(`An user with socket ID of ${socket.id} connected`);

                socket.on(SocketEvent.DISCONNECT, () => {
                    this.debug(
                        `An user with socket ID of ${socket.id} disconnected`
                    );
                });
            });

        console.log("[socket server]: Server is listening");
    }

    public close(): void {
        this._io.close((error) => {
            if (error) throw error;

            console.log("[socket server]: Stopped");
        });
    }

    public getPaymentNamespace() {
        return this._paymentNamespace;
    }
}

export default SocketServer;
