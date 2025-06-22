import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // Updated path
import { pool, poolQuery } from '../../../lib/db'; // Updated path

// Define the Address interface based on the provided schema
interface Address {
    Address_ID: number;
    User_ID: number;
    Address_1: string;
    Address_2: string | null; // Can be null
    Sub_District: string;
    District: string;
    Province: string;
    Zip_Code: string;
    Is_Default: boolean | null; // Has a default, but can explicitly be null if allowed
    Phone: string | null; // Can be null
    // Add other address-related columns here if any, as per your database schema
}

// POST API route to add a new address
export async function POST(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can add address data.
    // For example, only authenticated users can add addresses.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    let newAddressData: Omit<Address, 'Address_ID'>; // Omit Address_ID as it's auto-generated
    try {
        newAddressData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    // --- Validate Required Input Fields ---
    const requiredFields = ['User_ID', 'Address_1', 'Sub_District', 'District', 'Province', 'Zip_Code'];
    for (const field of requiredFields) {
        if (!newAddressData[field as keyof typeof newAddressData]) {
            return NextResponse.json(
                { message: `${field} is required to add a new address.` },
                { status: 400 }
            );
        }
    }

    // Set default values if not provided in the request
    const isDefault = newAddressData.Is_Default ?? false; // Default to false if not provided
    const address2 = newAddressData.Address_2 ?? null; // Default to null if not provided
    const phone = newAddressData.Phone ?? null; // Default to null if not provided


    // --- Start a database transaction for atomicity ---
    const client = await pool.connect(); // Get a client directly from the pool
    try {
        await client.query('BEGIN'); // Start transaction

        // If the new address is marked as default, unset all other default addresses for this user
        if (isDefault === true) {
            await client.query(
                `UPDATE public."Address" SET "Is_Default" = FALSE WHERE "User_ID" = $1`,
                [newAddressData.User_ID]
            );
            console.log(`Existing default addresses for User_ID ${newAddressData.User_ID} were unset.`);
        }

        // --- Construct INSERT SQL query ---
        const sql = `
            INSERT INTO public."Address" (
                "User_ID",
                "Address_1",
                "Address_2",
                "Sub_District",
                "District",
                "Province",
                "Zip_Code",
                "Is_Default",
                "Phone"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
            RETURNING "Address_ID"; -- Return the ID of the newly inserted address
        `;

        const queryParams = [
            newAddressData.User_ID,
            newAddressData.Address_1,
            address2, // Use the potentially defaulted value
            newAddressData.Sub_District,
            newAddressData.District,
            newAddressData.Province,
            newAddressData.Zip_Code,
            isDefault, // Use the potentially defaulted value
            phone // Use the potentially defaulted value
        ];

        const result = await client.query(sql, queryParams);
        const newAddressId = result.rows[0].Address_ID; // Get the auto-generated ID

        await client.query('COMMIT'); // Commit transaction if all operations are successful

        console.log(`New address added with ID: ${newAddressId}`);
        return NextResponse.json(
            { message: "Address added successfully.", Address_ID: newAddressId, status: 201 },
            { status: 201 } // 201 Created status
        );

    } catch (dbError: any) {
        await client.query('ROLLBACK'); // Rollback transaction on any error
        console.error("Error adding new address to database:", dbError);
        // Handle specific errors, e.g., foreign key violations
        if (dbError.code === '23503') { // PostgreSQL foreign_key_violation
            return NextResponse.json(
                { message: "Failed to add address: User_ID does not exist.", error: dbError.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { message: "Failed to add address.", error: dbError.message },
            { status: 500 }
        );
    } finally {
        client.release(); // Release the client back to the pool
    }
}

// DELETE API route to delete an existing address by Address_ID
export async function DELETE(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can delete address data.
    // Ensure only the owner of the address or an admin can delete it.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    // --- Get Address_ID from query parameters ---
    const addressIdToDelete = req.nextUrl.searchParams.get('id');

    // --- Validate Input ---
    if (!addressIdToDelete) {
        return NextResponse.json(
            { message: "Address_ID is required as a query parameter for deleting an address (e.g., ?id=123)." },
            { status: 400 }
        );
    }

    const parsedAddressId = parseInt(addressIdToDelete, 10);
    if (isNaN(parsedAddressId)) {
        return NextResponse.json(
            { message: "Invalid Address_ID provided. Must be a number." },
            { status: 400 }
        );
    }

    // --- Construct DELETE SQL query ---
    const sql = `
        DELETE FROM public."Address"
        WHERE "Address_ID" = $1;
    `;

    try {
        const result = await poolQuery(sql, [parsedAddressId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: `Address with ID ${parsedAddressId} not found.`, status: 404 },
                { status: 404 }
            );
        }

        console.log(`Address ID ${parsedAddressId} deleted successfully.`);
        return NextResponse.json(
            { message: `Address ID ${parsedAddressId} deleted successfully.`, status: 200 },
            { status: 200 } // 200 OK or 204 No Content for successful deletion
        );

    } catch (dbError: any) {
        console.error("Error deleting address from database:", dbError);
        return NextResponse.json(
            { message: "Failed to delete address.", error: dbError.message },
            { status: 500 }
        );
    }
}
