import {ResponseMessage} from "@/common/constants";
import prisma from "@/common/prisma-client";
import {ProductItemRequest, ProductRequest} from "@/common/schemas";
import {Nullable, ProductFullJoin} from "@/common/types";
import ProductNotFoundError from "@/errors/product/product-not-found";
import {Product} from "@prisma/client";
import providerService from "./provider-service";
import categoryService from "./category-service";
import attributeService from "./attribute-service";

const getItemImageInsertion = (
    productItems: ProductItemRequest[],
    productItemIDs: string[]
): {itemID: string; source: string}[] => {
    let i = 0;
    return productItems.reduce<{itemID: string; source: string}[]>(
        (prev, curr) => {
            curr.itemImages.forEach((image) => {
                prev.push({itemID: productItemIDs[i], source: image});
            });
            i++;
            return prev;
        },
        []
    );
};

const createProduct = async (validPayload: ProductRequest) => {
    // check if providerID, categoryID exist or not
    await providerService.getProviderByID(validPayload.providerID);
    await categoryService.getCategoryByID(validPayload.categoryID);
    // check if optionIDs exist or not
    validPayload.options &&
        (await attributeService.checkAttributeOptions(validPayload.options));
    await prisma.$transaction(async (prisma) => {
        // await db.transaction(async trx => {
        //Insert into Product and then retrieve the id
        const productID: string = (
            await prisma.product.create({
                data: {
                    productName: validPayload.productName,
                    description: validPayload.description,
                    length: validPayload.length,
                    width: validPayload.width,
                    height: validPayload.height,
                    weight: validPayload.weight,
                    warranty: validPayload.warranty,
                    categoryID: validPayload.categoryID,
                    providerID: validPayload.providerID,
                },
                select: {
                    productID: true,
                },
            })
        ).productID;

        console.debug(`[create product]: productID: ${productID}`);

        //Insert into ProductItemTable and then retieve the ids
        await prisma.productItem.createMany({
            data: validPayload.productItems.map((item) => ({
                productID: productID,
                color: item.color,
                price: item.price,
                productCode: item.productCode,
                quantity: item.quantity,
                thump: item.thump,
                discount: item.discount,
                storage: item.storage,
            })),
        });
        const productItemIDs: string[] = (
            await prisma.productItem.findMany({
                where: {productID: productID},
                select: {
                    itemID: true,
                },
            })
        ).map((item) => item.itemID);

        console.debug(`[create product]: product ItemIDs: ${productItemIDs}`);

        //Insert into ProductImageTable
        await prisma.itemImage.createMany({
            data: getItemImageInsertion(
                validPayload.productItems,
                productItemIDs
            ),
        });

        //Insert into ProductAttributeTable
        if (validPayload.options && validPayload.options.length !== 0) {
            await prisma.productAttribute.createMany({
                data: validPayload.options.map((attribute) => ({
                    productID: productID,
                    optionID: attribute,
                })),
            });
        }
    });

    // })
};

const updateProduct = async (
    validPayload: ProductRequest,
    productID: string
) => {
    // check if providerID, categoryID exist or not
    await providerService.getProviderByID(validPayload.providerID);
    await categoryService.getCategoryByID(validPayload.categoryID);
    // check if optionIDs exist or not
    validPayload.options &&
        (await attributeService.checkAttributeOptions(validPayload.options));
    // check if productID exists or not
    await getProductFullJoinWithID(productID);
    await prisma.$transaction(async (prisma) => {
        //Update ProductTable
        await prisma.product.update({
            where: {productID: productID},
            data: {
                productName: validPayload.productName,
                description: validPayload.description,
                length: validPayload.length,
                width: validPayload.width,
                height: validPayload.height,
                weight: validPayload.weight,
                warranty: validPayload.warranty,
                categoryID: validPayload.categoryID,
                providerID: validPayload.providerID,
            },
        });

        //Delete attributes relate to product and then update the new one
        await prisma.productAttribute.deleteMany({
            where: {productID: productID},
        });
        if (validPayload.options && validPayload.options.length !== 0) {
            await prisma.productAttribute.createMany({
                data: validPayload.options.map((attribute) => ({
                    productID: productID,
                    optionID: attribute,
                })),
            });
        }

        //Delete images relate to product items
        let productItemIDs: string[] = await prisma.productItem
            .findMany({
                where: {productID: productID},
                select: {
                    itemID: true,
                },
            })
            .then((itemIDs) => itemIDs.map((item) => item.itemID));
        await prisma.itemImage.deleteMany({
            where: {
                itemID: {
                    in: productItemIDs,
                },
            },
        });

        //Delete items relate to product and then update the new one. After that, retrive ids to update item images
        await prisma.productItem.deleteMany({
            where: {productID: productID},
        });
        await prisma.productItem.createMany({
            data: validPayload.productItems.map((item) => ({
                productID: productID,
                color: item.color,
                price: item.price,
                productCode: item.productCode,
                quantity: item.quantity,
                thump: item.thump,
                discount: item.discount,
                storage: item.storage,
            })),
        });
        productItemIDs = await prisma.productItem
            .findMany({
                where: {productID: productID},
                select: {
                    itemID: true,
                },
            })
            .then((itemIDs) => itemIDs.map((item) => item.itemID));

        //Update items image
        await prisma.itemImage.createMany({
            data: getItemImageInsertion(
                validPayload.productItems,
                productItemIDs
            ),
        });
    });
};

