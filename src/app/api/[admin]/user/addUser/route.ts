import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../../lib/db'; // Your database utility from 'pool-query-function' Canvas
import { UserAccount } from '@/types';
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

// POST API route to add a new user
export async function POST(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can add new user data.
    // For example, only an admin or an authorized system can create new users.
    const auth = await authenticateRequest();
    const adminCheck = requireAdmin(auth);
    if (adminCheck) return adminCheck;

    let newUserData: Omit<UserAccount, 'User_ID' | 'Token'>; // Omit User_ID (auto-generated) and Token (managed internally)
    try {
        newUserData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    // --- Validate Required Input Fields ---
    // Password should ideally be hashed on the backend before insertion.
    // For simplicity here, we assume it's sent as plain text or already hashed.
    // In a real application, you would hash it here (e.g., using bcrypt).
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
        const result = await poolQuery(`SELECT * FROM "SP_ADMIN_USER_INS"($1, $2)`, [JSON.stringify(newUserData), auth.userId]);
        const UserID = result.rows[0].Result;

        return NextResponse.json(
            { message: "User added successfully.", User_ID: UserID, status: 200 },
            { status: 200 } // 201 Created status
        );

    } catch (dbError: any) {
        return NextResponse.json(
            { message: dbError.message },
            { status: 500 }
        );
    }
}
