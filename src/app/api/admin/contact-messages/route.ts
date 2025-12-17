import { poolQuery } from "../../lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const filter = searchParams.get("filter") ?? "all";

  const { rows } = await poolQuery(`SELECT * FROM public."SP_ADMIN_CONTACT_GET"($1, $2, $3)`, [page, limit, filter]);

  return Response.json(rows);
}
