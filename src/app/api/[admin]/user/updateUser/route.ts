import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../../lib/db';
import { UserAccount } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { hmacMd5Hex } from '@/app/utils/cryptor';

export async function PATCH(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    let updatedUserData: Partial<UserAccount>;
    try {
        updatedUserData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    if (!updatedUserData.User_ID) {
        return NextResponse.json(
            { message: "User_ID is required for updating a user." },
            { status: 400 }
        );
    }

    const userIdToUpdate = updatedUserData.User_ID;

    if (updatedUserData.Password) {
        updatedUserData.Password = hmacMd5Hex(updatedUserData.Password, process.env.SALT_SECRET);
    }

    try {
        delete updatedUserData.Addresses;

        const success = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_UPD"($1, $2, $3)`, 
            [updatedUserData.User_ID, JSON.stringify(updatedUserData), Number(auth.userId)]);

        if (!success)
        {
            return NextResponse.json(
                { message: `User with ID ${userIdToUpdate} updated failed.` },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { message: `User ID ${userIdToUpdate} updated successfully.`, status: 200 }
        );

    } catch (dbError: any) {
        return NextResponse.json(
            { message: dbError.message },
            { status: 500 }
        );
    }
}