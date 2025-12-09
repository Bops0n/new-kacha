import { NextRequest, NextResponse } from 'next/server';
import { checkOrderMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { getOrders, updateOrder } from '../../services/admin/orderMgrService';
import { logger } from '@/server/logger';
import { Order } from '@/types';

/**
 * GET: ดึงข้อมูลคำสั่งซื้อทั้งหมด (สำหรับ Admin)
 * สามารถกรองด้วย ID ผ่าน query parameter ได้ (e.g., ?id=123)
 */
export async function GET(req: NextRequest) {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const orderId = req.nextUrl.searchParams.get('id');
        const orders = await getOrders(orderId ? Number(orderId) : null);
        return NextResponse.json({ orders });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("API GET Error:", { error: error });
        return NextResponse.json({ message: message || "Failed to fetch orders" }, { status: 500 });
    }
}

/**
 * PATCH: อัปเดตข้อมูลคำสั่งซื้อ
 * รับข้อมูลที่ต้องการอัปเดตผ่าน body
 */
export async function PATCH(req: NextRequest) {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const payload: Partial<Order> = await req.json();
        const updatedOrder = await updateOrder(payload);
        if (updatedOrder) {
            return NextResponse.json({ message: `Order ID ${updatedOrder.Order_ID} updated successfully.`, data: updatedOrder });
        }
        return NextResponse.json({ message: "Failed to update order" }, { status: 500 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("API PATCH Error:", { error: error });
        return NextResponse.json({ message: message || "Failed to update order" }, { status: message.includes('not found') ? 404 : 500 });
    }
}