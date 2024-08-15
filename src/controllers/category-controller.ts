import {Request, Response} from "express";
import categoryService from "../services/category-service";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {CategoryRequest} from "@/common/schemas";
import {Category} from "@prisma/client";
import {CategoryType} from "@/common/types";

const createCategory = async (req: Request, res: Response) => {
    const newCategory: CategoryRequest = req.body;

    await categoryService.insertCategory(newCategory);

    console.debug(
        `[category controller]: Insert category: ${newCategory.categoryName} successfull`
    );
    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
    });
};

const updateCategory = async (req: Request, res: Response) => {
    const categoryID: string = req.params.id;
    const categoryReq: CategoryRequest = req.body;

    await categoryService.updateCategory(categoryID, categoryReq);

    console.debug(
        `[category controller]: Update category to ${categoryReq.categoryName} successfull`
    );
    res.status(StatusCodes.OK).json({
        message: "Update category success",
    });
};

const deleteCategory = async (req: Request, res: Response) => {
    const categoryID: string = req.params.id;

    await categoryService.deleteCategory(categoryID);
    console.debug(`[category controller]: Delete category successfull`);
    res.status(StatusCodes.OK).json({
        message: "Delete category successfull",
    });
};

const getCategories = async (req: Request, res: Response) => {
    const categorys: CategoryType[] = await categoryService.getCategories();

    console.debug(`[category controller]: Get categorys successfull`);
    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: categorys,
    });
};

export default {createCategory, updateCategory, deleteCategory, getCategories};
