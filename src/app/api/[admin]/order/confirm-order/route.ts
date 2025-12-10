import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const auth = await checkOrderMgrRequire();
        const isCheck = checkRequire(auth);
        if (isCheck) return isCheck;

        const { Order_ID } = await req.json();

        const { rowCount } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_CONFIRM_UPD"($1, $2)`, [
            Order_ID, auth.userId
        ]);

        if (rowCount !== null && rowCount > 0) {
            return NextResponse.json({ message: 'Confirm Order Success.' });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Confirm Order Error:", { error: error });
        return NextResponse.json(
            { error: message || "Server Error" },
            { status: 500 }
        );
    }
}
