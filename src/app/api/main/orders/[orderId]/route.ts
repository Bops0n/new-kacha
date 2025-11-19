import { NextResponse, NextRequest } from 'next/server';
import { authenticateRequest } from '@/app/api/auth/utils';
import { getOrderById } from '@/app/api/services/user/orderService'; // Service ที่แก้ไขแล้ว
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { checkRequire } from '@/app/utils/client';
import { uploadTransactionSlip } from '@/app/api/services/user/userServices';
import { logger } from '@/server/logger';

/**
 * GET /api/main/orders/[orderId]
 * Retrieves detailed information for a specific order for the authenticated user.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

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
        console.log(order)
        return NextResponse.json({ order, error: false });

    } catch (error: any) {
        if (error.message === 'Access denied') {
            return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' }, { status: 403 });
        }
        logger.error('Error fetching order details:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    const { orderId } = await params
    const parseId = parseInt(orderId, 10);
    if (isNaN(parseId)) {
        return NextResponse.json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' }, { status: 400 });
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
        console.log(imageUrl, parseId, Number(auth.userId))
        const result = await uploadTransactionSlip(imageUrl, parseId, Number(auth.userId));

        if (!result) {
            return NextResponse.json({ message: 'อัปโหลดสลิปล้มเหลว!' }, { status: 500 });
        }

        return NextResponse.json({ message: 'อัปโหลดสลิปสำเร็จ', imageUrl });

    } catch (error) {
        logger.error('Error uploading transfer slip:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const orderId = parseInt(params.orderId, 10); // ไม่ต้อง await params
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Invalid Order ID' }, { status: 400 });
    }

    try {
        // อ่าน body เพื่อเอาเหตุผลการยกเลิก
        const { reason } = await request.json();

        if (!reason) {
            return NextResponse.json({ message: 'กรุณาระบุเหตุผลการยกเลิก' }, { status: 400 });
        }

        const result = await cancelOrder(orderId, Number(auth.userId), reason);

        if (result.Status_Code !== 200) {
             return NextResponse.json({ message: result.Message }, { status: result.Status_Code });
        }

        return NextResponse.json({ message: 'ยกเลิกคำสั่งซื้อสำเร็จ' });

    } catch (error) {
        logger.error('API Error cancelling order:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}