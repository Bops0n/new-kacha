import { NextRequest, NextResponse } from 'next/server';
import { pool, poolQuery } from '../../../lib/db'; // Updated path
import { AddressSchema } from '@/types';
import { addNewAddress } from '@/app/api/services/userServices';
import { authenticateRequest } from '@/app/api/auth/utils';
import { requireAdmin } from '@/app/utils/client';

// POST API route to add a new address
export async function POST(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;
    
    let newAddressData: Omit<AddressSchema, 'Address_ID'>; // Omit Address_ID as it's auto-generated
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

    // --- Start a database transaction for atomicity ---
    const client = await pool.connect(); // Get a client directly from the pool
    try {
        await client.query('BEGIN'); // Start transaction

        const result = await addNewAddress(newAddressData.User_ID, newAddressData);

        await client.query('COMMIT'); // Commit transaction if all operations are successful

        return NextResponse.json(
            { message: "Address added successfully.", Address_ID: result.Address_ID, status: 201 },
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
