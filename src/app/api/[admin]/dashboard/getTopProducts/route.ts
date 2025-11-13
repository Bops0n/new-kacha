import { checkDashboardRequire } from "@/app/api/auth/utils";
import { poolQuery } from "@/app/api/lib/db";
import { checkRequire } from "@/app/utils/client";
import { logger } from "@/server/logger";
import { TopProduct } from "@/types/dashboard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await checkDashboardRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_TOP_PRODUCTS_GET"();`);

    const Products = rows.map((row: TopProduct) => ({
      Product_ID: row.Product_ID,
      Product_Name: row.Product_Name,
      Total_Sold: Number(row.Total_Sold),
      Revenue: Number(row.Revenue),
    }));

    return NextResponse.json({ Products });
  } catch (error: any) {
    logger.error("Error fetching top products:", { error: error });
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
