import { checkDashboardRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await checkDashboardRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_RECENT_ORDERS_GET"();`);

    return NextResponse.json({ Orders: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    logger.error("Error fetching recent orders:", { error: error });
    return NextResponse.json({ message: message }, { status: 500 });
  }
}
