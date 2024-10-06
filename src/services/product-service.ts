import {ResponseMessage} from "@/common/constants";
import prisma from "@/common/prisma-client";
import {
    OrderProductRequest,
    ProductItemRequest,
    ProductRequest,
} from "@/common/schemas";
import {
    ItemDictionary,
    Nullable,
    ProductFullJoin,
    ProductJoinWithItems,
    ProductStatus,
    ProductSummary,
} from "@/common/types";
import ProductNotFoundError from "@/errors/product/product-not-found";
import providerService from "./provider-service";
import categoryService from "./category-service";
import attributeService from "./attribute-service";
import ProductInOrderNotEnoughQuantity from "@/errors/order/product-in-order-not-enough-quantity";

const productSizeLimit = 10;

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

const getValidProductsInOrder = async (
    productsInOrder: OrderProductRequest[]
): Promise<ItemDictionary> => {
    //get products from database
    const products = await getProductsWithSpecificItem(
        productsInOrder.map((product) => {
            return {
                productID: product.productID,
                itemID: product.itemID,
            };
        })
    );

    //make an dictionary out of the products data
    const itemDictionary = products.reduce<ItemDictionary>((prev, curr) => {
        curr.productItems.forEach((item) => {
            prev[item.itemID] = {
                discount: item.discount,
                price: item.price,
                productName: curr.productName,
                quantity: item.quantity,
                productCode: item.productCode,
                color: item.color,
                storage: item.storage,
                categoryName: curr.category.categoryName,
                providerName: curr.provider.providerName,
                thump: item.thump,
                itemID: item.itemID,
                productID: curr.productID,
            };
        });
        return prev;
    }, {});

    try {
        // check if the quantity of each product is enough or not
        productsInOrder.map((product) => {
            if (itemDictionary[product.itemID].quantity < product.quantity) {
                throw new ProductInOrderNotEnoughQuantity(
                    ResponseMessage.PRODUCT_IN_ORDER_NOT_ENOUGH_QUANTITY
                );
            } else {
                itemDictionary[product.itemID].quantity = product.quantity;
            }
        });

        return itemDictionary;
    } catch {
        // Get in here if there is a product in order but not exist in database
        console.debug(
            `[product-service] checkIfProductsInOrder: product not found in dictionary`
        );
        throw new ProductNotFoundError(ResponseMessage.PRODUCT_NOT_FOUND);
    }
};

const getProductsSummary = async (params: {
    searchingName?: string;
    providerID?: string;
    categoryID?: string;
    currentPage: number;
}): Promise<ProductSummary[]> => {
    const products: ProductSummary[] = await prisma.product.findMany({
        where: {
            categoryID: params.categoryID,
            providerID: params.providerID,
            productName: {
                contains: params.searchingName,
            },
        },
        include: {
            category: true,
            provider: true,
            productItems: {
                select: {
                    thump: true,
                },
                take: 1,
            },
        },
        skip: (params.currentPage - 1) * productSizeLimit,
        take: productSizeLimit,
    });
    return products;
};

const getProductFullJoinWithID = async (
    productID: string
): Promise<ProductFullJoin> => {
    const product: Nullable<ProductFullJoin> = await prisma.product.findFirst({
        where: {
            productID: productID,
        },
        include: {
            category: true,
            provider: true,
            productAttributes: {
                include: {
                    attributeOption: {
                        include: {
                            attributeType: true,
                        },
                    },
                },
            },
            productItems: {
                include: {
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

const getProductsFullJoinAfterFilter = async (
    categoryID?: string,
    providerID?: string,
    limit: number = 10
): Promise<ProductFullJoin[]> => {
    const products: Nullable<ProductFullJoin[]> = await prisma.product.findMany(
        {
            where: {
                categoryID: categoryID,
                providerID: providerID,
            },
            take: limit,
            include: {
                category: true,
                provider: true,
                productAttributes: {
                    include: {
                        attributeOption: {
                            include: {
                                attributeType: true,
                            },
                        },
                    },
                },
                productItems: {
                    include: {
                        itemImages: true,
                    },
                },
            },
        }
    );

    return products;
};

const getProductsWithSpecificItem = async (
    products: {productID: string; itemID: string}[]
): Promise<ProductJoinWithItems[]> => {
    const productIds: string[] = [];
    const itemIds: string[] = [];

    products.forEach((product) => {
        if (!productIds.includes(product.productID)) {
            productIds.push(product.productID);
        }
        itemIds.push(product.itemID);
    });

    const productJoinWithItems: ProductJoinWithItems[] =
        await prisma.product.findMany({
            where: {
                productID: {
                    in: productIds,
                },
            },
            include: {
                category: true,
                provider: true,
                productItems: {
                    where: {
                        itemID: {
                            in: itemIds,
                        },
                    },
                },
            },
        });

    return productJoinWithItems;
};

const getNumberOfProducts = async (params: {
    searchingName?: string;
    providerID?: string;
    categoryID?: string;
}): Promise<number> => {
    const quantity: number = await prisma.product.count({
        where: {
            categoryID: params.categoryID,
            providerID: params.providerID,
            productName: {
                contains: params.searchingName,
            },
        },
    });
    return quantity;
};

const getStatus = async (productID: string): Promise<ProductStatus> => {
    const productStatus = await prisma.review.groupBy({
        by: [`productID`],
        where: {
            productID: productID,
        },
        _avg: {
            rating: true,
        },
    });

    return {
        rating: productStatus[0]._avg.rating || 0,
    };
};

export default {
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsSummary,
    getProductFullJoinWithID,
    getProductsFullJoinAfterFilter,
    getProductsWithSpecificItem,
    getNumberOfProducts,
    getValidProductsInOrder,
    getStatus,
};
