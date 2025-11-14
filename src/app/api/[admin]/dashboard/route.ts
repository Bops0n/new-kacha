import { NextResponse } from "next/server";
import { poolQuery } from "../../lib/db";
import { logger } from "@/server/logger";
import { checkRequire } from "@/app/utils/client";
import { checkDashboardRequire } from "../../auth/utils";

export async function GET() {
  try {
    const auth = await checkDashboardRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_SUMMARY_GET"();`);

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any) {
    logger.error("Error fetching dashboard summary:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}