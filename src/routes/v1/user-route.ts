import express from "express";
import userController from "../../controllers/user-controller";
import {authMiddleware} from "@/middleware/auth-middleware";
import {expressSchemaValidator} from "@/middleware/schema-validator";

const router = express.Router();

//auth
router.post(
    "/signup",
    expressSchemaValidator("/users/signup"),
    userController.signup
);
router.post(
    "/login",
    expressSchemaValidator("/users/login"),
    userController.login
);
router.delete("/logout", userController.logout);
router.get("/refresh", userController.refreshToken);

//normal user apis
router.put(
    "/:id",
    authMiddleware.isAuthorized,
    expressSchemaValidator("/users/:id"),
    userController.updateInfo
);
router.patch(
    "/:id",
    authMiddleware.isAuthorized,
    expressSchemaValidator("/users/:id/password"),
    userController.updateUserPassword
);
router.post(
    "/forgot-password",
    expressSchemaValidator("/users/forgot-password"),
    userController.forgotPassword
);
router.post(
    "/verify-otp",
    expressSchemaValidator("/users/verify-otp"),
    userController.verifyOTP
);
router.delete("/:id", authMiddleware.isAuthorized, userController.deleteUser);
router.get("/:id", authMiddleware.isAuthorized, userController.getUser);
router.get(
    "/",
    authMiddleware.isAuthorized,
    authMiddleware.isAdmin,
    userController.getUsers
);

export default router;
