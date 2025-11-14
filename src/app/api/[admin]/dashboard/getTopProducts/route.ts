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

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_TOP_PRODUCTS_GET"();`);

    return NextResponse.json({ Products: rows });
  } catch (error: any) {
    logger.error("Error fetching top products:", { error: error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
