import isValidDate from "@/common/helper";
import {InvoiceFullJoin} from "@/common/types";
import invoiceService from "@/services/invoice-service";
import {invoiceStatus} from "@prisma/client";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

const getInvoices = async (req: Request, res: Response) => {
    const statusParam = req.query.status as string;
    const dateParam = req.query.date as string;
    const limit = parseInt(req.query.limit as string, 10) || undefined;
    let status;
    let date;

    if (isValidDate(dateParam)) {
        date = new Date(dateParam);
    }

    Array(invoiceStatus).map((iter) => {
        if (`${iter}`.toUpperCase() === statusParam) {
            status = iter;
        }
    });

    console.debug(`[invoice controller]: getInvoices: ${limit}`);
    const invoices: InvoiceFullJoin[] = await invoiceService.getInvoices(
        date,
        status,
        limit
    );

    console.debug(`[invoice controller]: getInvoices: succeed `);
    res.status(StatusCodes.OK).json({
        info: invoices,
    });
};

export default {getInvoices};
