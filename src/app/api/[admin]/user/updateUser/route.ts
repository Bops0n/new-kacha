import { NextRequest, NextResponse } from 'next/server';
import { UserAccount } from '@/types';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { hmacMd5Hex } from '@/server/cryptor';
import { updateUser } from '@/app/api/services/admin/userMgrService';
import { logger } from '@/server/logger';

export async function PATCH(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    let updatedUserData: Partial<UserAccount>;
    try {
        updatedUserData = await req.json();
    } catch (error) {
        logger.error("Invalid JSON in request body:", { error: error });
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

        const result = await updateUser(updatedUserData.User_ID, updatedUserData, Number(auth.userId));

        if (!result)
        {
            return NextResponse.json(
                { message: `User with ID ${userIdToUpdate} updated failed.` },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { message: `User ID ${userIdToUpdate} updated successfully.`, status: 200 }
        );

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Error update user failed", { error: error });
        return NextResponse.json(
            { message: message },
            { status: 500 }
        );
    }
}