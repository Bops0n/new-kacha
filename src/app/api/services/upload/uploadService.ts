import path from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { logger } from '@/server/logger';

export async function uploadImage(folder: string, filename: string, buffer: Buffer<ArrayBuffer>, oldFile?: string | null): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
        const uploadDir = path.join(process.cwd(), 'public', `${process.env.UPLOAD_PATH}`, folder);
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        if (oldFile) {
            const oldPath = path.join(process.cwd(), "public", oldFile);
            try {
                await unlink(oldPath);
            } catch {
                logger.warn("ลบไฟล์เก่าไม่สำเร็จ (อาจไม่มีอยู่แล้ว)");
            }
        }

        return true;
    } else {
        const uploadPath = process.env.UPLOAD_PATH;
        if (uploadPath) {
            const filePath = path.join(uploadPath, folder, filename);
            await writeFile(filePath, buffer);

            if (oldFile) {
                const oldPath = path.join(uploadPath, oldFile);
                try {
                    await unlink(oldPath);
                } catch {
                    logger.warn("ลบไฟล์เก่าไม่สำเร็จ (อาจไม่มีอยู่แล้ว)");
                }
            }

            return true;
        }
    }
    return false;
}