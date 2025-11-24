import { NextRequest, NextResponse } from 'next/server';
import { checkOrderMgrRequire } from '@/app/api/auth/utils';
import { Order } from '@/types';
import { checkRequire } from '@/app/utils/client';
import { deleteOrder, getOrders, updateOrder } from '../../services/admin/orderMgrService';
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
        return NextResponse.json({ message: `Order ID ${updatedOrder.Order_ID} updated successfully.`, data: updatedOrder });
    } catch (error: any) {
        logger.error("API PATCH Error:", { error: error });
        return NextResponse.json({ message: error.message || "Failed to update order" }, { status: error.message.includes('not found') ? 404 : 500 });
    }
}

/**
 * DELETE: ลบคำสั่งซื้อ
 * รับ ID ที่ต้องการลบผ่าน query parameter (e.g., ?id=123)
 */
export async function DELETE(req: NextRequest) {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const orderId = req.nextUrl.searchParams.get('id');

        if (!orderId) {
            return NextResponse.json({ message: "Order ID is required as a query parameter." }, { status: 400 });
        }

        const result = await deleteOrder(Number(orderId), Number(auth.userId));

        if (!result) {
            return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 400 });
        }

        return NextResponse.json({ message: `Order ID ${orderId} and its details deleted successfully.` });
    } catch (error: any) {
        logger.error("API DELETE Error:", { error: error });
        return NextResponse.json({ message: error.message || "Failed to delete order" }, { status: error.message.includes('not found') ? 404 : 500 });
    }
}