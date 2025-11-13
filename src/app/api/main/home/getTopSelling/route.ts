import { poolQuery } from "@/app/api/lib/db";
import { logger } from "@/server/logger";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await poolQuery(`SELECT * FROM public."SP_ALL_TOP_SELLING_GET"();`);
    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error("Error fetching top selling:", { error: err });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
