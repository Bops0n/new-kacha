import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { poolQuery } from '../../../lib/db'; // Your database utility
import { UserSchema } from '@/types';
import { updateUserProfile } from '@/app/api/services/userServices';
import { authenticateRequest } from '@/app/api/auth/utils';

const requireAdmin = (auth) => {
    if (!auth.authenticated) {
        return auth.response;
    }
    if (auth.accessLevel !== '9') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};

export async function PATCH(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can update user data.
    // For example, only an admin or the user themselves can update their profile.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    const auth = await authenticateRequest();
    const adminCheck = requireAdmin(auth);
    if (adminCheck) return adminCheck;

    let updatedUserData: Partial<UserSchema>; // Use Partial<User> to allow only some fields
    try {
        updatedUserData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    // --- Validate Input ---
    // Ensure User_ID is provided for the update operation
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