const deleteProduct = async (productID: string) => {
    await getProductFullJoinWithID(productID);
    await prisma.$transaction(async (prisma) => {
        //Delete ProductImageTable
        let productItemIDs: string[] = await prisma.productItem
            .findMany({
                where: {productID: productID},
                select: {
                    itemID: true,
                },
            })
            .then((itemIDs) => itemIDs.map((item) => item.itemID));
        await prisma.itemImage.deleteMany({
            where: {
                itemID: {
                    in: productItemIDs,
                },
            },
        });

        //Delete ProductAttributeTable
        await prisma.productAttribute.deleteMany({
            where: {productID: productID},
        });

        //Delete ProductItemTable
        await prisma.productItem.deleteMany({
            where: {productID: productID},
        });

        //Delete ProductTable
        await prisma.product.delete({
            where: {productID: productID},
        });
    });
};

const getProductsSummary = async (): Promise<Product[]> => {
    const products: Product[] = await prisma.product.findMany();
    return products;
};

const getProductsFullJoin = async (): Promise<ProductFullJoin[]> => {
    const products: ProductFullJoin[] = await prisma.product.findMany({
        select: {
            productID: true,
            productName: true,
            description: true,
            length: true,
            width: true,
            height: true,
            weight: true,
            warranty: true,
            categoryID: true,
            providerID: true,
            productAttributes: true,
            productItems: {
                select: {
                    itemID: true,
                    thump: true,
                    quantity: true,
                    price: true,
                    productCode: true,
                    discount: true,
                    color: true,
                    storage: true,
                },
                include: {
                    itemImages: true,
                },
            },
        },
    });
    return products;
};

const getProductsFullJoinWithCategoryID = async (
    categoryID: string
): Promise<ProductFullJoin[]> => {
    const products: ProductFullJoin[] = await prisma.product.findMany({
        where: {
            categoryID: categoryID,
        },
        select: {
            productID: true,
            productName: true,
            description: true,
            length: true,
            width: true,
            height: true,
            weight: true,
            warranty: true,
            categoryID: true,
            providerID: true,
            productAttributes: true,
            productItems: {
                select: {
                    itemID: true,
                    thump: true,
                    quantity: true,
                    price: true,
                    productCode: true,
                    discount: true,
                    color: true,
                    storage: true,
                    productID: true,
                    itemImages: true,
                },
            },
        },
    });
    return products;
};

const getProductsFullJoinWithProviderID = async (
    providerID: string
): Promise<ProductFullJoin[]> => {
    const products: ProductFullJoin[] = await prisma.product.findMany({
        where: {
            providerID: providerID,
        },
        select: {
            productID: true,
            productName: true,
            description: true,
            length: true,
            width: true,
            height: true,
            weight: true,
            warranty: true,
            categoryID: true,
            providerID: true,
            productAttributes: true,
            productItems: {
                select: {
                    itemID: true,
                    thump: true,
                    quantity: true,
                    price: true,
                    productCode: true,
                    discount: true,
                    color: true,
                    storage: true,
                    productID: true,
                    itemImages: true,
                },
            },
        },
    });
    return products;
};

const getProductFullJoinWithID = async (
    productID: string
): Promise<ProductFullJoin> => {
    const product: Nullable<ProductFullJoin> = await prisma.product.findUnique({
        where: {
            productID: productID,
        },
        select: {
            productID: true,
            productName: true,
            description: true,
            length: true,
            width: true,
            height: true,
            weight: true,
            warranty: true,
            categoryID: true,
            providerID: true,
            productAttributes: true,
            productItems: {
                select: {
                    itemID: true,
                    thump: true,
                    quantity: true,
                    price: true,
                    productCode: true,
                    discount: true,
                    color: true,
                    storage: true,
                    productID: true,
                    itemImages: true,
                },
            },
        },
    });

    if (!product) {
        console.debug(
            `[product service]: product with id ${productID} not found`
        );
        throw new ProductNotFoundError(ResponseMessage.PRODUCT_NOT_FOUND);
    }

    return product;
};

export default {
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsSummary,
    getProductsFullJoinWithCategoryID,
    getProductsFullJoinWithProviderID,
    getProductsFullJoin,
    getProductFullJoinWithID,
};
