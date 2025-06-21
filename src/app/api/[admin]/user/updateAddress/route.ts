import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // For session handling (optional)
import { poolQuery, pool } from '../../../lib/db'; // Your database utility from 'pool-query-function' Canvas

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

export async function PATCH(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can update address data.
    // For example, only the owner of the address or an admin can update it.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    let updatedAddressData: Partial<Address>; // Use Partial<Address> to allow only some fields
    try {
        updatedAddressData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    // --- Validate Input ---
    // Ensure Address_ID is provided in the request body for the update operation
    if (typeof updatedAddressData.Address_ID === 'undefined' || updatedAddressData.Address_ID === null) {
        return NextResponse.json(
            { message: "Address_ID is required in the request body for updating an address." },
            { status: 400 }
        );
    }

    const addressIdToUpdate = updatedAddressData.Address_ID;

    // --- Dynamically build the SET clause for the UPDATE query ---
    const updateColumns: string[] = [];
    const queryParams: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    // Exclude fields that should not be updated directly or are part of the WHERE clause
    const excludedFields = ['Address_ID']; // Address_ID is used in WHERE, not SET

    // Flag to check if Is_Default is being set to true
    let setIsDefaultToTrue = false;
    let userIdForDefaultAddress: number | undefined; // To store User_ID if Is_Default is true

    for (const key in updatedAddressData) {
        // Ensure the property belongs to the object itself, is not undefined, and not an excluded field
        if (Object.prototype.hasOwnProperty.call(updatedAddressData, key) &&
            updatedAddressData[key as keyof Partial<Address>] !== undefined &&
            !excludedFields.includes(key)) {

            // ตรวจสอบว่ากำลังตั้งค่า Is_Default เป็น true หรือไม่
            if (key === 'Is_Default' && updatedAddressData[key as keyof Partial<Address>] === true) {
                setIsDefaultToTrue = true;
            }
            
            // Map the TypeScript property name to the exact database column name (PascalCase)
            // Assuming your JSON keys match your DB column names exactly for simplicity.
            // Use the key directly as the database column name, enclosed in double quotes for PostgreSQL
            updateColumns.push(`"${key}" = $${paramIndex}`);
            queryParams.push(updatedAddressData[key as keyof Partial<Address>]);
            paramIndex++;
        }
    }

    if (updateColumns.length === 0) {
        return NextResponse.json(
            { message: "No valid fields provided for update." },
            { status: 400 }
        );
    }

    // Start a database transaction for atomicity
    const client = await pool.connect(); // Get a client directly from the pool
    try {
        await client.query('BEGIN'); // Start transaction

        // ถ้า 'Is_Default' ถูกตั้งเป็น true, ต้องตรวจสอบและยกเลิกค่า default อื่นๆ ของ User คนนี้
        if (setIsDefaultToTrue) {
            // ขั้นแรก: ดึง User_ID ที่เกี่ยวข้องกับ Address ที่กำลังจะอัปเดต
            const userQueryResult = await client.query(
                `SELECT "User_ID" FROM public."Address" WHERE "Address_ID" = $1`,
                [addressIdToUpdate]
            );

            if (userQueryResult.rowCount === 0) {
                await client.query('ROLLBACK'); // Rollback if address not found
                return NextResponse.json(
                    { message: `Address with ID ${addressIdToUpdate} not found to determine User_ID.` },
                    { status: 404 }
                );
            }
            userIdForDefaultAddress = userQueryResult.rows[0].User_ID;

            // ขั้นที่สอง: ตั้งค่า "Is_Default" ของ Address อื่นๆ ของ User คนนี้ให้เป็น FALSE
            await client.query(
                `UPDATE public."Address" SET "Is_Default" = ${false}  WHERE "User_ID" = $1`,
                [userIdForDefaultAddress]
            );
            console.log(`Other default addresses for User_ID ${userIdForDefaultAddress} were unset.`);
        }

        // เพิ่ม Address_ID ใน parameters สำหรับ WHERE clause ของ main update
        // (ค่านี้จะเป็น parameter ตัวสุดท้ายที่ถูกเพิ่ม)
        queryParams.push(addressIdToUpdate); // This will be the last parameter in the array for WHERE

        // Main update query for the specific address
        const sql = `
            UPDATE public."Address"
            SET
                ${updateColumns.join(', ')}
            WHERE
                "Address_ID" = $${paramIndex};
        `;

        const result = await client.query(sql, queryParams);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK'); // Rollback if the main update affects no rows
            return NextResponse.json(
                { message: `Address with ID ${addressIdToUpdate} not found.` },
                { status: 404 }
            );
        }

        await client.query('COMMIT'); // Commit transaction if all operations are successful
        console.log(`Address ID ${addressIdToUpdate} updated successfully.`);
        return NextResponse.json(
            { message: `Address ID ${addressIdToUpdate} updated successfully.`, status: 200 }
        );

    } catch (dbError: any) {
        await client.query('ROLLBACK'); // Rollback transaction on any error
        console.error("Error updating address in database:", dbError);
        // You might add more specific error handling here, e.g., foreign key violations
        return NextResponse.json(
            { message: "Failed to update address.", error: dbError.message },
            { status: 500 }
        );
    } finally {
        client.release(); // Release the client back to the pool
    }
}
