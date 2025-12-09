import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db'; // เรียกใช้ตัวเชื่อมต่อ Database ของเรา
import { logger } from '@/server/logger';     // เรียกใช้ Logger

// บังคับให้ Route นี้เป็น Dynamic เสมอ (ไม่แคชผลลัพธ์) เพื่อให้ตรวจสอบเวลาปัจจุบันได้ถูกต้อง
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // 1. (Optional) Security Check: ตรวจสอบว่าเป็น Vercel Cron หรือผู้มีสิทธิ์เรียก
    // ถ้ามีการตั้งค่า CRON_SECRET ใน .env ให้เปิดใช้งานส่วนนี้ครับ
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // กำหนดเวลาตัดรอบ (เช่น ต้องโอนภายใน 24 ชั่วโมง)
        const HOURS_LIMIT = 24;

        // 2. เรียก SQL Function เพื่อทำการยกเลิกออเดอร์ที่หมดอายุ
        const { rows } = await poolQuery(
            `SELECT * FROM public."SP_SYSTEM_AUTO_CANCEL_EXPIRED_ORDERS"($1)`,
            [HOURS_LIMIT]
        );

        const cancelledCount = rows[0]?.Cancelled_Count || 0;

        // Log ผลการทำงาน
        if (cancelledCount > 0) {
            logger.info(`[Auto-Cancel] Successfully cancelled ${cancelledCount} expired orders.`);
        } else {
            logger.info(`[Auto-Cancel] No expired orders found.`);
        }

        return NextResponse.json({
            success: true,
            message: `Auto-cancel execution completed. Cancelled: ${cancelledCount} orders.`,
            timestamp: new Date().toISOString(),
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error('[Auto-Cancel] Error:', { error });
        return NextResponse.json(
            { success: false, message: 'Failed to execute auto-cancel task', error: message },
            { status: 500 }
        );
    }
}