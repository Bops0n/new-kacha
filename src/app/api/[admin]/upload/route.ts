import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { checkRequire } from '@/app/utils/client';
import { checkStockMgrRequire } from '../../auth/utils';
import { logger } from '@/server/logger';

export async function POST(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
        }

        // 2. เตรียมข้อมูลสำหรับการบันทึกไฟล์
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        
        // 3. กำหนด Path ที่จะบันทึกไฟล์
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        const relativePath = `/uploads/products/${uniqueFilename}`;

        // 4. ตรวจสอบและสร้าง Directory หากยังไม่มี
        await mkdir(uploadDir, { recursive: true });

        // 5. เขียนไฟล์ลงบน Server
        await writeFile(path.join(uploadDir, uniqueFilename), buffer);

        // 6. ส่ง URL ของไฟล์ที่เข้าถึงได้แบบ Public กลับไป
        return NextResponse.json({ 
            message: 'File uploaded successfully.', 
            imageUrl: relativePath 
        }, { status: 201 });

    } catch (error) {
        logger.error('File upload error:', error);
        return NextResponse.json({ message: "Server Error during file upload." }, { status: 500 });
    }
}