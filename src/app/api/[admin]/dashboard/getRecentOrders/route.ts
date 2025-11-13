import { checkDashboardRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { RecentOrder } from "@/types/dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await checkDashboardRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_RECENT_ORDERS_GET"();`);

    const Orders = rows.map((row: RecentOrder) => ({
      Order_ID: row.Order_ID,
      Customer_Name: row.Customer_Name,
      Order_Date: row.Order_Date,
      Total_Amount: Number(row.Total_Amount),
      Status: row.Status,
    }));

    return NextResponse.json({ Orders });
  } catch (error: any) {
    logger.error("Error fetching recent orders:", { error: error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
