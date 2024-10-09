import prisma from "@/common/prisma-client";
import {OrderProductRequest, OrderRequest} from "@/common/schemas";
import {
    InvoiceFullJoin,
    InvoiceStatistic,
    ItemDictionary,
    ProductWithSpecificItem,
    UserDTO,
} from "@/common/types";
import {Invoice, invoiceStatus, paymentMethod} from "@prisma/client";
import {format} from "date-fns";

const getNumberOfInvoicesByDay = async (
    date: Date = new Date()
): Promise<number> => {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const invoices: number = await prisma.invoice.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    return invoices;
};

const getNumberOfInvoices = async (params: {
    status: invoiceStatus;
    from: Date;
    to?: Date;
    userName?: string;
}): Promise<number> => {
    const startOfDay = new Date(params.from.setHours(0, 0, 0, 0));
    const endOfDay = new Date(
        (params.to || new Date()).setHours(23, 59, 59, 999)
    );
    const invoices: number = await prisma.invoice.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    return invoices;
};

const getInvoicesBetweenDate = async (
    from: Date,
    to?: Date
): Promise<InvoiceFullJoin[]> => {
    const startOfDay = new Date(from.setHours(0, 0, 0, 0));
    const endOfDay = new Date(
        to ? to.setHours(23, 59, 59, 999) : from.setHours(23, 59, 59, 999)
    );

    const invoices: InvoiceFullJoin[] = await prisma.invoice.findMany({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            invoiceProducts: true,
        },
    });

    return invoices;
};

const getInvoices = async (
    date?: Date,
    status?: invoiceStatus,
    limit: number = 20
): Promise<InvoiceFullJoin[]> => {
    const startOfDay = date && new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = date && new Date(date.setHours(23, 59, 59, 999));
    const invoices: InvoiceFullJoin[] = await prisma.invoice.findMany({
        where: {
            status: status,
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        take: limit,
        include: {
            invoiceProducts: true,
        },
    });

    return invoices;
};

const getInvoice = async (invoiceID: string): Promise<InvoiceFullJoin[]> => {
    const invoice: InvoiceFullJoin[] = await prisma.invoice.findMany({
        where: {
            invoiceID: invoiceID,
        },
        include: {
            invoiceProducts: true,
        },
    });

    return invoice;
};

const getRevenueByDay = async (date: Date): Promise<number> => {
    const invoices: InvoiceFullJoin[] = await getInvoicesBetweenDate(date);
    const revenue: number = invoices.reduce<number>((prev, curr) => {
        curr.invoiceProducts.map((product) => {
            prev =
                prev +
                product.quantity *
                    (1 - (product.discount || 0)) *
                    product.price;
        });
        return prev;
    }, 0);

    return revenue;
};

const getInvoiceStatisticOfEachDayInMonth = async (
    month: number = new Date().getMonth()
): Promise<InvoiceStatistic[]> => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), month, 1);

    const statistic: InvoiceStatistic[] = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('day', i."createdAt") as "date",
            CAST(COUNT(i."invoiceID") AS INTEGER) as "order",
            SUM(p."price"*p."quantity"*(1-p."discount"/100)) as "revenue"
        FROM
            "Invoice" i
        JOIN
            "InvoiceProduct" p
        ON
            i."invoiceID" = p."invoiceID"
        WHERE
            DATE_TRUNC('month', i."createdAt") = ${format(
                firstDayOfMonth,
                "yyyy-MM-dd"
            )}::timestamp
            AND i."status" = 'DONE'
        GROUP BY
            "date"
        ORDER BY
            "date" ASC
    `;

    return statistic;
};

const insertOrder = async (
    validOrder: OrderRequest,
    user: UserDTO,
    validProductsInOrder: ProductWithSpecificItem[]
): Promise<Invoice> => {
    const invoice = await prisma.invoice.create({
        data: {
            ...validOrder,
            status: invoiceStatus.NEW,
            payment: paymentMethod.NONE,
            userID: user.userID,
            userName: user.userName,
            invoiceProducts: {
                createMany: {data: validProductsInOrder},
            },
        },
    });

    return invoice;
};

const getProductsInOrderToInsert = (
    validProductsInOrder: OrderProductRequest[],
    items: ItemDictionary
): ProductWithSpecificItem[] => {
    return validProductsInOrder.reduce<ProductWithSpecificItem[]>(
        (prev, curr) => {
            const item = items[curr.itemID];

            if (item) {
                prev.push({
                    ...item,
                });
            }
            return prev;
        },
        []
    );
};

export default {
    getNumberOfInvoicesByDay,
    getRevenueByDay,
    getInvoices,
    insertOrder,
    getProductsInOrderToInsert,
    getInvoice,
    getNumberOfInvoices,
    getInvoiceStatisticOfEachDayInMonth,
};
