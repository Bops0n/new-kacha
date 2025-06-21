import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // For session handling (optional)
import { authOptions } from '../../../auth/[...nextauth]/route'; // For session handling (optional)
import { poolQuery } from '../../../lib/db'; // Your database utility

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
}

export async function GET(req: NextRequest) {
    // --- Optional: Session Check (Uncomment if you need authentication) ---
    // This part ensures only authenticated users can access address data.
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // console.log("User session:", session);

    // --- Get query parameters (only id and userId remain) ---
    const addressId = req.nextUrl.searchParams.get('id');       // To fetch a single address by Address_ID
    const userId = req.nextUrl.searchParams.get('UserId');     // To fetch all addresses for a specific User_ID

    let addresses: Address[] = [];
    let sql: string;
    let queryParams: (string | number)[] = [];

    // Define the columns to select based on your schema
    const selectColumns = `
        "Address_ID",
        "User_ID",
        "Address_1",
        "Address_2",
        "Sub_District",
        "District",
        "Province",
        "Zip_Code",
        "Is_Default",
        "Phone"
    `;

    // --- Construct SQL query based on parameters ---
    if (addressId) {
        // Fetch a single address by Address_ID
        sql = `SELECT ${selectColumns} FROM public."Address" WHERE "Address_ID" = $1`;
        queryParams.push(parseInt(addressId, 10));
        console.log(`getAddress Select by AddressID : ${userId}`)

    } else if (userId) {
        // Fetch all addresses for a specific User_ID
        sql = `SELECT ${selectColumns} FROM public."Address" WHERE "User_ID" = $1`;
        queryParams.push(parseInt(userId, 10));
        console.log(`getAddress Select by UserID : ${userId}`)

    } else {
        // Fetch all addresses if no specific ID is provided
        sql = `SELECT ${selectColumns} FROM public."Address"`;
    }

    // Always order by Address_ID for consistent results when no other sort is specified
    sql += ` ORDER BY "Address_ID" ASC`; // Default sort to ensure consistent results

    try {
        const result = await poolQuery(sql, queryParams);
        addresses = result.rows;

        // If fetching a single address by ID and not found
        if (addressId && addresses.length === 0) {
            return NextResponse.json({ message: 'Address not found' }, { status: 404 });
        }
        // If fetching by User_ID and no addresses found for that user
        if (userId && addresses.length === 0) {
             return NextResponse.json({ message: `No addresses found for User ID ${userId}` }, { status: 404 });
        }

        console.log("Addresses fetched:", userId);

    } catch (dbError: any) {
        console.error("Error fetching addresses from database:", dbError);
        return NextResponse.json(
            { message: "Failed to fetch addresses from database", error: dbError.message },
            { status: 500 }
        );
    }

    // --- Return JSON Response ---
    return NextResponse.json({
        message: "Addresses fetched successfully",
        status: 200,
        addresses: addresses
    });
}