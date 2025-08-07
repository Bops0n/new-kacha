import { NextResponse, NextRequest } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';
import { authenticateRequest } from '@/app/api/auth/utils';
import { getOrderById } from '@/app/api/services/orderService'; // << 1. Import service
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * GET /api/main/orders/[orderId]
 * Retrieves detailed information for a specific order.
 * Authorization: Regular users can only view their own orders.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) {
        return auth.response || NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    
    const orderId = parseInt(await params.orderId, 10);
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    try {
        // 2. เรียกใช้ฟังก์ชันจาก Service โดยส่ง userId ไปด้วยเพื่อตรวจสอบสิทธิ์
        const order = await getOrderById(orderId, auth.userId);

        if (!order) {
            // Service จะ return null ถ้าไม่เจอ order เลย
            return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
        }
        console.log(order)

        return NextResponse.json({ order, error: false }, { status: 200 });

    } catch (error: any) {
        // Service จะ throw error ถ้าเจอ order แต่ user ไม่ใช่เจ้าของ
        if (error.message === 'Access denied') {
            return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' }, { status: 403 });
        }
        console.error('Error fetching order details:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/main/orders/[orderId]
 * Updates the transfer slip image URL for a specific order.
 */
export async function PATCH(
    request: NextRequest, 
    { params }: { params: { orderId: string } }
) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) {
        return auth.response || NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const userId = auth.userId;

    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Order ID ไม่ถูกต้อง' }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const transferSlipFile = formData.get('transferSlip') as File | null;

        if (!transferSlipFile) {
            return NextResponse.json({ message: 'ไม่พบไฟล์สลิป' }, { status: 400 });
        }

        // --- Logic การตรวจสอบไฟล์และบันทึก (เหมือนเดิม) ---
        const orderResult = await poolQuery(
            `SELECT "User_ID", "Status", "Transfer_Slip_Image_URL" FROM "Order" WHERE "Order_ID" = $1`,
            [orderId]
        );
        if (orderResult.rowCount === 0) return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
        const order = orderResult.rows[0];
        if (order.User_ID !== userId) return NextResponse.json({ message: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้' }, { status: 403 });
        if (order.Status !== 'pending') return NextResponse.json({ message: 'ไม่สามารถอัปโหลดสลิปได้' }, { status: 400 });

        const buffer = await transferSlipFile.arrayBuffer();
        const bytes = Buffer.from(buffer);
        const filename = `slip-${orderId}-${uuidv4()}${path.extname(transferSlipFile.name)}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        const imageUrl = `/uploads/slips/${filename}`;

        await fs.writeFile(filePath, bytes);
        await poolQuery(`UPDATE "Order" SET "Transfer_Slip_Image_URL" = $1 WHERE "Order_ID" = $2`, [imageUrl, orderId]);
        
        if (order.Transfer_Slip_Image_URL) {
            const oldFilePath = path.join(process.cwd(), 'public', order.Transfer_Slip_Image_URL);
            await fs.rm(oldFilePath, { force: true });
        }

        return NextResponse.json({ message: 'อัปโหลดสลิปสำเร็จ', imageUrl, error: false }, { status: 200 });

    } catch (error) {
        console.error('Error uploading transfer slip:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' }, { status: 500 });
    }
}