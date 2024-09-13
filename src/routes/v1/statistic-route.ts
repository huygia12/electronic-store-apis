import express from "express";
import {authMiddleware} from "@/middleware/auth-middleware";
import statisticController from "@/controllers/statistic-controller";

const router = express.Router();

router.use(authMiddleware.isAuthorized);

router.get("/", statisticController.getStatistic);

export default router;
