import invoiceService from "@/services/invoice-service";
import productService from "@/services/product-service";
import userService from "@/services/user-service";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const getStatistic = async (req: Request, res: Response) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const nummberOfUsers: number = await userService.getNumberOfUsers({});
    const numberOfProducts: number = await productService.getNumberOfProducts(
        {}
    );

    const todayInvoices: number = await invoiceService.getNumberOfInvoicesByDay(
        today
    );
    const yesterdayInvoices: number =
        await invoiceService.getNumberOfInvoicesByDay(yesterday);

    const todayRevenue: number = await invoiceService.getRevenueByDay(today);
    const yesterdayRevenue: number = await invoiceService.getRevenueByDay(
        yesterday
    );

    console.debug(`[statistic controller]: getStatistic: succeed `);
    res.status(StatusCodes.OK).json({
        info: {
            users: nummberOfUsers,
            products: numberOfProducts,
            invoices: {
                today: todayInvoices,
                yesterday: yesterdayInvoices,
            },
            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
            },
        },
    });
};

export default {getStatistic};
