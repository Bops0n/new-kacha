import { NextRequest, NextResponse } from 'next/server';
import { UserSchema } from '@/types';
import { poolQuery } from '../../../lib/db';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

export async function GET(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    let usersFromDb: UserSchema[] = [];
    try {
        const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_GET"()`);
        usersFromDb = rows; 
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