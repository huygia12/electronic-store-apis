import {
    ClientEvents,
    Nullable,
    ReviewFullJoin,
    ServerEvents,
} from "@/common/types";
import {Namespace, Server, Socket} from "socket.io";
import reviewService from "@/services/review-service";
import {ResponseMessage} from "@/common/constants";
import {StatusCodes} from "http-status-codes";
import {ReviewCreationRequest, ReviewDeletionRequest} from "@/common/schemas";
import {socketIOSchemaValidator} from "@/middleware/schema-validator";
import {Request, Response} from "express";
import {Review} from "@prisma/client";

const getReviews = async (req: Request, res: Response) => {
    const productID = req.query.productID as string;
    const reviews: ReviewFullJoin[] = await reviewService.getReviewsByProductID(
        productID
    );

    console.debug(`[review controller] getReviewsByProductID : successfully`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: reviews,
    });
};

const registerReviewSocketHandlers = (
    nameSpace: Namespace,
    socket: Socket<ClientEvents, ServerEvents>
) => {
    const createReview = async (
        payload: ReviewCreationRequest,
        callback: unknown
    ) => {
        if (typeof callback !== "function") {
            //not an acknowledgement
            return socket.disconnect();
        }
        const validateResult: boolean = socketIOSchemaValidator(
            `review:create`,
            payload,
            callback
        );
        if (!validateResult) return;

        try {
            const review: ReviewFullJoin = await reviewService.makeReview(
                payload
            );

            nameSpace.to(`product:${payload.productID}`).emit("review:create", {
                review: review,
            });
            callback(undefined);
            console.debug(`[review controller] create review : succeed`);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[error handler] ${error.name} : ${error.stack}`);
            } else {
                console.error(`[error handler] unexpected error : ${error}`);
            }

            callback({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                message: ResponseMessage.UNEXPECTED_ERROR,
            });
        }
    };

    const deleteReview = async (
        payload: ReviewDeletionRequest,
        callback: unknown
    ) => {
        if (typeof callback !== "function") {
            //not an acknowledgement
            return socket.disconnect();
        }

        const validateResult: boolean = socketIOSchemaValidator(
            `review:delete`,
            payload,
            callback
        );
        if (!validateResult) return;

        try {
            const review: Nullable<Review> = await reviewService.getReview(
                payload.reviewID
            );
            if (!review) {
                callback({
                    status: StatusCodes.UNPROCESSABLE_ENTITY,
                    message: ResponseMessage.REVIEW_NOT_FOUND,
                });
                return;
            }

            await reviewService.deleteReview(payload);

            nameSpace.to(`product:${review.productID}`).emit("review:delete", {
                review: review,
            });
            callback(undefined);
            console.debug(`[review controller] delete review : succeed`);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`[error handler] ${error.name} : ${error.stack}`);
            } else {
                console.error(`[error handler] unexpected error : ${error}`);
            }

            callback({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                message: ResponseMessage.UNEXPECTED_ERROR,
            });
        }
    };

    socket.on(`review:create`, createReview);
    socket.on(`review:delete`, deleteReview);
};

export default {
    getReviews,
    registerReviewSocketHandlers,
};
