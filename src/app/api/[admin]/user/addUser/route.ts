import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // Adjust path based on your project structure
import { poolQuery } from '../../../lib/db'; // Your database utility from 'pool-query-function' Canvas

// Define the User interface based on the provided schema
interface User {
    User_ID: number;
    Username: string;
    Password: string; // This should be a hashed password
    Full_Name: string;
    Email: string;
    Phone: string | null;
    Access_Level: string | null; // Defaults to '0' in DB, but can be provided
    Token: string | null;
}

// POST API route to add a new user
export async function POST(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can add new user data.
    // For example, only an admin or an authorized system can create new users.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    let newUserData: Omit<User, 'User_ID' | 'Token'>; // Omit User_ID (auto-generated) and Token (managed internally)
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

    // Set default values for optional fields if not provided
    const phone = newUserData.Phone ?? null;
    // Access_Level defaults to '0' in the DB schema, so we only send it if explicitly provided
    const accessLevel = newUserData.Access_Level ?? null; 
    // Token is usually generated and managed internally, not provided on creation.
    // It's omitted from `newUserData` type and not inserted directly here.

    // --- Construct INSERT SQL query ---
    const sql = `
        INSERT INTO public."User" (
            "Username",
            "Password",
            "Full_Name",
            "Email",
            "Phone",
            "Access_Level"
        ) VALUES (
            $1, $2, $3, $4, $5, $6
        )
        RETURNING "User_ID"; -- Return the ID of the newly inserted user
    `;

    const queryParams = [
        newUserData.Username,
        newUserData.Password, // Remember to hash this in a real app!
        newUserData.Full_Name,
        newUserData.Email,
        phone,
        accessLevel // Will be null if not provided, allowing DB default '0' to apply
    ];

    try {
        const result = await poolQuery(sql, queryParams);
        const newUserId = result.rows[0].User_ID; // Get the auto-generated ID

        console.log(`New user added with ID: ${newUserId}`);
        return NextResponse.json(
            { message: "User added successfully.", User_ID: newUserId, status: 201 },
            { status: 201 } // 201 Created status
        );

    } catch (dbError: any) {
        console.error("Error adding new user to database:", dbError);
        // Handle specific errors, e.g., unique constraint violation for Username or Email
        if (dbError.code === '23505') { // PostgreSQL unique_violation error code
            let errorMessage = "Failed to add user: A user with this ";
            if (dbError.detail.includes('Username')) {
                errorMessage += "username already exists.";
            } else if (dbError.detail.includes('Email')) {
                errorMessage += "email already exists.";
            } else {
                errorMessage += "unique constraint violation occurred.";
            }
            return NextResponse.json(
                { message: errorMessage, error: dbError.message },
                { status: 409 } // 409 Conflict
            );
        }
        return NextResponse.json(
            { message: "Failed to add user.", error: dbError.message },
            { status: 500 }
        );
    }
}
