import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import attributeService from "../services/attribute-service";
import {ResponseMessage} from "@/common/constants";
import {AttributeOptionRequest, AttributeTypeRequest} from "@/common/schemas";
import {Attribute} from "@/common/types";

const createAttributeOption = async (req: Request, res: Response) => {
    const typeID = req.params.typeID as string;
    const newAttributeOption = req.body as AttributeOptionRequest;

    const attributeOption = await attributeService.insertAttributeOption(
        typeID,
        newAttributeOption
    );

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: attributeOption,
    });
};

const updateAttributeOption = async (req: Request, res: Response) => {
    const optionID = req.params.optionID as string;
    const typeID = req.params.typeID as string;
    const attributeOptionUpdateReq: AttributeOptionRequest = req.body;

    const attributeOption = await attributeService.updateAttributeOption(
        optionID,
        typeID,
        attributeOptionUpdateReq
    );

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: attributeOption,
    });
};

const deleteAttributeOption = async (req: Request, res: Response) => {
    const optionID = req.params.optionID as string;

    await attributeService.deleteAttributeOption(optionID);
    res.status(StatusCodes.OK).json({
        message: "Delete attribute option successfull",
    });
};

const createAttributeType = async (req: Request, res: Response) => {
    const createAttributeTypeReq = req.body as AttributeTypeRequest;

    const typeID = await attributeService.insertAttributeType(
        createAttributeTypeReq
    );

    const payload = await attributeService.getAttributeByID(typeID);

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: payload,
    });
};

const updateAttributeType = async (req: Request, res: Response) => {
    const typeID = req.params.typeID as string;
    const attributeTypeReq = req.body as AttributeTypeRequest;

    await attributeService.updateAttributeType(typeID, attributeTypeReq);

    const payload = await attributeService.getAttributeByID(typeID);

    res.status(StatusCodes.OK).json({
        message: "Update attribute type success",
        info: payload,
    });
};

const deleteAttributeType = async (req: Request, res: Response) => {
    const typeID = req.params.typeID as string;

    await attributeService.deleteAttributeType(typeID);

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getAttributes = async (req: Request, res: Response) => {
    const providerID = req.query.providerID as string;
    const categoryID = req.query.categoryID as string;

    let optionIDs: string[] = [];
    if (categoryID || providerID) {
        optionIDs = await attributeService.getProductAttributesAfterFilter({
            providerID: providerID,
            categoryID: categoryID,
        });
    }

    const attributes: Attribute[] = await attributeService.getAttributes(
        optionIDs.length === 0 ? undefined : optionIDs
    );

    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: attributes,
    });
};

export default {
    createAttributeType,
    updateAttributeType,
    deleteAttributeType,
    createAttributeOption,
    updateAttributeOption,
    deleteAttributeOption,
    getAttributes,
};
