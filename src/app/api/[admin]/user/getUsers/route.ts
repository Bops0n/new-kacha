import { NextRequest, NextResponse } from 'next/server';
import { UserSchema } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { getUsers } from '@/app/api/services/admin/userMgrService';
import { logger } from '@/server/logger';

export async function GET(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const users: UserSchema[] = await getUsers();
        return NextResponse.json({
            message: "All users fetched successfully",
            status: 200,
            users: users 
        });
    } catch (dbError: any) {
        logger.error("Error fetching users from database:", { error: dbError });
        return NextResponse.json(
            { message: "Failed to fetch users from database", error: dbError.message },
            { status: 500 }
        );
    }
}