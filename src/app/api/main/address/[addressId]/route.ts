import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { poolQuery, pool } from '@/app/api/lib/db';
import { AddressSchema } from '@/types'; // Corrected import path and type name

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
 * GET /api/address/[addressId]
 * Retrieves a single address for the authenticated user by Address_ID.
 */
export async function GET(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  if (!auth.authenticated) {
    return auth.response;
  }
  const userId = auth.userId as number;

  const addressId = parseInt(context.params.addressId);
  if (isNaN(addressId)) {
    return NextResponse.json({ message: 'Invalid address ID', error: true }, { status: 400 });
  }

  try {
    const result = await poolQuery('SELECT * FROM "Address" WHERE "Address_ID" = $1 AND "User_ID" = $2', [addressId, userId]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Address not found or does not belong to the authenticated user', error: true }, { status: 404 });
    }

    const address: AddressSchema = result.rows[0];
    return NextResponse.json({ address, error: false }, { status: 200 });

  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ message: 'Failed to fetch address', error: true }, { status: 500 });
  }
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
  const addressId = parseInt(context.params.addressId);
  if (isNaN(addressId)) {
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

  // The dynamic UPDATE query will only update fields that are present in updatedAddressData.
  // This allows partial updates for this PUT handler.
  const updateColumns: string[] = [];
  const queryParams: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  // Fields to update based on AddressSchema
  // Note: User_ID is generally not updatable via this endpoint, it's for ownership check.
  const updatableFields: Array<keyof AddressSchema> = [
    'Address_1', 'Address_2', 'Sub_District', 'District', 'Province',
    'Zip_Code', 'Is_Default', 'Phone'
  ];

  for (const field of updatableFields) {
    // Only add to update list if the field is explicitly provided in the request body
    if (Object.prototype.hasOwnProperty.call(updatedAddressData, field) && updatedAddressData[field] !== undefined) {
      let valueToSet: any = updatedAddressData[field];

      // Convert empty strings to null for nullable database columns
      if (typeof valueToSet === 'string' && valueToSet.trim() === '') {
        valueToSet = null;
      }
      // Ensure boolean value for Is_Default if it comes as 0/1 or string
      if (field === 'Is_Default') {
        valueToSet = Boolean(valueToSet);
      }

      updateColumns.push(`"${field}" = $${paramIndex}`);
      queryParams.push(valueToSet);
      paramIndex++;
    }
  }

  if (updateColumns.length === 0) {
    return NextResponse.json(
      { message: 'No valid fields provided for update.', error: true },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If the updated address is set as default, update all existing addresses for THIS user to not be default
    if (updatedAddressData.Is_Default === true) { // Explicitly check for true
      await client.query(
        `UPDATE public."Address" SET "Is_Default" = FALSE WHERE "User_ID" = $1 AND "Address_ID" != $2`,
        [userId, addressId]
      );
    }

    // Update the address, ensuring it belongs to the authenticated user
    // and using addressId from URL params
    const updateResult = await poolQuery(
      `UPDATE public."Address" SET
        ${updateColumns.join(', ')}
      WHERE "Address_ID" = $${paramIndex} AND "User_ID" = $${paramIndex + 1} RETURNING "Address_ID"`,
      [...queryParams, addressId, userId]
    );

    if (updateResult.rowCount === 0) {
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
  const addressId = parseInt(context.params.addressId);
  if (isNaN(addressId)) {
    return NextResponse.json({ message: 'Invalid address ID', error: true }, { status: 400 });
  }

  try {
    // Delete the address, ensuring it belongs to the authenticated user
    const deleteResult = await poolQuery('DELETE FROM "Address" WHERE "Address_ID" = $1 AND "User_ID" = $2 RETURNING "Address_ID"', [addressId, userId]);

    if (deleteResult.rowCount === 0) {
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

  const addressId = parseInt(context.params.addressId);
  if (isNaN(addressId)) {
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

  const updateColumns: string[] = [];
  const queryParams: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  // Only allow updating Is_Default for this specific PATCH operation (or add other fields if needed)
  const allowedPatchFields: Array<keyof Partial<AddressSchema>> = ['Is_Default'];
  // If you want to allow full partial update on any field, use all updatableFields instead
  // const allowedPatchFields: Array<keyof AddressSchema> = ['Address_1', 'Address_2', 'Sub_District', 'District', 'Province', 'Zip_Code', 'Is_Default', 'Phone'];


  for (const field of allowedPatchFields) {
    if (Object.prototype.hasOwnProperty.call(updatedAddressData, field) && updatedAddressData[field] !== undefined) {
      let valueToSet: any = updatedAddressData[field];

      if (typeof valueToSet === 'string' && valueToSet.trim() === '') {
        valueToSet = null;
      }
      if (field === 'Is_Default') {
        valueToSet = Boolean(valueToSet);
      }

      updateColumns.push(`"${field}" = $${paramIndex}`);
      queryParams.push(valueToSet);
      paramIndex++;
    }
  }

  if (updateColumns.length === 0) {
    return NextResponse.json(
      { message: 'No valid fields provided for partial update.', error: true },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If Is_Default is being set to TRUE, unset all other default addresses for this user
    if (updatedAddressData.Is_Default === true) {
      await client.query(
        `UPDATE public."Address" SET "Is_Default" = FALSE WHERE "User_ID" = $1 AND "Address_ID" != $2`,
        [userId, addressId]
      );
    }

    // Update the specific address
    const updateResult = await client.query(
      `UPDATE public."Address" SET
        ${updateColumns.join(', ')}
      WHERE "Address_ID" = $${paramIndex} AND "User_ID" = $${paramIndex + 1} RETURNING "Address_ID"`,
      [...queryParams, addressId, userId]
    );

    if (updateResult.rowCount === 0) {
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