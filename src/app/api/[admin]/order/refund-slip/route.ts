// app/api/admin/order/refund-slip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { checkRequire } from '@/app/utils/client';
import { checkOrderMgrRequire } from '@/app/api/auth/utils'; // <--- 1. ตรวจสอบสิทธิ์
import { logger } from '@/server/logger';
import { updateOrder } from '@/app/api/services/admin/orderMgrService'; // <--- 2. import service
import { Order } from '@/types';

export async function POST(req: NextRequest) {
    // 1. ตรวจสอบสิทธิ์ (ต้องเป็น Order Manager)
    // const auth = await checkOrderMgrRequire();
    // const isCheck = checkRequire(auth);
    // if (isCheck) return isCheck;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const orderIdStr = formData.get('orderId') as string | null;

        if (!file) {
            return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
        }
        if (!orderIdStr || isNaN(Number(orderIdStr))) {
            return NextResponse.json({ message: 'Invalid Order ID.' }, { status: 400 });
        }
        
        const orderId = Number(orderIdStr);

        // 2. ตรวจสอบไฟล์ (เหมือนเดิม)
        if (file.size > 5 * 1024 * 1024) { // 5MB Limit
            return NextResponse.json({ message: 'ขนาดไฟล์ต้องไม่เกิน 5MB' }, { status: 400 });
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            return NextResponse.json({ message: 'ไฟล์ต้องเป็นรูปภาพ (JPEG หรือ PNG)' }, { status: 400 });
        }

        // 3. อัปโหลดไฟล์ (เปลี่ยน Path ไปที่ refund_slips)
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `refund-${orderId}-${uuidv4()}${fileExtension}`;
        
        // สร้าง Path สำหรับเก็บสลิปคืนเงินโดยเฉพาะ
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'refund_slips');
        const relativePath = `/uploads/refund_slips/${uniqueFilename}`;

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, uniqueFilename), buffer);

        // 4. อัปเดตฐานข้อมูล (เรียกใช้ Service ที่มีอยู่)
        const payload: Partial<Order> = {
            Order_ID: orderId,
            Status: 'refunded',
            Return_Slip_Image_URL: relativePath // <--- บันทึก URL สลิปคืนเงิน
        };

        // auth.userId มาจาก checkOrderMgrRequire()
        await updateOrder(payload); 

        return NextResponse.json({ 
            message: 'อัปโหลดสลิปคืนเงิน และยืนยันการคืนเงินสำเร็จ', 
            imageUrl: relativePath 
        }, { status: 200 });

    } catch (error) {
        logger.error('File upload error (Refund Slip):', error);
        return NextResponse.json({ message: "Server Error during file upload." }, { status: 500 });
    }
}