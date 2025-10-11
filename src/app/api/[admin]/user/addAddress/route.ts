import { NextRequest, NextResponse } from 'next/server';
import { pool, poolQuery } from '../../../lib/db'; // Updated path
import { AddressSchema } from '@/types';
import { addNewAddress } from '@/app/api/services/userServices';
import { authenticateRequest } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

// POST API route to add a new address
export async function POST(req: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
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

    const { Address_ID } = await addNewAddress(newAddressData.User_ID, newAddressData);

    return NextResponse.json(
        { message: "Address added successfully.", Address_ID: Address_ID, status: 200 },
        { status: 200 }
    );
}
