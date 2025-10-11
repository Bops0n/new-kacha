import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // For session handling (optional)
import { poolQuery, pool } from '../../../lib/db'; // Your database utility from 'pool-query-function' Canvas
import { AddressSchema } from '@/types';
import { updateAddress } from '@/app/api/services/userServices';

export async function PATCH(req: NextRequest) {
    // --- Optional: Session Check for Authorization ---
    // Uncomment this section if you want to restrict who can update address data.
    // For example, only the owner of the address or an admin can update it.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    let updatedAddressData: Partial<AddressSchema>; // Use Partial<Address> to allow only some fields
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
    const userIdToUpdate = updatedAddressData.User_ID;

    const result = await updateAddress(addressIdToUpdate, Number(userIdToUpdate), updatedAddressData);

    if (!result) {
        return NextResponse.json(
            { message: `Address with ID ${addressIdToUpdate} update failed.` },
            { status: 500 }
        );
    }
    
    return NextResponse.json(
        { message: `Address ID ${addressIdToUpdate} updated successfully.`, status: 200 }
    );
}
