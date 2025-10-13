import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../../lib/db';
import { UserAccount } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

export async function POST(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    let newUserData: Omit<UserAccount, 'User_ID' | 'Token'>;
    try {
        newUserData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    const requiredFields = ['Username', 'Password', 'Full_Name', 'Email'];
    for (const field of requiredFields) {
        if (!newUserData[field as keyof typeof newUserData]) {
            return NextResponse.json(
                { message: `${field} is required to add a new user.` },
                { status: 400 }
            );
        }
    }

    try {
        const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_INS"($1, $2)`, [JSON.stringify(newUserData), auth.userId]);
        const UserID = rows[0].Result;

        return NextResponse.json(
            { message: "User added successfully.", User_ID: UserID, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        return NextResponse.json(
            { message: dbError.message },
            { status: 500 }
        );
    }
}
