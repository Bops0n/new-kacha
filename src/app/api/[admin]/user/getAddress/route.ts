import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // For session handling (optional)
import { poolQuery } from '../../../lib/db'; // Your database utility
import { getAddressesByUserId } from '@/app/api/services/userServices';
import { AddressSchema } from '@/types';

export async function GET(req: NextRequest) {
    // --- Optional: Session Check (Uncomment if you need authentication) ---
    // This part ensures only authenticated users can access address data.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    // --- Get query parameters (only id and userId remain) ---
    // const addressId = req.nextUrl.searchParams.get('id');       // To fetch a single address by Address_ID
    const userId = req.nextUrl.searchParams.get('UserId');     // To fetch all addresses for a specific User_ID
    
    try {
        const result = await getAddressesByUserId(Number(userId));

        // If fetching a single address by ID and not found
        if (result.length === 0) {
            return NextResponse.json({ message: 'Address not found' }, { status: 404 });
        }

        console.log("Addresses fetched:", userId);

        return NextResponse.json({
            message: "Addresses fetched successfully",
            status: 200,
            addresses: result
        });

    } catch (dbError: any) {
        console.error("Error fetching addresses from database:", dbError);
        return NextResponse.json(
            { message: "Failed to fetch addresses from database", error: dbError.message },
            { status: 500 }
        );
    }
}