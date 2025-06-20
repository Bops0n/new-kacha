import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { poolQuery } from '../../../lib/db'; // Your database utility
import { User } from '@/types'; // Assuming you have a 'User' type defined

export async function PATCH(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can update user data.
    // For example, only an admin or the user themselves can update their profile.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    let updatedUserData: Partial<User>; // Use Partial<User> to allow only some fields
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

    // --- Dynamically build the SET clause for the UPDATE query ---
    const updateColumns: string[] = [];
    const queryParams: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    // Exclude sensitive fields that shouldn't be updated directly via this API or User_ID
    const excludedFields = ['User_ID', 'Password', 'Token']; // Password and Token often have their own update endpoints

    for (const key in updatedUserData) {
        if (Object.prototype.hasOwnProperty.call(updatedUserData, key) &&
            updatedUserData[key as keyof Partial<User>] !== undefined &&
            !excludedFields.includes(key)) { // Check if key is not excluded and value is not undefined
            
            // Handle specific column names as they appear in the database (PascalCase)

            let dbColumnName = key;
            // A simple example for converting camelCase to PascalCase for DB columns
            // You might need a more robust mapping if your object keys don't match DB exactly
            if (key === 'Username') dbColumnName = 'Username';
            else if (key === 'FullName') dbColumnName = 'Full_Name'; // Example: if your object has FullName
            else if (key === 'Email') dbColumnName = 'Email';
            else if (key === 'Phone') dbColumnName = 'Phone';
            else if (key === 'AccessLevel') dbColumnName = 'Access_Level'; // Example: if your object has AccessLevel
            else if (key === 'Addresses') continue
            // Add more mappings if needed. For exact matches, it's just `dbColumnName = key;`

            // A more generic way to match properties to DB schema names, assuming your type `User` maps correctly.
            // For simple PascalCase, you can often just use `key` if your `updatedUserData` keys match DB column names
            // For this example, I'll assume your incoming JSON keys match the DB schema exactly (e.g., "Full_Name").
            
            // Example for mapping if your JS object keys are different from DB:
            // const dbColumnMap: { [key: string]: string } = {
            //     username: "Username",
            //     fullName: "Full_Name",
            //     email: "Email",
            //     phone: "Phone",
            //     accessLevel: "Access_Level",
            // };
            // let dbColumnName = dbColumnMap[key as keyof typeof dbColumnMap] || key; // Default to key if not mapped

            updateColumns.push(`"${dbColumnName}" = $${paramIndex}`);
            queryParams.push(updatedUserData[key as keyof Partial<User>]);
            paramIndex++;
        }
    }

    if (updateColumns.length === 0) {
        return NextResponse.json(
            { message: "No valid fields provided for update." },
            { status: 400 }
        );
    }

    // Add User_ID to the parameters for the WHERE clause
    queryParams.push(userIdToUpdate); // This will be $paramIndex for the WHERE clause

    const sql = `
        UPDATE public."User"
        SET
            ${updateColumns.join(', ')}
        WHERE
            "User_ID" = $${paramIndex};
    `;

    try {
        console.log(sql,)
        const result = await poolQuery(sql, queryParams);
        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: `User with ID ${userIdToUpdate} not found.` },
                { status: 404 }
            );
        }

        console.log(`User ID ${userIdToUpdate} updated successfully.`);
        return NextResponse.json(
            { message: `User ID ${userIdToUpdate} updated successfully.`, status: 200 }
        );

    } catch (dbError: any) {
        console.error("Error updating user in database:", dbError);
        // Handle specific errors like unique constraint violation (e.g., duplicate Username/Email)
        if (dbError.code === '23505') { // PostgreSQL unique_violation error code
            return NextResponse.json(
                { message: "Update failed: Username or Email already exists.", error: dbError.message },
                { status: 409 } // Conflict
            );
        }
        return NextResponse.json(
            { message: "Failed to update user.", error: dbError.message },
            { status: 500 }
        );
    }
}