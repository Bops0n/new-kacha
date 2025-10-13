// src/app/api/auth/utils.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Adjust path to your NextAuth route if different
import { authOptions } from './[...nextauth]/route';
// Adjust path to your types.ts if different
import { z } from "zod";

/**
 * Authenticates the request by checking the user's session.
 * @returns An object containing authentication status, user ID, access level, and a response if authentication fails.
 */
export async function authenticateRequest() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'การเข้าถึงถูกปฏิเสธ!', error: true }, { status: 401 }),
            userId: null,
            accessLevel: -1,
        };
    }

    const authenticatedUserId = parseInt(session.user.id as string);
    if (isNaN(authenticatedUserId)) {
        console.error('Session user ID is not a valid number:', session.user.id);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ข้อมูลบัญชีผู้ใช้ไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1,
        };
    }

    const accessLevel : number = session.user.accessLevel ?? -1;
    if (accessLevel < 0) {
        console.error('Access level not found in session:', session.user);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1,
        };
    }

    return { authenticated: true, userId: authenticatedUserId, accessLevel, response: null };
}

export async function checkSystemAdminRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.Sys_Admin) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export async function checkUserMgrRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.User_Mgr) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export async function checkStockMgrRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.Stock_Mgr) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export async function checkOrderMgrRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.Order_Mgr) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export async function checkReportRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.Report) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export async function checkDashboardRequire() {
    const { authenticated, userId, accessLevel, response } = await authenticateRequest();
    
    if (!authenticated || !userId || accessLevel < 0) {
        return {
            authenticated: false,
            response: response,
            userId: null,
            accessLevel: -1
        }
    }

    const session = await getServerSession(authOptions);

    if (!session?.user.Dashboard) {
        return { 
            authenticated: false, 
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่ถูกต้อง!', error: true }, { status: 500 }),
            userId: null,
            accessLevel: -1
        };
    }

    return { authenticated, userId, accessLevel, response };
}

export const RegisterSchema = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/),
    email: z.string().email(),
    password: z.string().min(6).max(128)
});