import { NextResponse } from 'next/server';
import { UserSchema } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { getUsers } from '@/app/api/services/admin/userMgrService';
import { logger } from '@/server/logger';

export async function GET() {
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
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Error fetching users from database:", { error: error });
        return NextResponse.json(
            { message: "Failed to fetch users from database", error: message },
            { status: 500 }
        );
    }
}