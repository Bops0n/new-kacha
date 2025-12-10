import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/auth/utils';
import { mapDbRowsToOrders, Order, PlaceOrderRequestBody } from '@/types';
import { checkRequire } from '@/app/utils/client';
import { addOrderTransaction, getOrderByUID } from '../../services/user/userServices';
import { logger } from '@/server/logger';

/**
 * GET /api/main/orders
 * ดึงข้อมูลคำสั่งซื้อทั้งหมดสำหรับผู้ใช้ที่ login อยู่
 */
export async function GET() {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {

        const result = await getOrderByUID(Number(auth.userId));
        const orders: Order[] = mapDbRowsToOrders(result);
        return NextResponse.json({ orders });

    } catch (error) {
        logger.error('Error fetching user orders:', { error: error });
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ', error: true }, { status: 500 });
    }
}


/**
 * POST /api/orders
 * Places a new order for the authenticated user.
 * This is a transactional operation: checks stock, creates order/details, updates sales count, and clears cart.
 * @param {Request} request - The incoming request object. Expected body: PlaceOrderRequestBody
 * @returns {NextResponse} - JSON response indicating success/failure and the new order ID.
 * Authorization: Only allows authenticated users to place orders for themselves.
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const data: PlaceOrderRequestBody = await request.json();

        if (!data) {
            return NextResponse.json({ message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วน', error: true }, { status: 400 });
        }

        if (!data.addressId || !data.paymentMethod || !data.cartItems || data.cartItems.length === 0) {
            return NextResponse.json({ message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วน', error: true }, { status: 400 });
        }

        const { Status_Code, Message, Out_Order_ID } = await addOrderTransaction(Number(auth.userId), data);

        if (Status_Code != 201) {
            return NextResponse.json({ message: Message }, { status: Status_Code });  
        }
        
        return NextResponse.json({ message: Message, orderId: Out_Order_ID }, { status: Status_Code });

    } catch (error) {
        logger.error('API Error fetching product:', { error: error });
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
    }
}