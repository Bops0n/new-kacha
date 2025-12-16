import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { logger } from "@/server/logger";
import { uploadImage } from "@/app/api/services/upload/uploadService";

const MAX_FILE_SIZE = 1024 * 1024 * 3; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isSafeImageSignature(buffer: Buffer) {
  const jpg = buffer.slice(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]));
  const png = buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
  const webp = buffer.slice(8, 12).equals(Buffer.from("WEBP"));

  return jpg || png || webp;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const oldFile = form.get("oldFile") as string | null;

    if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        message: `ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / (1024 * 1024)} MB)`
      }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        message: "อนุญาตเฉพาะไฟล์ JPEG, PNG, WEBP เท่านั้น"
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!isSafeImageSignature(buffer)) {
      return NextResponse.json({
        message: "ไฟล์รูปไม่ถูกต้อง หรืออาจเป็นไฟล์อันตราย"
      }, { status: 400 });
    }

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

    const folder = 'settings';
    
    const isSuccess = await uploadImage(folder, filename, buffer, oldFile);
    if (isSuccess) {
        const imageUrl = `${process.env.NODE_ENV !== 'development' ? process.env.CDN_URL : process.env.UPLOAD_PATH}/${folder}/${filename}`;

        return NextResponse.json({ 
            message: 'File uploaded successfully.', 
            url: imageUrl
        }, { status: 201 });

    } else {
        return NextResponse.json({ message: 'ไม่สามารถอัปโหลดไฟล์ได้!' }, { status: 500 });
    }

  } catch (err) {
    logger.error("UPLOAD ERROR:", { error: err });
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
