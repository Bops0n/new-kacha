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

    const listParam = req.nextUrl.searchParams.get("list");

    if (!listParam) return NextResponse.json({ error: "Required parameter missing" }, { status: 400 });

    const list = listParam.split(",").map(orderId => Number(orderId));

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_ORDER_NEXT_STEP_BULK_GET"($1);`, [list]);
    return NextResponse.json(rows);
  } catch (err) {
    logger.error("Error fetching order next step bulk:", { error: err });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
