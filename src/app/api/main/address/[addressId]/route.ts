import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { poolQuery, pool } from '@/app/api/lib/db';
import { AddressSchema } from '@/types'; // Corrected import path and type name
import { deleteAddress, getAddressesByAddressId, updateAddress } from '@/app/api/services/userServices';

/**
 * Helper function to authenticate the request and get the user ID.
 * All API handlers will use this.
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
 * PUT /api/address/[addressId]
 * Updates an existing address for the authenticated user.
 * The addressId is taken from the URL parameter.
 * This handler now allows partial updates (behaves like a PATCH) to support specific operations like "set default".
 * If updating a full address, ensure all necessary fields are sent from the client.
 */
export async function PUT(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number;

  // Get addressId from URL params
  //const addressId = parseInt(context.params.addressId);
  const { addressId } = await context.params;
  const parseId = parseInt(addressId);

  if (isNaN(parseId)) {
    return NextResponse.json({ message: 'Invalid address ID', error: true }, { status: 400 });
  }

  let updatedAddressData: Partial<AddressSchema>;
  try {
    updatedAddressData = await request.json();
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return NextResponse.json(
      { message: 'Invalid request body. Expected JSON.', error: true },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await updateAddress(parseId, userId, updatedAddressData);

    if (!result) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { message: 'Address not found or does not belong to the authenticated user', error: true },
        { status: 404 }
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Address updated successfully', error: false }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating address:', error);
    return NextResponse.json({ message: 'Failed to update address', error: true }, { status: 500 });
  } finally {
    client.release();
  }
}


/**
 * DELETE /api/address/[addressId]
 * Deletes an address by its ID, ensuring it belongs to the authenticated user.
 */
export async function DELETE(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number;

  // Get addressId from URL params
  const { addressId } = await context.params;
  const parseId = parseInt(addressId);

  if (isNaN(parseId)) {
    return NextResponse.json({ message: 'Invalid address ID', error: true }, { status: 400 });
  }

  try {
    // Delete the address, ensuring it belongs to the authenticated user
    const result = await deleteAddress(parseId);

    if (!result) {
      return NextResponse.json({ message: 'Address not found or does not belong to the authenticated user', error: true }, { status: 404 });
    }

    return NextResponse.json({ message: 'Address deleted successfully', error: false }, { status: 200 });

  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ message: 'Failed to delete address', error: true }, { status: 500 });
  }
}

/**
 * PATCH /api/address/[addressId]
 * Partially updates an existing address for the authenticated user.
 * Designed for operations like setting Is_Default.
 */
export async function PATCH(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number;

  const { addressId } = await context.params;
  const parseId = parseInt(addressId);

  if (isNaN(parseId)) {
    return NextResponse.json({ message: 'Invalid address ID', error: true }, { status: 400 });
  }

  let updatedAddressData: Partial<AddressSchema>;
  try {
    updatedAddressData = await request.json();
  } catch (error) {
    console.error('Invalid JSON in request body:', error);
    return NextResponse.json(
      { message: 'Invalid request body. Expected JSON.', error: true },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the specific address
    const result = await updateAddress(parseId, userId, updatedAddressData);

    if (!result) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { message: 'Address not found or does not belong to the authenticated user', error: true },
        { status: 404 }
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Address partially updated successfully', error: false }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error partially updating address:', error);
    return NextResponse.json({ message: 'Failed to partially update address', error: true }, { status: 500 });
  } finally {
    client.release();
  }
}