import {ResponseMessage} from "@/common/constants";
import prisma from "@/common/prisma-client";
import {CategoryRequest} from "@/common/schemas";
import {CategoryWithProductTotal} from "@/common/types";
import CategoryAlreadyExistError from "@/errors/category/category-already-exist";
import CategoryDeletingError from "@/errors/category/category-deleting-error";
import CategoryNotFoundError from "@/errors/category/category-not-found";
import type {Category} from "@prisma/client";

const getCategoryByName = async (
    categoryName: string
): Promise<Category | null> => {
    const category = await prisma.category.findFirst({
        where: {
            categoryName: categoryName,
        },
    });

    return category;
};

const getCategories = async (): Promise<CategoryWithProductTotal[]> => {
    const rawData = await prisma.category.findMany({
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });

    const categories = rawData.reduce<CategoryWithProductTotal[]>(
        (prev, curr) => {
            prev.push({
                categoryID: curr.categoryID,
                categoryName: curr.categoryName,
                productQuantity: curr._count.products,
            });
            return prev;
        },
        []
    );
    return categories;
};

const getCategoryByID = async (
    categoryID: string
): Promise<CategoryWithProductTotal> => {
    const categoryHolder = await prisma.category.findUnique({
        where: {categoryID: categoryID},
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });

    if (!categoryHolder) {
        throw new CategoryNotFoundError(ResponseMessage.CATEGORY_NOT_FOUND);
    }

    return {
        categoryID: categoryID,
        categoryName: categoryHolder.categoryName,
        productQuantity: categoryHolder._count.products,
    };
};

const insertCategory = async (
    validPayload: CategoryRequest
): Promise<Category> => {
    const categoryHolder = await getCategoryByName(validPayload.categoryName);

    if (categoryHolder) {
        throw new CategoryAlreadyExistError(
            ResponseMessage.CATEGORY_ALREADY_EXISTS
        );
    }

    const category = await prisma.category.create({
        data: {
            categoryName: validPayload.categoryName,
        },
    });

    return category;
};

const updateCategory = async (
    categoryID: string,
    validPayload: CategoryRequest
): Promise<Category> => {
    const categoryHolder = await getCategoryByName(validPayload.categoryName);
    if (categoryHolder) {
        throw new CategoryAlreadyExistError(
            ResponseMessage.CATEGORY_ALREADY_EXISTS
        );
    }

    const category = await prisma.category.update({
        where: {categoryID: categoryID},
        data: {
            categoryName: validPayload.categoryName,
        },
    });

    return category;
};

const deleteCategory = async (categoryID: string) => {
    const categoryHolder: CategoryWithProductTotal =
        await getCategoryByID(categoryID);

    if (categoryHolder.productQuantity > 0) {
        throw new CategoryDeletingError(ResponseMessage.CATEGORY_DELETE_FAIL);
    }

    await prisma.category.delete({
        where: {categoryID: categoryID},
    });
};

export default {
    getCategoryByID,
    insertCategory,
    updateCategory,
    deleteCategory,
    getCategories,
};
