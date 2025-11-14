import { poolQuery } from "@/app/api/lib/db";
import { logger } from "@/server/logger";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_DASHBOARD_LOW_STOCK_PRODUCTS_GET"();`);
    return NextResponse.json(rows);
  } catch (err) {
    logger.error("Error fetching low stock products:", { error: err });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
