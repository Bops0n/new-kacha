import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { checkRequire } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { logger } from "@/server/logger";
import { uploadRefundSlip } from "@/app/api/services/admin/orderMgrService";
import { v4 as uuidv4 } from 'uuid';

export async function PATCH(request: NextRequest, { params }: { params: { orderId: number } }) {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { orderId } = await params;

    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' }, { status: 400 });
    }

    try {
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
        
        const buffer = Buffer.from(await transferSlipFile.arrayBuffer());
        const filename = `refund-${orderId}-${uuidv4()}${path.extname(transferSlipFile.name)}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'refunds');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        const imageUrl = `/uploads/refunds/${filename}`;

        await fs.writeFile(filePath, buffer);

        const result = await uploadRefundSlip(imageUrl, orderId, Number(auth.userId));

        if (!result) {
            return NextResponse.json({ message: 'อัปโหลดหลักฐานล้มเหลว!' }, { status: 500 });
        }

        return NextResponse.json({ message: 'อัปโหลดหลักฐานสำเร็จ', imageUrl });

    } catch (error) {
        logger.error('Error uploading refund slip:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน' }, { status: 500 });
    }
}