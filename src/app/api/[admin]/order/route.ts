import { NextRequest, NextResponse } from 'next/server';
import { checkOrderMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { getOrders } from '../../services/admin/orderMgrService';
import { logger } from '@/server/logger';

/**
 * GET: ดึงข้อมูลคำสั่งซื้อทั้งหมด (สำหรับ Admin)
 * สามารถกรองด้วย ID ผ่าน query parameter ได้ (e.g., ?id=123)
 */
export async function GET(req: NextRequest) {
    // const auth = await checkOrderMgrRequire();
    // const isCheck = checkRequire(auth);
    // if (isCheck) return isCheck;

    
    try {
        const orderId = req.nextUrl.searchParams.get('id');
        const orders = await getOrders(orderId ? Number(orderId) : null);
        // console.log()
        return NextResponse.json({ orders });
    } catch (error: any) {
        logger.error("API GET Error:", { error: error });
        return NextResponse.json({ message: error.message || "Failed to fetch orders" }, { status: 500 });
    }
}