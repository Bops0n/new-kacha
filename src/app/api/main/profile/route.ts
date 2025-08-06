import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../auth/utils'; // Path to your authentication utility
import { poolQuery } from '../lib/db'; // Path to your database utility
import { UserSchema } from '../../../types/types'; // Path to your UserSchema type

/**
 * GET /api/user/profile
 * Retrieves the authenticated user's profile information.
 * Only allows the authenticated user to view their own profile.
 */
export async function GET(req: NextRequest) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response; // Returns 401 Unauthorized or 500 if user ID is invalid
    }
    const userId = auth.userId as number; // User_ID of the authenticated user
    console.log('getprofile')
    try {
        const result = await poolQuery(
            `SELECT
                "User_ID",
                "Username",
                "Full_Name",
                "Email",
                "Phone",
                "Access_Level"
            FROM
                public."User"
            WHERE
                "User_ID" = $1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: 'ไม่พบข้อมูลผู้ใช้', error: true },
                { status: 404 }
            );
        }

        const userProfile: UserSchema = result.rows[0];
        return NextResponse.json({ user: userProfile, error: false }, { status: 200 });

    } catch (dbError: any) {
        console.error('Error fetching user profile:', dbError);
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะดึงข้อมูลผู้ใช้', error: true },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/user/profile
 * Updates the authenticated user's profile information.
 * Only allows the authenticated user to update their own profile.
 * Prevents updates to sensitive fields like User_ID, Username, Password, Access_Level, Token.
 */
export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response; // Returns 401 Unauthorized or 500
    }
    const userId = auth.userId as number; // User_ID of the authenticated user

    let updatedFields: Partial<UserSchema>;
    try {
        updatedFields = await req.json();
    } catch (error) {
        console.error('Invalid JSON in request body:', error);
        return NextResponse.json(
            { message: 'Invalid request body. Expected JSON.', error: true },
            { status: 400 }
        );
    }

    const updateColumns: string[] = [];
    const queryParams: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    // Fields that are allowed to be updated by the user via this endpoint
    const editableFields: Array<keyof UserSchema> = ['Full_Name', 'Email', 'Phone'];

    for (const field of editableFields) {
        // Check if the field exists in the request body and is not undefined
        if (Object.prototype.hasOwnProperty.call(updatedFields, field) && updatedFields[field] !== undefined) {
            let dbColumnName: string = field; // Assume direct mapping for now

            // Special handling for specific column name mappings if necessary (e.g., Full_Name -> FullName if DB uses that)
            // Based on your schema, it seems 'Full_Name' in TS maps to "Full_Name" in DB.
            // No explicit renaming needed here if TS matches DB.
            if (field === 'Full_Name') dbColumnName = 'Full_Name'; // Example: ensure exact DB column name
            else if (field === 'Email') dbColumnName = 'Email';
            else if (field === 'Phone') dbColumnName = 'Phone';

            let valueToSet: any = updatedFields[field];
            // Convert empty strings to null for nullable database columns
            if (typeof valueToSet === 'string' && valueToSet.trim() === '') {
                valueToSet = null;
            }

            updateColumns.push(`"${dbColumnName}" = $${paramIndex}`);
            queryParams.push(valueToSet);
            paramIndex++;
        }
    }

    if (updateColumns.length === 0) {
        return NextResponse.json(
            { message: 'ไม่มีข้อมูลสำหรับอัปเดต', error: true },
            { status: 400 }
        );
    }

    // Add userId to queryParams for the WHERE clause
    queryParams.push(userId); // This will be the last parameter

    const sql = `
        UPDATE public."User"
        SET
            ${updateColumns.join(', ')}
        WHERE
            "User_ID" = $${paramIndex};
    `;

    try {
        const result = await poolQuery(sql, queryParams);

        if (result.rowCount === 0) {
            // This might happen if user ID is valid but no row was updated (e.g., user doesn't exist, or no changes)
            // But since auth ensures user exists, it's more likely no fields were changed.
            return NextResponse.json(
                { message: 'ไม่พบผู้ใช้หรือไม่มีการเปลี่ยนแปลงข้อมูล', error: true },
                { status: 404 }
            );
        }

        console.log(`User ID ${userId} profile updated successfully.`);
        return NextResponse.json(
            { message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ', error: false },
            { status: 200 }
        );

    } catch (dbError: any) {
        console.error('Error updating user profile:', dbError);
        // Handle specific errors like unique constraint violation (e.g., duplicate Email)
        if (dbError.code === '23505') { // PostgreSQL unique_violation error code
            return NextResponse.json(
                { message: 'อัปเดตล้มเหลว: อีเมลอาจมีผู้ใช้งานแล้ว', error: true },
                { status: 409 } // Conflict
            );
        }
        return NextResponse.json(
            { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะอัปเดตข้อมูลผู้ใช้', error: true },
            { status: 500 }
        );
    }
}