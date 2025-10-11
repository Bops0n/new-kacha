import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../../lib/db';
import { UserAccount } from '@/types';
import { authenticateRequest } from '@/app/api/auth/utils';
import { requireAdmin } from '@/app/utils/client';

export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;
    
    let updatedUserData: Partial<UserSchema>;
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