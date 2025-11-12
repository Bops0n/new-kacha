import { NextRequest, NextResponse } from 'next/server';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { deleteUser } from '@/app/api/services/admin/userMgrService';
import { logger } from '@/server/logger';

export async function DELETE(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const userIdToDelete = req.nextUrl.searchParams.get('id');

    if (!userIdToDelete) {
        return NextResponse.json(
            { message: "User_ID is required as a query parameter for deleting a user (e.g., ?id=123)." },
            { status: 400 }
        );
    }

    const parsedUserId = parseInt(userIdToDelete, 10);
    if (isNaN(parsedUserId)) {
        return NextResponse.json(
            { message: "Invalid User_ID provided. Must be a number." },
            { status: 400 }
        );
    }

    try {
        const result = await deleteUser(parsedUserId, Number(auth.userId));

        if (!result) {
            return NextResponse.json(
                { message: `User with ID ${parsedUserId} not found.`, status: 404 },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { message: `User ID ${parsedUserId} deleted successfully.`, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        logger.error("Error deleting user from database:", { error: dbError });
        return NextResponse.json(
            { message: "Failed to delete user.", error: dbError.message },
            { status: 500 }
        );
    }
}
