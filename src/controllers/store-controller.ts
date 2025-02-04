import {ResponseMessage} from "@/common/constants";
import {BannerUpdateRequest, SlidesUpdateRequest} from "@/common/schemas";
import storeService from "@/services/store-service";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

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

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateSlides = async (req: Request, res: Response) => {
    const slides = req.body as SlidesUpdateRequest;

    await storeService.updateSlides(slides);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getStore = async (req: Request, res: Response) => {
    const store = await storeService.getStore();
    const slides = await storeService.getSlides();

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: {
            store: store,
            slides: slides,
        },
    });
};

export default {getStore, updateBanner, updateSlides};
