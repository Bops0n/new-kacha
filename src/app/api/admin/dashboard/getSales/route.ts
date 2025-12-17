import { checkDashboardRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { SalesData } from "@/types/dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "weekly";

    const auth = await checkDashboardRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_SALES_GET"($1);`, [mode]);

    const Data = rows.map((r: SalesData) => ({
      Label: r.Label,
      Total_Sales: Number(r.TotalSales),
      Average: Number(r.AvgSales),
      Deviation: Number(r.DeviationPercent),
    }));

    return NextResponse.json({ Data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    logger.error("Error fetching sales data:", { error: error });
    return NextResponse.json({ message: message }, { status: 500 });
  }
}
