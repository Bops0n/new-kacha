import { NextResponse, NextRequest } from 'next/server';
import { authenticateRequest } from '@/app/api/auth/utils';
import { getOrderById } from '@/app/api/services/orderService'; // Service ที่แก้ไขแล้ว
import { poolQuery } from '@/app/api/lib/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * GET /api/main/orders/[orderId]
 * Retrieves detailed information for a specific order for the authenticated user.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) {
        return auth.response || NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { orderId } = await params;
    
    const parseId = parseInt(orderId, 10);
    if (isNaN(parseId)) {
        return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    try {
        // เรียกใช้ Service ที่อัปเดตแล้ว
        const order = await getOrderById(parseId);

        if (!order) {
            return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ' }, { status: 404 });
        }

        return NextResponse.json({ order, error: false });

    } catch (error: any) {
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
        return auth.response!;
    }
    const userId = auth.userId;
    const orderId = parseInt(await params.orderId, 10);
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Order ID ไม่ถูกต้อง' }, { status: 400 });
    }

    try {
        // ... (Upload logic remains the same, it correctly targets 'Transfer_Slip_Image_URL')
        const formData = await request.formData();
        const transferSlipFile = formData.get('transferSlip') as File | null;

        if (!transferSlipFile) {
            return NextResponse.json({ message: 'ไม่พบไฟล์สลิป' }, { status: 400 });
        }
        if (transferSlipFile.size > 5 * 1024 * 1024) {
            return NextResponse.json({ message: 'ขนาดไฟล์เกิน 5 MB' }, { status: 400 });
        }
        if (!['image/jpeg', 'image/png'].includes(transferSlipFile.type)) {
            return NextResponse.json({ message: 'ไฟล์ไม่ใช่รูปภาพ' }, { status: 400 });
        }
        
        // Logic to save file and update DB URL
        // This part is confirmed to use the correct column name "Transfer_Slip_Image_URL"
        const buffer = Buffer.from(await transferSlipFile.arrayBuffer());
        const filename = `slip-${orderId}-${uuidv4()}${path.extname(transferSlipFile.name)}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        const imageUrl = `/uploads/slips/${filename}`;

        await fs.writeFile(filePath, buffer);
        await poolQuery(`UPDATE "Order" SET "Transfer_Slip_Image_URL" = $1 WHERE "Order_ID" = $2 AND "User_ID" = $3`, [imageUrl, orderId, userId]);

        return NextResponse.json({ message: 'อัปโหลดสลิปสำเร็จ', imageUrl });

    } catch (error) {
        console.error('Error uploading transfer slip:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' }, { status: 500 });
    }
}