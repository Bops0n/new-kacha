import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/server/logger";
import { poolQuery } from "@/app/api/lib/db";
import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { checkRequire } from "@/app/utils/client";

export async function PATCH(req: NextRequest) {
    try {
        const auth = await checkOrderMgrRequire();
        const isCheck = checkRequire(auth);
        if (isCheck) return isCheck;

        const body = await req.json();

        Object.keys(body).forEach(k => {
            if (body[k] === "") body[k] = null;
        });

        const { rowCount } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_SHIPPING_UPD"($1, $2, $3)`, [
            body.Order_ID, JSON.stringify(body), auth.userId
        ]);

        if (rowCount && rowCount > 0) {
            return NextResponse.json({ message: 'Shipping Update Success.' });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Shipping Update Error:", { error: error });
        return NextResponse.json(
            { message: message || "Server Error" },
            { status: 500 }
        );
    }
}
