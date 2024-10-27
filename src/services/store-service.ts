import {BannerUpdateRequest} from "@/common/schemas";
import prisma from "@/common/prisma-client";
import {Nullable, StoreFullJoin} from "@/common/types";
import {SlideShow} from "@prisma/client";
import StoreNotFoundError from "@/errors/store/store-not-found";
import {ResponseMessage} from "@/common/constants";

const getSlides = async (storeID: string): Promise<SlideShow[]> => {
    const slides = await prisma.slideShow.findMany({
        where: {
            storeID: storeID,
        },
    });

    return slides;
};

const getStore = async (): Promise<Nullable<StoreFullJoin>> => {
    const store = await prisma.store.findFirst({
        include: {
            slideShows: true,
        },
    });
    return store;
};

const updateBanner = async (
    storeID: string,
    validPayload: BannerUpdateRequest
) => {
    const store = await prisma.store.findFirst({
        where: {storeID: storeID},
    });
    if (!store) {
        console.debug(`[store service]: Store not found`);
        throw new StoreNotFoundError(ResponseMessage.STORE_NOT_FOUND);
    }

    if (validPayload.position === `left`) {
        await prisma.store.update({
            where: {storeID: storeID},
            data: {
                leftBanner: validPayload.newBanner,
            },
        });
    } else {
        await prisma.store.update({
            where: {storeID: storeID},
            data: {
                rightBanner: validPayload.newBanner,
            },
        });
    }
};

// const updateBanner = async (
//     storeID: string,
//     validPayload: BannerUpdateRequest
// ) => {
//     const store = await prisma.store.findFirst({
//         where: {storeID: storeID},
//     });
//     if (!store) {
//         console.debug(`[store service]: Store not found`);
//         throw new StoreNotFoundError(ResponseMessage.STORE_NOT_FOUND);
//     }

//     if (validPayload.position === `left`) {
//         await prisma.store.update({
//             where: {storeID: storeID},
//             data: {
//                 leftBanner: validPayload.newBanner,
//             },
//         });
//     } else {
//         await prisma.store.update({
//             where: {storeID: storeID},
//             data: {
//                 rightBanner: validPayload.newBanner,
//             },
//         });
//     }
// };

export default {getSlides, getStore, updateBanner};
