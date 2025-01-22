import {Request, Response} from "express";
import providerService from "../services/provider-service";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {ProviderRequest} from "@/common/schemas";
import {ProviderWithProductTotal} from "@/common/types";

const createProvider = async (req: Request, res: Response) => {
    const newProvider = req.body as ProviderRequest;

    let provider = await providerService.insertProvider(newProvider);

    provider = await providerService.getProviderByID(provider.providerID);

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: provider,
    });
};

const updateProvider = async (req: Request, res: Response) => {
    const providerID = req.params.id as string;
    const providerReq = req.body as ProviderRequest;

    let provider = await providerService.updateProvider(
        providerID,
        providerReq
    );

    provider = await providerService.getProviderByID(provider.providerID);

    res.status(StatusCodes.OK).json({
        message: "Update provider success",
        info: provider,
    });
};

const deleteProvider = async (req: Request, res: Response) => {
    const providerID = req.params.id as string;

    await providerService.deleteProvider(providerID);
    res.status(StatusCodes.OK).json({
        message: "Delete provider successfull",
    });
};

const getProviders = async (req: Request, res: Response) => {
    const providers: ProviderWithProductTotal[] =
        await providerService.getProviders();

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: providers,
    });
};

export default {createProvider, updateProvider, deleteProvider, getProviders};
