import { checkOrderMgrRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const auth = await checkOrderMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const orderId = req.nextUrl.searchParams.get("orderId");
    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_REQ_CANCEL_STEP_GET"($1);`, [orderId]);
    return NextResponse.json(rows);
  } catch (err) {
    logger.error("Error fetching order cancel step:", { error: err });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
