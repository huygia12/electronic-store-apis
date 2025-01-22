import {ResponseMessage} from "@/common/constants";
import prisma from "@/common/prisma-client";
import {ProviderRequest} from "@/common/schemas";
import {Nullable, ProviderWithProductTotal} from "@/common/types";
import ProviderAlreadyExistError from "@/errors/provider/provider-already-exist";
import ProviderDeletingError from "@/errors/provider/provider-deleting-error";
import ProviderNotFoundError from "@/errors/provider/provider-not-found";
import {Provider} from "@prisma/client";

const getProviderByName = async (
    providerName: string
): Promise<Nullable<Provider>> => {
    const provider: Nullable<Provider> = await prisma.provider.findFirst({
        where: {
            providerName: providerName,
        },
    });

    return provider;
};

const getProviders = async (): Promise<ProviderWithProductTotal[]> => {
    const rawData = await prisma.provider.findMany({
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });

    const providers = rawData.reduce<ProviderWithProductTotal[]>(
        (prev, curr) => {
            prev.push({
                providerID: curr.providerID,
                providerName: curr.providerName,
                productQuantity: curr._count.products,
            });
            return prev;
        },
        []
    );
    return providers;
};

const getProviderByID = async (
    providerID: string
): Promise<ProviderWithProductTotal> => {
    const providerHolder = await prisma.provider.findUnique({
        where: {providerID: providerID},
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });

    if (!providerHolder) {
        throw new ProviderNotFoundError(ResponseMessage.PROVIDER_NOT_FOUND);
    }

    return {
        providerID: providerID,
        providerName: providerHolder.providerName,
        productQuantity: providerHolder._count.products,
    };
};

const insertProvider = async (
    validPayload: ProviderRequest
): Promise<Provider> => {
    const providerHolder: Nullable<Provider> = await getProviderByName(
        validPayload.providerName
    );

    if (providerHolder) {
        throw new ProviderAlreadyExistError(
            ResponseMessage.PROVIDER_ALREADY_EXISTS
        );
    }

    const provider = await prisma.provider.create({
        data: {
            providerName: validPayload.providerName,
        },
    });

    return provider;
};

const updateProvider = async (
    providerID: string,
    validPayload: ProviderRequest
): Promise<Provider> => {
    let providerHolder: Nullable<Provider> = await getProviderByName(
        validPayload.providerName
    );
    if (providerHolder) {
        throw new ProviderAlreadyExistError(
            ResponseMessage.PROVIDER_ALREADY_EXISTS
        );
    }

    const provider = await prisma.provider.update({
        where: {providerID: providerID},
        data: {
            providerName: validPayload.providerName,
        },
    });

    return provider;
};

const deleteProvider = async (providerID: string) => {
    const providerHolder: ProviderWithProductTotal =
        await getProviderByID(providerID);

    if (providerHolder.productQuantity > 0) {
        throw new ProviderDeletingError(ResponseMessage.PROVIDER_DELETE_FAIL);
    }

    await prisma.provider.delete({
        where: {providerID: providerID},
    });
};

export default {
    getProviderByID,
    insertProvider,
    updateProvider,
    deleteProvider,
    getProviders,
};
