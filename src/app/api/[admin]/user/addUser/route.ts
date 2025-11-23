import { NextRequest, NextResponse } from 'next/server';
import { UserAccount } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { addUser } from '@/app/api/services/admin/userMgrService';
import { hmacMd5Hex } from '@/server/cryptor';
import { logger } from '@/server/logger';

export async function POST(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    let newUserData: Omit<UserAccount, 'User_ID'>;
    try {
        newUserData = await req.json();
    } catch (error) {
        logger.error("Invalid JSON in request body:", { error: error });
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

    if (newUserData.Password) {
        newUserData.Password = hmacMd5Hex(newUserData.Password, process.env.SALT_SECRET);
    }

    try {
        const { Result } = await addUser(newUserData, Number(auth.userId));

        return NextResponse.json(
            { message: "User added successfully.", User_ID: Result, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        logger.error("User add failed", { error: dbError });
        return NextResponse.json(
            { message: dbError.message },
            { status: 500 }
        );
    }
}
