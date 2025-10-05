import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // For session handling (optional)
import { UserSchema } from '@/types'; // Assuming you have a 'User' type defined
import { poolQuery } from '../../../lib/db'; // Assuming your poolQuery works correctly
import { authenticateRequest } from '@/app/api/auth/utils';

const requireAdmin = (auth) => {
    if (!auth.authenticated) {
        return auth.response;
    }
    if (auth.accessLevel !== '1') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};

export async function GET(req: NextRequest) {
    // --- Optional: Session Check (Uncomment if you need authentication) ---
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     // If no session, return unauthorized status
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    const auth = await authenticateRequest();
    const adminCheck = requireAdmin(auth);
    if (adminCheck) return adminCheck;
    
    // --- Database Query ---
    let usersFromDb: UserSchema[] = []; // Initialize an empty array to hold user data
    // No parameters are expected, so the SQL is straightforward
    try {
        const result = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_GET"()`);
        // node-postgres (which poolQuery likely uses) returns results in .rows
        usersFromDb = result.rows; 
    } catch (dbError: any) { // Catch any database errors
        console.error("Error fetching users from database:", dbError);
        // Return a 500 Internal Server Error response if something goes wrong
        return NextResponse.json(
            { message: "Failed to fetch users from database", error: dbError.message },
            { status: 500 }
        );
    }

    // --- JSON Response ---
    // Return the fetched user data
    return NextResponse.json({
        message: "All users fetched successfully",
        status: 200,
        users: usersFromDb 
    });
}