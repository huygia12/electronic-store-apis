import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import attributeService from "../services/attribute-service";
import {ResponseMessage} from "@/common/constants";
import {AttributeOptionRequest, AttributeTypeRequest} from "@/common/schemas";
import {Attribute} from "@/common/types";

const createAttributeOption = async (req: Request, res: Response) => {
    const typeID: string = req.params.typeID;
    const newAttributeOption: AttributeOptionRequest = req.body;

    await attributeService.insertAttributeOption(typeID, newAttributeOption);

    console.debug(`[attribute controller]: 
        Attribute option: ${newAttributeOption} has been added successfull`);
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateAttributeOption = async (req: Request, res: Response) => {
    const optionID: string = req.params.optionID;
    const typeID: string = req.params.typeID;
    const attributeOptionUpdateReq: AttributeOptionRequest = req.body;

    await attributeService.updateAttributeOption(
        optionID,
        typeID,
        attributeOptionUpdateReq
    );

    console.debug(`[attribute controller]: 
        Attribute option: upate attribute option with id ${attributeOptionUpdateReq.optionValue} successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const deleteAttributeOption = async (req: Request, res: Response) => {
    const optionID: string = req.params.optionID;
    const typeID: string = req.params.typeID;

    await attributeService.deleteAttributeOption(optionID, typeID);
    console.debug(
        `[attribute controller]: Attribute option: delete option successfull`
    );
    res.status(StatusCodes.OK).json({
        message: "Delete attribute option successfull",
    });
};

const createAttributeType = async (req: Request, res: Response) => {
    const createAttributeTypeReq: AttributeTypeRequest = req.body;

    await attributeService.insertAttributeType(createAttributeTypeReq);

    console.debug(`[attribute controller]: 
        Attribute type: ${createAttributeTypeReq.typeValue} has been added successfull`);
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateAttributeType = async (req: Request, res: Response) => {
    const typeID: string = req.params.typeID;
    const attributeTypeReq: AttributeTypeRequest = req.body;

    await attributeService.updateAttributeType(typeID, attributeTypeReq);

    console.debug(`[attribute controller]: 
        Attribute type: update to ${attributeTypeReq.typeValue} successfull`);
    res.status(StatusCodes.OK).json({
        message: "Update attribute type success",
    });
};

const deleteAttributeType = async (req: Request, res: Response) => {
    const typeID: string = req.params.typeID;

    await attributeService.deleteAttributeType(typeID);

    console.debug(`[attribute controller]: Attribute type: delete successfull`);
    res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
    });
};

const getAttributes = async (req: Request, res: Response) => {
    const attributes: Attribute[] = await attributeService.getAttributes();

    console.debug(`[attribute controller]: get attributes successfull`);
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
