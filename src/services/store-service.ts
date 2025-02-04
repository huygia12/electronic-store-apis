import {BannerUpdateRequest, SlidesUpdateRequest} from "@/common/schemas";
import prisma from "@/common/prisma-client";
import {SlideShow, Store} from "@prisma/client";
import StoreNotFoundError from "@/errors/store/store-not-found";
import {ResponseMessage} from "@/common/constants";

const getSlides = async (): Promise<SlideShow[]> => {
    const slides = await prisma.slideShow.findMany();

    return slides;
};

const getStore = async (): Promise<Store | null> => {
    const store = await prisma.store.findFirst();
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

const updateSlides = async (validPayload: SlidesUpdateRequest) => {
    await prisma.slideShow.deleteMany();

    await prisma.slideShow.createMany({data: validPayload});
};

export default {getSlides, getStore, updateBanner, updateSlides};
