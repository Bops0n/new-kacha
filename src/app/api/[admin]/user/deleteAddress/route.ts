import { checkUserMgrRequire } from "@/app/api/auth/utils";
import { deleteAddress } from "@/app/api/services/userServices";
import { checkRequire } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const addressIdToDelete = req.nextUrl.searchParams.get('id');

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

    try {
        const result = deleteAddress(parsedAddressId);

        if (!result) {
            return NextResponse.json(
                { message: `Address with ID ${parsedAddressId} not found.`, status: 404 },
                { status: 404 }
            );
        }

        console.log(`Address ID ${parsedAddressId} deleted successfully.`);
        return NextResponse.json(
            { message: `Address ID ${parsedAddressId} deleted successfully.`, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        console.error("Error deleting address from database:", dbError);
        return NextResponse.json(
            { message: "Failed to delete address.", error: dbError.message },
            { status: 500 }
        );
    }
}