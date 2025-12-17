import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export async function uploadImage(folder: string, filename: string, buffer: Buffer<ArrayBuffer>): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
        const uploadDir = path.join(process.cwd(), 'public', `${process.env.UPLOAD_PATH}`, folder);
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        return true;
    } else {
        const uploadPath = process.env.UPLOAD_PATH;
        if (uploadPath) {
            const filePath = path.join(uploadPath, folder, filename);
            await writeFile(filePath, buffer);

            return true;
        }
    }
    return false;
}