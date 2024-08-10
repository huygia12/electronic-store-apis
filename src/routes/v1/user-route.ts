import express from "express";
import userController from "../../controllers/user-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import schemaValidator from "@/middleware/schema-validator";

const router = express.Router();

//auth
router.post("/signup", schemaValidator("/users/signup"), userController.signup);
router.post("/login", schemaValidator("/users/login"), userController.login);
router.delete("/logout", userController.logout);
router.get("/refresh", userController.refreshToken);

//normal user apis
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    schemaValidator("/users/:id"),
    userController.updateInfo
);
router.get("/:id", authMiddleware.isAuthorized, userController.getUser);
router.get(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    userController.getUsers
);

export default router;
