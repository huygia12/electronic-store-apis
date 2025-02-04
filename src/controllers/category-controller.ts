import {Request, Response} from "express";
import categoryService from "../services/category-service";
import {StatusCodes} from "http-status-codes";
import {ResponseMessage} from "@/common/constants";
import {CategoryRequest} from "@/common/schemas";
import {CategoryWithProductTotal} from "@/common/types";

const createCategory = async (req: Request, res: Response) => {
    const newCategory = req.body as CategoryRequest;

    let category = await categoryService.insertCategory(newCategory);

    category = await categoryService.getCategoryByID(category.categoryID);

    res.status(StatusCodes.CREATED).json({
        message: ResponseMessage.SUCCESS,
        info: category,
    });
};

const updateCategory = async (req: Request, res: Response) => {
    const categoryID = req.params.id as string;
    const categoryReq = req.body as CategoryRequest;

    let category = await categoryService.updateCategory(
        categoryID,
        categoryReq
    );

    category = await categoryService.getCategoryByID(category.categoryID);

    res.status(StatusCodes.OK).json({
        message: "Update category success",
        info: category,
    });
};

const deleteCategory = async (req: Request, res: Response) => {
    const categoryID = req.params.id as string;

    await categoryService.deleteCategory(categoryID);
    res.status(StatusCodes.OK).json({
        message: "Delete category successfull",
    });
};

const getCategories = async (req: Request, res: Response) => {
    const categorys: CategoryWithProductTotal[] =
        await categoryService.getCategories();

    return res.status(StatusCodes.OK).json({
        message: ResponseMessage.SUCCESS,
        info: categorys,
    });
};

export default {createCategory, updateCategory, deleteCategory, getCategories};
