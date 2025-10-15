import { NextRequest, NextResponse } from 'next/server';
import { UserSchema } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { getUsers } from '@/app/api/services/admin/userMgrService';

export async function GET(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    let usersFromDb: UserSchema[] = [];
    try {
        const users = await getUsers();
        usersFromDb = users; 
    } catch (dbError: any) {
        console.error("Error fetching users from database:", dbError);
        return NextResponse.json(
            { message: "Failed to fetch users from database", error: dbError.message },
            { status: 500 }
        );
    }
    return NextResponse.json({
        message: "All users fetched successfully",
        status: 200,
        users: usersFromDb 
    });
}