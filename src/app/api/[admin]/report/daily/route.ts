import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';
import { checkReportRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { logger } from '@/server/logger';

export async function GET(request: NextRequest) {
    const auth = await checkReportRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { searchParams } = new URL(request.url);
    
    // รับค่า startDate และ endDate
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ message: 'Start Date and End Date are required' }, { status: 400 });
    }

    try {
        const queryString = `
            SELECT 
                O."Order_ID",
                O."Order_Date",
                COALESCE(U."Full_Name", 'ลูกค้าทั่วไป') as "Customer_Name",
                O."Total_Amount",
                O."Payment_Type",
                O."Status",
                (SELECT COUNT(*) FROM public."Order_Detail" OD WHERE OD."Order_ID" = O."Order_ID") as "Item_Count",
                OP."Transaction_Slip",
                OP."Is_Payment_Checked",
                OP."Status" AS "Transaction_Status"
            FROM public."Order" O
            LEFT JOIN public."User" U ON O."User_ID" = U."User_ID"
            LEFT JOIN public."Order_Payment" OP ON O."Order_ID" = OP."Order_ID"
            WHERE DATE(O."Order_Date") BETWEEN $1 AND $2  -- กรองตามช่วงเวลา
            ORDER BY O."Order_ID" ASC
        `;

        const { rows } = await poolQuery(queryString, [startDate, endDate]);

        return NextResponse.json({ orders: rows });

    } catch (error: any) {
        logger.error("Report API Error:", { error });
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}