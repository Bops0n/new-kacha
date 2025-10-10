import { NextRequest, NextResponse } from "next/server";
import { pool, poolQuery } from "../../lib/db";
import { RegisterSchema } from "../utils";
import { hmacMd5Hex } from "@/app/utils/cryptor";

export async function POST(req: NextRequest) {
    const json = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
        let path = "ไม่ระบุ";

        const issue = parsed.error.issues[0];
        console.log(issue);
        switch (`${issue.path}`) {
            case 'email': path = "อีเมล"; break;
            case 'username': path = "ชื่อผู้ใช้"; break;
            case 'password': path = "รหัสผ่าน"; break;
        }

        let message = "ข้อผิดพลาดที่ไม่ระบุ";
        switch (issue.code) {
            case "invalid_format": message = "รูปแบบไม่ถูกต้อง กรุณากรอกให้ถูกต้องตามที่ระบบกำหนด"; break;
            case "too_big": message = `ต้องมีอักขระน้อยกว่า ${(Number(issue.maximum) + 1)} ตัว`; break;
            case "too_small": message = `ต้องมีอักขระมากกว่า ${issue.minimum} ตัว`; break;
        }
        
        return NextResponse.json(
            { status: 400, message: `${path} : ${message}` },
            { status: 400 }
        );
    }

    const { username, email, password } : any = parsed.data;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await poolQuery(`SELECT * FROM "SP_AUTH_REGISTER"($1, $2, $3)`, [
            username, email, hmacMd5Hex(password, process.env.SALT_SECRET)
        ]);

        await client.query('COMMIT');

        const row = rows[0];
        if (!row) throw new Error("No response from authentication function");

        return NextResponse.json(
            { status: row.Status_Code, message: `${row.Message}` },
            { status: row.Status_Code }
        );
    } catch (dbError: any) {
        await client.query('ROLLBACK');
        console.error("Register error:", dbError);
        return NextResponse.json(
            { status: 500, message: dbError.message || "Internal Server Error" },
            { status: 500 }
        )
    } finally {
        client.release();
    }
}