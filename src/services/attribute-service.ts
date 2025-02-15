import {ResponseMessage} from "@/common/constants";
import prisma from "@/common/prisma-client";
import {AttributeOptionRequest, AttributeTypeRequest} from "@/common/schemas";
import {Attribute} from "@/common/types";
import AttributeOptionAlreadyExistError from "@/errors/attribute/option-already-exist";
import AttributeOptionNotFound from "@/errors/attribute/option-not-found";
import AttributeTypeAlreadyExistError from "@/errors/attribute/type-already-exist";
import AttributeTypeNotFound from "@/errors/attribute/type-not-found";
import type {AttributeOption, AttributeType} from "@prisma/client";

const getAttributeTypeByID = async (
    typeID: string
): Promise<AttributeType | null> => {
    const attributeType = await prisma.attributeType.findUnique({
        where: {
            typeID: typeID,
        },
    });

    return attributeType;
};

const getAttributeByID = async (typeID: string): Promise<Attribute> => {
    const attribute = await prisma.attributeType.findFirst({
        where: {
            typeID: typeID,
        },
        include: {
            attributeOptions: true,
        },
    });

    if (!attribute) {
        throw new AttributeTypeNotFound(ResponseMessage.ATTR_TYPE_NOT_FOUND);
    }

    return attribute;
};

const getAttributeOptionByID = async (
    optionID: string
): Promise<AttributeOption | null> => {
    const attributeOption = await prisma.attributeOption.findUnique({
        where: {
            optionID: optionID,
        },
    });

    return attributeOption;
};

const getAttributeTypeByValue = async (
    typeValue: string
): Promise<AttributeType | null> => {
    const attributeType = await prisma.attributeType.findFirst({
        where: {
            typeValue: typeValue,
        },
    });

    return attributeType;
};

const getAttributeOptionByValue = async (
    optionValue: string,
    typeID: string
): Promise<AttributeOption | null> => {
    const attributeOption = await prisma.attributeOption.findFirst({
        where: {
            optionValue: optionValue,
            typeID: typeID,
        },
    });

    return attributeOption;
};

const insertAttributeType = async (
    validPayload: AttributeTypeRequest
): Promise<string> => {
    const attributeTypeHolder = await getAttributeTypeByValue(
        validPayload.typeValue
    );

    if (attributeTypeHolder) {
        throw new AttributeTypeAlreadyExistError(
            ResponseMessage.ATTR_TYPE_ALREADY_EXISTS
        );
    }

    const attributeType = await prisma.attributeType.create({
        data: {
            typeValue: validPayload.typeValue,
        },
        select: {
            typeID: true,
        },
    });

    return attributeType.typeID;
};

const updateAttributeType = async (
    typeID: string,
    validPayload: AttributeTypeRequest
) => {
    let attributeTypeHolder = await getAttributeTypeByValue(
        validPayload.typeValue
    );
    if (attributeTypeHolder) {
        throw new AttributeTypeAlreadyExistError(
            ResponseMessage.ATTR_TYPE_ALREADY_EXISTS
        );
    }

    attributeTypeHolder = await getAttributeTypeByID(typeID);
    if (!attributeTypeHolder) {
        throw new AttributeTypeNotFound(ResponseMessage.ATTR_TYPE_NOT_FOUND);
    }

    await prisma.attributeType.update({
        where: {
            typeID: typeID,
        },
        data: {
            typeValue: validPayload.typeValue,
        },
    });
};

const deleteAttributeType = async (typeID: string) => {
    const attributeTypeHolder = await getAttributeTypeByID(typeID);

    if (!attributeTypeHolder) {
        throw new AttributeTypeNotFound(ResponseMessage.ATTR_TYPE_NOT_FOUND);
    }

    // Delete all option belong to that type
    const deleteOptions = prisma.attributeOption.deleteMany({
        where: {
            typeID: typeID,
        },
    });
    const deleteType = prisma.attributeType.delete({
        where: {
            typeID: typeID,
        },
    });

    await prisma.$transaction([deleteOptions, deleteType]);
};

