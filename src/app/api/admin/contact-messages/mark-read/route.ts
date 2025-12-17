import { poolQuery } from "@/app/api/lib/db";

export async function POST(req: Request) {
  const { messageId, isRead } = await req.json();

  await poolQuery(`SELECT public."SP_ADMIN_CONTACT_UPD"($1, $2)`, [messageId, isRead]);

  return Response.json({ success: true });
}