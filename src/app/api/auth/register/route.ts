import { NextRequest, NextResponse } from "next/server";
import { RegisterSchema } from "../utils";
import { signUp } from "../../services/auth/authService";

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

    const result = await signUp(username, email, password);
    
    if (!result) throw new Error("No response from authentication function");

    return NextResponse.json(
        { status: result.Status_Code, message: `${result.Message}` },
        { status: result.Status_Code }
    );
}