const insertAttributeOption = async (
    typeID: string,
    validPayload: AttributeOptionRequest
): Promise<AttributeOption> => {
    const attributeTypeHolder = await getAttributeTypeByID(typeID);

    if (!attributeTypeHolder) {
        throw new AttributeTypeNotFound(ResponseMessage.ATTR_TYPE_NOT_FOUND);
    }

    const attributeOptionHolder = await getAttributeOptionByValue(
        validPayload.optionValue,
        typeID
    );

    if (attributeOptionHolder) {
        throw new AttributeOptionAlreadyExistError(
            ResponseMessage.ATTR_OPTION_ALREADY_EXISTS
        );
    }

    const attributeOption = await prisma.attributeOption.create({
        data: {
            optionValue: validPayload.optionValue,
            typeID: typeID,
        },
    });

    return attributeOption;
};

const updateAttributeOption = async (
    optionID: string,
    typeID: string,
    validPayload: AttributeOptionRequest
): Promise<AttributeOption> => {
    let attributeOptionHolder = await getAttributeOptionByID(optionID);

    if (!attributeOptionHolder) {
        throw new AttributeOptionNotFound(
            ResponseMessage.ATTR_OPTION_NOT_FOUND
        );
    }

    attributeOptionHolder = await getAttributeOptionByValue(
        validPayload.optionValue,
        typeID
    );
    if (attributeOptionHolder) {
        throw new AttributeOptionAlreadyExistError(
            ResponseMessage.ATTR_OPTION_ALREADY_EXISTS
        );
    }

    const attributeOption = await prisma.attributeOption.update({
        where: {
            optionID: optionID,
        },
        data: {
            optionValue: validPayload.optionValue,
        },
    });

    return attributeOption;
};

const deleteAttributeOption = async (optionID: string) => {
    //Must delete all the link between attribute option and product
    const deleteProductAttribute = prisma.productAttribute.deleteMany({
        where: {
            optionID: optionID,
        },
    });

    //Then delete the attribute option
    const deletAttributeOption = prisma.attributeOption.delete({
        where: {
            optionID: optionID,
        },
    });

    await prisma.$transaction([deleteProductAttribute, deletAttributeOption]);
};

const checkAttributeOptions = async (optionIDs: string[]): Promise<void> => {
    const attributeOptions: AttributeOption[] =
        await prisma.attributeOption.findMany({
            where: {
                optionID: {
                    in: optionIDs,
                },
            },
        });

    if (attributeOptions.length !== optionIDs.length) {
        throw new AttributeOptionNotFound(
            ResponseMessage.ATTR_OPTION_NOT_FOUND
        );
    }
};

const getProductAttributesAfterFilter = async (params: {
    categoryID?: string;
    providerID?: string;
}): Promise<string[]> => {
    const productAttributes = await prisma.productAttribute.findMany({
        distinct: ["optionID"],
        where: {
            Product: {
                categoryID: params.categoryID,
                providerID: params.providerID,
            },
        },
    });

    return productAttributes.map((e) => e.optionID);
};

const getAttributes = async (optionIDs?: string[]): Promise<Attribute[]> => {
    const attributes: Attribute[] = await prisma.attributeType.findMany({
        include: {
            attributeOptions: {
                where: {
                    optionID: {
                        in: optionIDs,
                    },
                },
            },
        },
    });

    return attributes;
};

export default {
    checkAttributeOptions,
    getAttributes,
    getAttributeByID,
    insertAttributeType,
    deleteAttributeType,
    updateAttributeType,
    insertAttributeOption,
    deleteAttributeOption,
    updateAttributeOption,
    getProductAttributesBelongToProviderAndCategory:
        getProductAttributesAfterFilter,
};
