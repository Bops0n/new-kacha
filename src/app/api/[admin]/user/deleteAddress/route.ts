import { deleteAddress } from "@/app/api/services/userServices";
import { NextRequest, NextResponse } from "next/server";

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