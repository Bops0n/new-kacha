// src/app/api/addresses/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../lib/db'; // Adjust path as per your project structure

// Import types from your shared types.ts file
import { AddressSchema, NewAddressForm } from '../../../types'; // Adjust path if types.ts is located differently

// For authentication
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path to your Nextauth'; // Adjust path to your NextAuth config

/**
 * Helper function to authenticate the request and get the user ID.
 * Centralizes session checking logic.
 */
async function authenticateRequest() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return {
      authenticated: false,
      response: NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 }),
      userId: null,
    };
  }

  const authenticatedUserId = parseInt(session.user.id as string);
  if (isNaN(authenticatedUserId)) {
    console.error('Session user ID is not a valid number:', session.user.id);
    return {
      authenticated: false,
      response: NextResponse.json({ message: 'User ID จาก session ไม่ถูกต้อง', error: true }, { status: 500 }),
      userId: null,
    };
  }

  return { authenticated: true, userId: authenticatedUserId, response: null };
}


/**
 * GET /api/addresses
 * Retrieves all addresses for the authenticated user.
 * No query parameters are needed for userId as it's taken from the session.
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - JSON response containing addresses or an error message.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number; // Assured to be number by authenticateRequest

  try {
    const result = await poolQuery('SELECT * FROM "Address" WHERE "User_ID" = $1 ORDER BY "Is_Default" DESC, "Address_ID" ASC', [userId]);
    const addresses: AddressSchema[] = result.rows;
    return NextResponse.json({ addresses, error: false }, { status: 200 });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ message: 'Failed to fetch addresses', error: true }, { status: 500 });
  }
}

/**
 * POST /api/addresses
 * Adds a new address for the authenticated user.
 * If the new address is set as default, all other addresses for that user will be set to non-default.
 * The User_ID in the request body is ignored; the authenticated user's ID is used.
 * @param {Request} request - The incoming request object, containing new address data.
 * @returns {NextResponse} - JSON response with the new address ID or an error message.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number; // Authenticated User ID

  try {
    const newAddressData: NewAddressForm = await request.json();

    // Basic validation for required fields
    if (!newAddressData.Address_1 || !newAddressData.District || !newAddressData.Province || !newAddressData.Zip_Code || !newAddressData.Sub_District || newAddressData.Phone === undefined) { // Check Phone for undefined
      return NextResponse.json({ message: 'Missing required address fields', error: true }, { status: 400 });
    }

    // Start a transaction for atomicity if setting default
    await poolQuery('BEGIN');

    // If the new address is set as default, unset all other default addresses for THIS user to not be default
    if (newAddressData.Is_Default) {
      await poolQuery('UPDATE "Address" SET "Is_Default" = FALSE WHERE "User_ID" = $1', [userId]);
    }

    // Insert the new address using the authenticated user's ID
    const insertResult = await poolQuery(
      `INSERT INTO "Address" (
        "User_ID", "Address_1", "Address_2", "District", "Province",
        "Zip_Code", "Is_Default", "Sub_District", "Phone"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "Address_ID"`,
      [
        userId, // Use authenticated userId here
        newAddressData.Address_1,
        newAddressData.Address_2 || null, // Ensure null if empty
        newAddressData.District,
        newAddressData.Province,
        newAddressData.Zip_Code,
        newAddressData.Is_Default,
        newAddressData.Sub_District,
        newAddressData.Phone || null, // Ensure null if empty string
      ]
    );

    await poolQuery('COMMIT'); // Commit the transaction

    const addressId = insertResult.rows[0].Address_ID;
    return NextResponse.json({ message: 'Address added successfully', addressId, error: false }, { status: 201 });

  } catch (error) {
    await poolQuery('ROLLBACK'); // Rollback on error
    console.error('Error adding address:', error);
    return NextResponse.json({ message: 'Failed to add address', error: true }, { status: 500 });
  }
}

// REMOVED PUT and DELETE handlers from here, as they will be in [addressId]/route.ts
// The original code in this file did not have authenticateRequest() in PUT/DELETE anyway, so it was redundant.