// src/app/api/auth/utils.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Adjust path to your NextAuth route if different
import { authOptions } from './[...nextauth]/route';
// Adjust path to your types.ts if different
import { AccessLevel } from '../../../types';

/**
 * Authenticates the request by checking the user's session.
 * @returns An object containing authentication status, user ID, access level, and a response if authentication fails.
 */
export async function authenticateRequest() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 }),
            userId: null,
            accessLevel: null as AccessLevel | null,
        };
    }

    const authenticatedUserId = parseInt(session.user.id as string);
    if (isNaN(authenticatedUserId)) {
        console.error('Session user ID is not a valid number:', session.user.id);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'User ID จาก session ไม่ถูกต้อง', error: true }, { status: 500 }),
            userId: null,
            accessLevel: null as AccessLevel | null,
        };
    }

    const accessLevel = (session.user as any).accessLevel as AccessLevel; // Cast to AccessLevel type
    if (!accessLevel) {
        console.error('Access level not found in session:', session.user);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่สมบูรณ์', error: true }, { status: 500 }),
            userId: null,
            accessLevel: null,
        };
    }

    return { authenticated: true, userId: authenticatedUserId, accessLevel, response: null };
}