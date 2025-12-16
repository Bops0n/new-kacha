import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { checkRequire } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { logger } from "@/server/logger";
import { uploadRefundSlip } from "@/app/api/services/admin/orderMgrService";
import { v4 as uuidv4 } from 'uuid';
import { uploadImage } from "@/app/api/services/upload/uploadService";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { orderId } = await params;
    const parseId = Number(orderId);

    if (isNaN(parseId)) {
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
        const filename = `refund-${parseId}-${uuidv4()}${path.extname(transferSlipFile.name)}`;

        const folder = 'refunds';
        
        const isSuccess = await uploadImage(folder, filename, buffer);
        if (isSuccess) {

            const imageUrl = `${process.env.NODE_ENV !== 'development' ? process.env.CDN_URL : process.env.UPLOAD_PATH}/${folder}/${filename}`;

            const result = await uploadRefundSlip(imageUrl, parseId, Number(auth.userId));

            if (result) {

                return NextResponse.json({ 
                    message: 'File uploaded successfully.', 
                }, { status: 201 });

            } else {
                return NextResponse.json({ message: 'บันทึกลงฐานข้อมูลไม่สำเร็จ!' }, { status: 500 });
            }

        } else {
            return NextResponse.json({ message: 'ไม่สามารถอัปโหลดไฟล์ได้!' }, { status: 500 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error('Error uploading refund slip:', { error: error });
        return NextResponse.json({ message: message }, { status: 500 });
    }
}