import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // Adjust path based on your project structure
import { poolQuery } from '../../../lib/db'; // Your database utility
import { authenticateRequest } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

// DELETE API route to delete an existing user by User_ID
export async function DELETE(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can delete users.
    // This is crucial for security. For example, only an admin or the user themselves
    // should be able to delete a user account.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    // --- Get User_ID from query parameters ---
    // Example: /api/user?id=123
    const userIdToDelete = req.nextUrl.searchParams.get('id');

    // --- Validate Input ---
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
        const result = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_DEL"($1, $2)`, [parsedUserId, auth.userId]);

        if (result.rowCount === 0) {
            // No user found with the given ID
            return NextResponse.json(
                { message: `User with ID ${parsedUserId} not found.`, status: 404 },
                { status: 404 }
            );
        }

        console.log(`User ID ${parsedUserId} deleted successfully.`);
        // Return 200 OK or 204 No Content for successful deletion
        return NextResponse.json(
            { message: `User ID ${parsedUserId} deleted successfully.`, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        console.error("Error deleting user from database:", dbError);
        return NextResponse.json(
            { message: "Failed to delete user.", error: dbError.message },
            { status: 500 }
        );
    }
}
