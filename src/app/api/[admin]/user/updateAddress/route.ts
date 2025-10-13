import { NextRequest, NextResponse } from 'next/server';
import { AddressSchema } from '@/types';
import { updateAddress } from '@/app/api/services/userServices';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

export async function PATCH(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    let updatedAddressData: Partial<AddressSchema>;
    try {
        updatedAddressData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

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
