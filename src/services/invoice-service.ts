import prisma from "@/common/prisma-client";
import {OrderProductRequest, OrderRequest} from "@/common/schemas";
import {
    InvoiceFullJoin,
    ItemDictionary,
    ProductWithSpecificItem,
    UserDTO,
} from "@/common/types";
import {Invoice, invoiceStatus, paymentMethod} from "@prisma/client";

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

const getRevenueInMonth = async (month: number): Promise<number> => {
    const now = new Date();
    const invoices: InvoiceFullJoin[] = await getInvoicesBetweenDate(
        new Date(now.getFullYear(), month - 1, 1),
        now
    );

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
};
