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
        const { rows } = await poolQuery('SELECT * FROM public."SP_ADMIN_REPORT_SUMMARY_SALES_REPORT_GET"($1, $2)', [startDate, endDate]);
        console.log(rows);
        return NextResponse.json({ orders: rows });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Report API Error:", { error: error });
        return NextResponse.json({ message: message }, { status: 500 });
    }
}