import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]/route';
import { z } from "zod";
import { logger } from '@/server/logger';

/**
 * Authenticates the request by checking the user's session.
 * @returns An object containing authentication status, user ID, access level, and a response if authentication fails.
 */
export async function authenticateRequest() {
  const session = await getServerSession(authOptions);
  const errorResponse = (message: string, status: number) =>
    NextResponse.json({ message, error: true }, { status });

  if (!session?.user?.id) {
    logger.error("Session is invalid.", { session });
    return { ok: false, response: errorResponse("การเข้าถึงถูกปฏิเสธ!", 401) };
  }

  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    logger.error("User ID is not a valid number.", { userId: session.user.id });
    return { ok: false, response: errorResponse("ข้อมูลบัญชีผู้ใช้ไม่ถูกต้อง!", 500) };
  }

  const accessLevel = Number(session.user.accessLevel ?? -1);
  if (accessLevel < 0) {
    logger.error("Access level not found in session.", { session: session.user });
    return { ok: false, response: errorResponse("ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!", 500) };
  }

  return { ok: true, userId, accessLevel, session };
}

export async function checkRoleRequire(roleKey: keyof typeof roleMap) {
    const auth = await authenticateRequest();
    if (!auth.ok || !auth.session) {
        return { authenticated: false, response: auth.response, userId: null, accessLevel: -1 };
    }

    const roleValue = auth.session.user?.[roleKey];
    logger.debug(`UID: ${auth.userId} Role Value (${roleKey}) = ${roleValue}`);
    if (!roleValue) {
        return {
            authenticated: false,
            response: NextResponse.json(
                { message: "ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!", error: true },
                { status: 403 }
            ),
            userId: null,
            accessLevel: -1,
        };
    }

    return { authenticated: true, userId: auth.userId, accessLevel: auth.accessLevel, response: null };
}

export const roleMap = {
    Sys_Admin: "checkSystemAdminRequire",
    User_Mgr: "checkUserMgrRequire",
    Stock_Mgr: "checkStockMgrRequire",
    Order_Mgr: "checkOrderMgrRequire",
    Report: "checkReportRequire",
    Dashboard: "checkDashboardRequire",
};

export const checkSystemAdminRequire = () => checkRoleRequire("Sys_Admin");
export const checkUserMgrRequire = () => checkRoleRequire("User_Mgr");
export const checkStockMgrRequire = () => checkRoleRequire("Stock_Mgr");
export const checkOrderMgrRequire = () => checkRoleRequire("Order_Mgr");
export const checkReportRequire = () => checkRoleRequire("Report");
export const checkDashboardRequire = () => checkRoleRequire("Dashboard");

export const RegisterSchema = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/),
    email: z.string().email(),
    password: z.string().min(6).max(128)
});