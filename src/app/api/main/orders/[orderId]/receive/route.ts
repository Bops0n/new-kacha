import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { confirmReceiveOrder } from '@/app/api/services/user/orderService';
import { logger } from '@/server/logger';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    // 1. ตรวจสอบตัวตน
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { orderId } = await params; // Next.js 15 ต้อง await params
    const parseId = parseInt(orderId, 10);

    if (isNaN(parseId)) {
        return NextResponse.json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' }, { status: 400 });
    }

    try {
        // 2. เรียก Service ยืนยันรับของ
        const { Status_Code, Message } = await confirmReceiveOrder(parseId, Number(auth.userId));

        return NextResponse.json({ message: Message }, { status: Status_Code });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error('API Error confirm receive:', { error: error });
        return NextResponse.json({ message: message }, { status: 500 });
    }
}