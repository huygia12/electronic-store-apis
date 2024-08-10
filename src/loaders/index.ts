import ExpressServer from "./express-server";

export default () => {
    const expressServer = new ExpressServer();
    process
        .on("exit", () => {
            expressServer.close();
        })
        .on("SIGINT", () => {
            expressServer.close();
        });
};
