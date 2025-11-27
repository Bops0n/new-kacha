import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/server/logger";
import { poolQuery } from "@/app/api/lib/db";
import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { checkRequire } from "@/app/utils/client";

export async function POST(req: NextRequest) {
    try {
        const auth = await checkOrderMgrRequire();
        const isCheck = checkRequire(auth);
        if (isCheck) return isCheck;

        const { orderId, action, isReqCancel } = await req.json();

        if (!orderId || !action) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["confirmed", "rejected"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action input" },
                { status: 400 }
            );
        }

        const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_PAYMENT_VERIFY_UPD"($1, $2, $3, $4)`, [orderId, action, isReqCancel, auth.userId]);

        const result = rows[0];

        return NextResponse.json({
            success: result.Is_Success,
            message: result.Message,
        });

    } catch (error: any) {
        logger.error("Payment Verify Error:", error);
        return NextResponse.json(
            { error: error.message || "Server Error" },
            { status: 500 }
        );
    }
}
