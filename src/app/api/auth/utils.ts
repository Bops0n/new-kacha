import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from "zod";
import { logger } from '@/server/logger';
import { AUTH_CHECK } from '@/types/auth.types';
import { authOptions } from './[...nextauth]/options';

/**
 * Authenticates the request by checking the user's session.
 * @returns An object containing authentication status, user ID, access level, and a response if authentication fails.
 */
export async function authenticateRequest(): Promise<AUTH_CHECK> {
  const session = await getServerSession(authOptions);
  const errorResponse = (message: string, status: number) =>
    NextResponse.json({ message, error: true }, { status });

  // Invalid session
  if (!session?.user?.id) {
    logger.error("Session is invalid.", { session });
    return {
      authenticated: false,
      response: errorResponse("การเข้าถึงถูกปฏิเสธ!", 401),
      userId: null,
      accessLevel: -1,
      session: null,
    };
  }

  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    logger.error("User ID is not a valid number.", { userId: session.user.id });
    return {
      authenticated: false,
      response: errorResponse("ข้อมูลบัญชีผู้ใช้ไม่ถูกต้อง!", 500),
      userId: null,
      accessLevel: -1,
      session: null,
    };
  }

  const accessLevel = Number(session.user.accessLevel ?? -1);
  if (accessLevel < 0) {
    logger.error("Access level not found in session.");
    return {
      authenticated: false,
      response: errorResponse("ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!", 500),
      userId: null,
      accessLevel: -1,
      session: null,
    };
  }

  // Success
  return {
    authenticated: true,
    response: null,
    userId,
    accessLevel,
    session,
  };
}

export async function checkRoleRequire(
  roleKey: keyof typeof roleMap
): Promise<AUTH_CHECK> {
  const auth = await authenticateRequest();

  if (!auth.authenticated || !auth.session) {
    return {
      authenticated: false,
      response: auth.response,
      userId: null,
      accessLevel: -1,
      session: null,
    };
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
      session: null,
    };
  }

  return {
    authenticated: true,
    response: null,
    userId: auth.userId,
    accessLevel: auth.accessLevel,
    session: auth.session,
  };
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