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

        const { Order_ID, Reason } = await req.json();

        if (!Reason) {
            return NextResponse.json({ message: 'กรุณาระบุเหตุผลในการยกเลิกคำสั่งซื้อ' }, { status: 400 });
        }

        const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_REQ_CANCEL_UPD"($1, $2, $3)`, [
            Order_ID, Reason, auth.userId
        ]);

        const result = rows[0];

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Cancel Order Error:", { error: error });
        return NextResponse.json(
            { message: message || "Server Error" },
            { status: 500 }
        );
    }
}