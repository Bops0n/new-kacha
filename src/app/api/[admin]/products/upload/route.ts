import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { checkRequire } from '@/app/utils/client';
import { checkStockMgrRequire } from '../../../auth/utils';
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

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}${path.extname(file.name)}`;

        if (process.env.APP_ENV === 'local') {
            const uploadDir = path.join(process.cwd(), 'public', `${process.env.UPLOAD_PATH}`, 'products');
            await mkdir(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);
        } else {
            const uploadPath = process.env.UPLOAD_PATH;
            if (uploadPath) {
                const filePath = path.join(uploadPath, 'products', filename);
                await writeFile(filePath, buffer);
            } else {
                return NextResponse.json({ message: 'ไม่สามารถอัปโหลดไฟล์ได้!' }, { status: 500 });
            }
        }

        const imageUrl = `${process.env.APP_ENV !== 'local' ? process.env.CDN_URL : process.env.UPLOAD_PATH}/products/${filename}`;

        return NextResponse.json({ 
            message: 'File uploaded successfully.', 
            imageUrl: imageUrl 
        }, { status: 201 });

    } catch (error) {
        logger.error('File upload error:', { error: error });
        return NextResponse.json({ message: "Server Error during file upload." }, { status: 500 });
    }
}