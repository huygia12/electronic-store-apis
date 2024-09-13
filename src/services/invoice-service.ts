import prisma from "@/common/prisma-client";
import {InvoiceFullJoin} from "@/common/types";
import {invoiceStatus} from "@prisma/client";

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

export default {getNumberOfInvoicesByDay, getRevenueByDay, getInvoices};
