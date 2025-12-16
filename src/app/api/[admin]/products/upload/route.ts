import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkRequire } from '@/app/utils/client';
import { checkStockMgrRequire } from '../../../auth/utils';
import { logger } from '@/server/logger';
import { uploadImage } from '@/app/api/services/upload/uploadService';
import path from 'path';

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

        const folder = 'products';

        const isSuccess = await uploadImage(folder, filename, buffer);
        if (isSuccess) {
            const imageUrl = `${process.env.NODE_ENV !== 'development' ? process.env.CDN_URL : process.env.UPLOAD_PATH}/${folder}/${filename}`;

            return NextResponse.json({ 
                message: 'File uploaded successfully.', 
                imageUrl: imageUrl 
            }, { status: 201 });

        } else {
            return NextResponse.json({ message: 'ไม่สามารถอัปโหลดไฟล์ได้!' }, { status: 500 });
        }
    } catch (error) {
        logger.error('File upload error:', { error: error });
        return NextResponse.json({ message: "Server Error during file upload." }, { status: 500 });
    }
}