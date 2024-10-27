import {ResponseMessage} from "@/common/constants";
import {BannerUpdateRequest} from "@/common/schemas";
import storeService from "@/services/store-service";
import {SlideShow} from "@prisma/client";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const getSliderImages = async (req: Request, res: Response) => {
    const storeID = req.params.storeID as string;

    const payload: SlideShow[] = await storeService.getSlides(storeID);

    console.debug(`[store controller]: get slides successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

const updateBanner = async (req: Request, res: Response) => {
    const storeID = req.params.id as string;
    const bannerUpdateRequest = req.body as BannerUpdateRequest;
    let position: string = bannerUpdateRequest.position;
    if (![`left`, `right`].includes(position)) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            message: ResponseMessage.POSITION_INVALID,
        });
        return;
    }

    await storeService.updateBanner(storeID, bannerUpdateRequest);

    console.debug(`[store controller]: update banner successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getStore = async (req: Request, res: Response) => {
    const payload = await storeService.getStore();

    console.debug(`[store controller]: get store successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

export default {getSliderImages, getStore, updateBanner};
