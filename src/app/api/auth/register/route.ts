import { NextRequest, NextResponse } from "next/server";
import { signUp } from "../../services/auth/authService";
import { REGISTER_PARSE_DATA } from "@/types/auth.types";
import { RegisterSchema } from "@/app/utils/validate";

export async function POST(req: NextRequest) {
    const json = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
        let path = "ไม่ระบุ";

        const issue = parsed.error.issues[0];
        switch (`${issue.path}`) {
            case 'email': path = "อีเมล"; break;
            case 'username': path = "ชื่อผู้ใช้"; break;
            case 'password': path = "รหัสผ่าน"; break;
        }

        let message = "ข้อผิดพลาดที่ไม่ระบุ";
        switch (issue.code) {
            case "invalid_format": message = "รูปแบบไม่ถูกต้อง กรุณากรอกให้ถูกต้องตามที่ระบบกำหนด"; break;
            case "too_big": message = `จำนวนอักขระมีมากกว่า ${issue.maximum} ตัว`; break;
            case "too_small": message = `จำนวนอักขระมีน้อยกว่า ${issue.minimum} ตัว`; break;
        }
        
        return NextResponse.json(
            { status: 400, message: `${path} : ${message}` },
            { status: 400 }
        );
    }

    const { username, email, password } : REGISTER_PARSE_DATA = parsed.data;

    const result = await signUp(username, email, password);
    
    if (!result) throw new Error("No response from authentication function");

    return NextResponse.json(
        { status: result.Status_Code, message: `${result.Message}` },
        { status: result.Status_Code }
    );
}