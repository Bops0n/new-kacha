import { checkRequire } from "@/app/utils/client";
import { authenticateRequest } from "../../auth/utils";
import { poolQuery } from "../../lib/db";

export async function POST(req: Request) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const body = await req.json();

    await poolQuery(`SELECT public."SP_USER_CONTACT_INS"($1, $2, $3, $4, $5)`,
        [body.name, body.email, body.phone, body.subject, body.message]
    );

    return Response.json({ success: true });
}
