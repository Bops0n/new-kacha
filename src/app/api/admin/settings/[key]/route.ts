import { NextRequest } from "next/server";
import { checkRequire } from "@/app/utils/client";
import { getSettingTyped, updateSetting } from "@/app/api/services/website/settingService";
import { checkSystemAdminRequire } from "@/app/api/auth/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;
    const value = await getSettingTyped(key);
    return Response.json({ key, value });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { key } = await params;
    const { value, type, group } = await req.json();
    await updateSetting(key, value, type, group, Number(auth.userId));
    return Response.json({ status: "success" });
}
