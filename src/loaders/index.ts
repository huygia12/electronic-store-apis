import config from "@/common/app-config";
import ExpressServer from "./express-server";
import SocketServer from "./socket-server";

export default () => {
    const expressServer = new ExpressServer(config.SERVER_PORT);
    const socketServer = new SocketServer(expressServer.instance(), {
        debug: true,
    });
    expressServer.getApp().set(`socketio`, socketServer.getIO());

    process
        .on("exit", () => {
            socketServer.close();
            expressServer.close();
        })
        .on("SIGINT", () => {
            socketServer.close();
            expressServer.close();
        });
};
