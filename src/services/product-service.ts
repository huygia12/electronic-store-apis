import {ResponseMessage, Sort} from "@/common/constants";
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
import {Prisma} from "@prisma/client";

const productSizeLimit = 12;

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
    limit?: number;
    currentPage: number;
}): Promise<ProductSummary[]> => {
    const products: ProductSummary[] = await prisma.product.findMany({
        where: {
            categoryID: params.categoryID,
            providerID: params.providerID,
            productName: {
                contains: params.searchingName,
                mode: "insensitive",
            },
        },
        include: {
            category: true,
            provider: true,
            productItems: {
                select: {
                    thump: true,
                    price: true,
                    discount: true,
                },
                take: 1,
            },
        },
        skip: (params.currentPage - 1) * (params.limit || productSizeLimit),
        take: params.limit || productSizeLimit,
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

const getProductFullJoinList = async (params: {
    categoryID?: string;
    providerID?: string;
    sale?: boolean;
    limit?: number;
    sortByPrice?: Sort;
    sortByName?: Sort;
    optionIDs?: string[];
    exceptID?: string;
    minPrice: number;
    maxPrice: number;
    currentPage: number;
}): Promise<ProductFullJoin[]> => {
    let query = `
SELECT ft."productID", ft."itemID", ft."maxPrice"
FROM (
      SELECT 
        gr."productID", 
        gr."itemID", 
        MAX(gr."afterDiscountPrice") as "maxPrice",
        ROW_NUMBER() OVER (PARTITION BY gr."productID" ORDER BY gr."itemID") AS rn
      FROM
        (
          SELECT 
            p."productID", 
            pi."itemID",
            pi."price" * (100 - COALESCE(pi."discount", 0))/100 AS "afterDiscountPrice"
          FROM "Product" p
            JOIN "ProductItem" pi ON p."productID" = pi."productID"
          WHERE
            pi."price" >= ${params.minPrice}
            ${params.exceptID ? `AND p."productID" <> '${params.exceptID}'` : ""}
            ${params.providerID ? `AND p."providerID" = '${params.providerID}'` : ""}
            ${params.categoryID ? `AND p."categoryID" = '${params.categoryID}'` : ""}
            ${params.sale ? `AND pi."discount" > 0` : ""}
        ) as gr
        LEFT JOIN "ProductAttribute" pa ON gr."productID" = pa."productID"
        WHERE
            gr."afterDiscountPrice" BETWEEN ${params.minPrice} AND ${params.maxPrice}
        GROUP BY gr."productID", gr."itemID"
            ${
                params.optionIDs
                    ? `HAVING ARRAY_AGG(pa."optionID") @> ARRAY[${params.optionIDs.map((id) => `'${id}'::uuid`).join(", ")}]`
                    : ""
            }
      ) as ft
WHERE rn = 1
    `;

    const orderByClauses = [];
    if (params.sortByPrice) {
        orderByClauses.push(`"maxPrice" ${params.sortByPrice}`);
    }
    if (params.sortByName) {
        orderByClauses.push(`p."productName" ${params.sortByName}`);
    }
    if (orderByClauses.length) {
        query += ` ORDER BY ${orderByClauses.join(", ")}`;
    }
    const limit = params.limit || productSizeLimit;
    const offset = (params.currentPage - 1) * limit;

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log(query);
    //Get productID and itemID satisfying the conditions
    const queryRows: {productID: string; itemID: string}[] =
        await prisma.$queryRaw`${Prisma.raw(query)}`;

    //Get products join with all other tables
    const result =
        await getResultAfterFilterProductWithSepecificItem(queryRows);

    //Arrange products
    if (params.sortByName || params.sortByPrice) {
        const productMap = new Map<string, ProductFullJoin>();
        result.products.forEach((product) => {
            productMap.set(product.productID, product);
        });

        const sortedProducts = result.productIDs.reduce<ProductFullJoin[]>(
            (prev, curr) => {
                const mapElement = productMap.get(curr);
                mapElement && prev.push(mapElement);
                return prev;
            },
            []
        );
        return sortedProducts;
    }
    return result.products;
};

const getResultAfterFilterProductWithSepecificItem = async (
    searchingIDs: {productID: string; itemID: string}[]
): Promise<{products: ProductFullJoin[]; productIDs: string[]}> => {
    const productSet = new Set<string>();
    const itemSet = new Set<string>();

    searchingIDs.forEach((searchingID) => {
        productSet.add(searchingID.productID);
        itemSet.add(searchingID.itemID);
    });

    const productIDs = Array.from(productSet);
    const itemIDs = Array.from(itemSet);

    const productJoinWithItems: ProductFullJoin[] =
        await prisma.product.findMany({
            where: {
                productID: {
                    in: productIDs,
                },
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
                    where: {
                        itemID: {
                            in: itemIDs,
                        },
                    },
                    include: {
                        itemImages: true,
                    },
                    take: 1,
                },
            },
        });

    return {products: productJoinWithItems, productIDs};
};

const getProductsWithSpecificItem = async (
    products: {productID: string; itemID: string}[]
): Promise<ProductJoinWithItems[]> => {
    const productSet = new Set<string>();
    const itemSet = new Set<string>();

    products.forEach((product) => {
        productSet.add(product.productID);
        itemSet.add(product.itemID);
    });

    const productIDs = Array.from(productSet);
    const itemIDs = Array.from(itemSet);

    const productJoinWithItems: ProductJoinWithItems[] =
        await prisma.product.findMany({
            where: {
                productID: {
                    in: productIDs,
                },
            },
            include: {
                category: true,
                provider: true,
                productItems: {
                    where: {
                        itemID: {
                            in: itemIDs,
                        },
                    },
                },
            },
        });

    return productJoinWithItems;
};

const getNumberOfProducts = async (params: {
    categoryID?: string;
    providerID?: string;
    sale?: boolean;
    limit?: number;
    optionIDs?: string[];
    searchingName?: string;
    exceptID?: string;
    minPrice: number;
    maxPrice: number;
}): Promise<number> => {
    let query = `
    SELECT CAST(COUNT(*) AS INTEGER) as quantity
    FROM (
        SELECT 
            p."productID", 
            pi."itemID",
            ROW_NUMBER() OVER (PARTITION BY p."productID" ORDER BY pi."itemID") AS rn
        FROM "Product" p
            JOIN "ProductItem" pi ON p."productID" = pi."productID"
            LEFT JOIN "ProductAttribute" pa ON p."productID" = pa."productID"
        WHERE
            pi."price" BETWEEN ${params.minPrice} AND ${params.maxPrice}
            ${params.exceptID ? `AND p."productID" <> '${params.exceptID}'` : ""}
            ${params.searchingName ? `AND LOWER(p."productName") LIKE LOWER('%${params.searchingName}%')` : ""}
            ${params.providerID ? `AND p."providerID" = '${params.providerID}'` : ""}
            ${params.categoryID ? `AND p."categoryID" = '${params.categoryID}'` : ""}
            ${params.sale ? `AND pi."discount" > 0` : ""}
        GROUP BY p."productID", pi."itemID"
        ${
            params.optionIDs
                ? `HAVING ARRAY_AGG(pa."optionID") @> ARRAY[${params.optionIDs.map((id) => `'${id}'::uuid`).join(", ")}]`
                : ""
        }
    ) AS gr
    WHERE rn = 1
    `;

    const queryRows: {quantity: number}[] =
        await prisma.$queryRaw`${Prisma.raw(query)}`;
    return queryRows[0].quantity;
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

const decearseItemsQuantity = async (items: ItemDictionary) => {
    const itemKeys = Object.keys(items);
    const updateOperations = itemKeys.map((itemID) => {
        return prisma.productItem.update({
            where: {
                itemID: itemID,
            },
            data: {
                quantity: {
                    decrement: items[itemID].quantity,
                },
            },
        });
    });

    await prisma.$transaction(updateOperations);
};

export default {
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsSummary,
    getProductFullJoinWithID,
    getProductFullJoinList,
    getProductsWithSpecificItem,
    getValidProductsInOrder,
    getStatus,
    decearseItemsQuantity,
    getNumberOfProducts,
};
