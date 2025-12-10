import { NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';
import { checkReportRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { logger } from '@/server/logger';

export async function GET() {
    // ตรวจสอบสิทธิ์ (Report หรือ Stock Manager ก็ได้)
    const auth = await checkReportRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        // ใช้ Stored Procedure เดิมที่มีอยู่เพื่อดึงสินค้าทั้งหมด
        const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_PRODUCT_GET"()`);
        return NextResponse.json({ products: rows });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Inventory Report API Error:", { error: error });
        return NextResponse.json({ message: message }, { status: 500 });
    }
}