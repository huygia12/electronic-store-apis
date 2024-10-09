import {InvoiceFullJoin, UserResponseDTO} from "@/common/types";
import invoiceService from "@/services/invoice-service";
import productService from "@/services/product-service";
import userService from "@/services/user-service";
import {invoiceStatus} from "@prisma/client";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const getStatistic = async (req: Request, res: Response) => {
    const today = new Date();
    const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1
    );

    const nummberOfUsers: number = await userService.getNumberOfUsers({});
    const numberOfProducts: number = await productService.getNumberOfProducts(
        {}
    );

    const numberOfInvoicesToday: number =
        await invoiceService.getNumberOfInvoicesByDay(today);
    const numberOfInvoicesYesterday: number =
        await invoiceService.getNumberOfInvoicesByDay(yesterday);

    const todayRevenue: number = await invoiceService.getRevenueByDay(today);
    const yesterdayRevenue: number = await invoiceService.getRevenueByDay(
        yesterday
    );

    const invoiceStatistic =
        await invoiceService.getInvoiceStatisticOfEachDayInMonth();

    const newUsers: UserResponseDTO[] = await userService.getUserResponseDTOs({
        date: new Date(),
        currentPage: 1,
    });

    const orders: InvoiceFullJoin[] = await invoiceService.getInvoices(
        new Date(),
        invoiceStatus.NEW,
        5
    );

    console.debug(`[statistic controller]: getStatistic: succeed `);
    res.status(StatusCodes.OK).json({
        info: {
            totalUsers: nummberOfUsers,
            totalProducts: numberOfProducts,
            invoices: {
                today: numberOfInvoicesToday,
                yesterday: numberOfInvoicesYesterday,
            },
            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
            },
            newUsers: newUsers,
            orders: orders,
            invoiceStatistic: invoiceStatistic,
        },
    });
};

export default {getStatistic};
