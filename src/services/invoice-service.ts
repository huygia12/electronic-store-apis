import prisma from "@/common/prisma-client";
import {
    OrderProductRequest,
    OrderRequest,
    OrderUpdateRequest,
} from "@/common/schemas";
import {
    InvoiceFullJoin,
    InvoiceStatistic,
    ItemDictionary,
    ProductWithSpecificItem,
    UserDTO,
} from "@/common/types";
import {Invoice, invoiceStatus, paymentMethod} from "@prisma/client";
import {format} from "date-fns";

const invoiceSizeLimit = 10;

const getNumberOfInvoicesDoneByDay = async (
    date: Date = new Date()
): Promise<number> => {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const invoices: number = await prisma.invoice.count({
        where: {
            doneAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: invoiceStatus.DONE,
        },
    });

    return invoices;
};

const getNumberOfInvoices = async (params: {
    status?: invoiceStatus;
    fromCreatedDate?: Date;
    toCreatedDate?: Date;
    fromDoneDate?: Date;
    toDoneDate?: Date;
    userID?: string;
    invoiceID?: string;
    userName?: string;
}): Promise<number> => {
    const createdFromDay =
        params.fromCreatedDate &&
        new Date(params.fromCreatedDate.setHours(0, 0, 0, 0));
    const createdToDay =
        params.toCreatedDate &&
        new Date(params.toCreatedDate.setHours(23, 59, 59, 999));

    const doneFromDay =
        params.fromDoneDate &&
        new Date(params.fromDoneDate.setHours(0, 0, 0, 0));
    const doneToDay =
        params.toDoneDate &&
        new Date(params.toDoneDate.setHours(23, 59, 59, 999));

    const amountOfInvoice: number = await prisma.invoice.count({
        where: {
            userID: params.userID,
            status: params.status,
            invoiceID: params.invoiceID,
            createdAt: {
                gte: createdFromDay,
                lte: createdToDay,
            },
            doneAt: {
                gte: doneFromDay,
                lte: doneToDay,
            },
            userName: {
                contains: params.userName,
                mode: "insensitive",
            },
        },
    });

    return amountOfInvoice;
};

const getInvoicesDoneBetweenDate = async (
    from: Date,
    to?: Date
): Promise<InvoiceFullJoin[]> => {
    const startOfDay = new Date(from.setHours(0, 0, 0, 0));
    const endOfDay = new Date(
        to ? to.setHours(23, 59, 59, 999) : from.setHours(23, 59, 59, 999)
    );

    const invoices: InvoiceFullJoin[] = await prisma.invoice.findMany({
        where: {
            doneAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: invoiceStatus.DONE,
        },
        include: {
            invoiceProducts: true,
        },
    });

    return invoices;
};

const getInvoices = async (params: {
    date?: Date;
    status?: invoiceStatus;
    userName?: string;
    userID?: string;
    invoiceID?: string;
    currentPage: number;
}): Promise<InvoiceFullJoin[]> => {
    const beginOfDay =
        params.date && new Date(params.date.setHours(0, 0, 0, 0));
    const endOfDay =
        params.date && new Date(params.date.setHours(23, 59, 59, 999));

    const invoices: InvoiceFullJoin[] = await prisma.invoice.findMany({
        where: {
            userID: params.userID,
            userName: {
                contains: params.userName,
                mode: "insensitive",
            },
            invoiceID: params.invoiceID,
            status: params.status,
            createdAt: {
                gte: beginOfDay,
                lte: endOfDay,
            },
        },
        include: {
            invoiceProducts: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        skip: (params.currentPage - 1) * invoiceSizeLimit,
        take: invoiceSizeLimit,
    });

    return invoices;
};

const getInvoice = async (
    invoiceID: string
): Promise<InvoiceFullJoin | null> => {
    const invoice = await prisma.invoice.findFirst({
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
    const invoices: InvoiceFullJoin[] = await getInvoicesDoneBetweenDate(date);
    const revenue: number = invoices.reduce<number>((prev, curr) => {
        curr.invoiceProducts.map((product) => {
            prev =
                prev +
                product.quantity *
                    (1 - (product.discount || 0) / 100) *
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
            DATE_TRUNC('day', i."doneAt" AT TIME ZONE 'Asia/Ho_Chi_Minh') as "date",
            CAST(COUNT(i."invoiceID") AS INTEGER) as "order",
            SUM(p."price"*p."quantity"*(1-p."discount"/100)) as "revenue"
        FROM
            "Invoice" i
        JOIN
            "InvoiceProduct" p
        ON
            i."invoiceID" = p."invoiceID"
        WHERE
            DATE_TRUNC('month', i."doneAt" AT TIME ZONE 'Asia/Ho_Chi_Minh') = ${format(
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

const updateInvoice = async (
    invoiceID: string,
    validPayload: OrderUpdateRequest
): Promise<InvoiceFullJoin> => {
    const invoice = await prisma.invoice.update({
        where: {
            invoiceID: invoiceID,
        },
        data: {
            status: validPayload.status
                ? (validPayload.status as invoiceStatus)
                : undefined,
            paymentID: validPayload.paymentID,
            payment: validPayload.payment
                ? (validPayload.payment as paymentMethod)
                : undefined,
            doneAt:
                validPayload.status === invoiceStatus.DONE ||
                validPayload.status === invoiceStatus.ABORT
                    ? new Date()
                    : undefined,
        },
        include: {
            invoiceProducts: true,
        },
    });

    return invoice;
};

const getProductsOutOfInvoice = (
    invoice: InvoiceFullJoin
): OrderProductRequest[] => {
    return invoice.invoiceProducts.map((product) => {
        return {
            itemID: product.itemID,
            productID: product.productID,
            quantity: product.quantity,
        };
    });
};

const checkIfOrderTurnIntoInvoice = (
    prevStatus: invoiceStatus,
    newStatus: invoiceStatus
): boolean => {
    return (
        [`${invoiceStatus.PAYMENT_WAITING}`, `${invoiceStatus.NEW}`].includes(
            prevStatus
        ) &&
        [`${invoiceStatus.SHIPPING}`, `${invoiceStatus.DONE}`].includes(
            newStatus
        )
    );
};

export default {
    getProductsOutOfInvoice,
    getNumberOfInvoicesDoneByDay,
    getRevenueByDay,
    getInvoices,
    insertOrder,
    getProductsInOrderToInsert,
    getInvoice,
    getNumberOfInvoices,
    getInvoiceStatisticOfEachDayInMonth,
    updateInvoice,
    checkIfOrderTurnIntoInvoice,
};
