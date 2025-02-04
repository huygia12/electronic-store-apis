import prisma from "@/common/prisma-client";
import {ReviewCreationRequest, ReviewDeletionRequest} from "@/common/schemas";
import {ReviewFullJoin} from "@/common/types";
import {Review} from "@prisma/client";

const makeReview = async (
    validPayload: ReviewCreationRequest
): Promise<ReviewFullJoin> => {
    const review: ReviewFullJoin = await prisma.review.create({
        data: validPayload,
        include: {
            childrenReview: {
                include: {
                    childrenReview: true,
                    user: {
                        select: {
                            userID: true,
                            userName: true,
                            avatar: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                    product: {
                        select: {
                            productName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            user: {
                select: {
                    userID: true,
                    userName: true,
                    avatar: true,
                    role: true,
                    createdAt: true,
                },
            },
            product: {
                select: {
                    productName: true,
                },
            },
        },
    });

    return review;
};

const deleteReview = async (validPayload: ReviewDeletionRequest) => {
    await prisma.review.delete({
        where: {
            reviewID: validPayload.reviewID,
        },
    });
};

const getReviewsByProductID = async (
    productID: string
): Promise<ReviewFullJoin[]> => {
    const reviews: ReviewFullJoin[] = await prisma.review.findMany({
        where: {
            productID: productID,
            parentID: null,
            user: {
                deletedAt: null,
            },
        },
        include: {
            childrenReview: {
                include: {
                    childrenReview: true,
                    user: {
                        select: {
                            userID: true,
                            userName: true,
                            avatar: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                    product: {
                        select: {
                            productName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            user: {
                select: {
                    userID: true,
                    userName: true,
                    avatar: true,
                    role: true,
                    createdAt: true,
                },
            },
            product: {
                select: {
                    productName: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return reviews;
};

const getReview = async (reviewID: string): Promise<Review | null> => {
    const review = await prisma.review.findFirst({
        where: {
            reviewID: reviewID,
        },
    });

    return review;
};

export default {makeReview, getReviewsByProductID, getReview, deleteReview};
