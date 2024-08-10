import {Request, Response} from "express";
import providerService from "../services/provider-service";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {Provider} from "@prisma/client";
import {ProviderRequest} from "@/common/schemas";

const createProvider = async (req: Request, res: Response) => {
    const newProvider: ProviderRequest = req.body;

    await providerService.insertProvider(newProvider);

    console.debug(
        `[provider controller]: Insert provider: ${newProvider.providerName} successfull`
    );
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateProvider = async (req: Request, res: Response) => {
    const providerID: string = req.params.id;
    const providerReq: ProviderRequest = req.body;

    await providerService.updateProvider(providerID, providerReq);

    console.debug(
        `[provider controller]: Update provider to ${providerReq.providerName} successfull`
    );
    res.status(StatusCodes.OK).json({
        message: "Update provider success",
    });
};

const deleteProvider = async (req: Request, res: Response) => {
    const providerID: string = req.params.id;

    await providerService.deleteProvider(providerID);
    console.debug(`[provider controller]: Delete provider successfull`);
    res.status(StatusCodes.OK).json({
        message: "Delete provider successfull",
    });
};

const getProviders = async (req: Request, res: Response) => {
    const providers: Provider[] = await providerService.getProviders();

    console.debug(`[provider controller]: Get providers successfull`);
    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: providers,
    });
};

export default {createProvider, updateProvider, deleteProvider, getProviders};
