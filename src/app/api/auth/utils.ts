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

    const accessLevel = session.user.accessLevel ?? -1;
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

export const RegisterSchema = z.object({
    username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_\.]+$/),
    email: z.string().email(),
    password: z.string().min(6).max(128)
});