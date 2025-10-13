import { NextRequest, NextResponse } from 'next/server';
import { AddressSchema } from '@/types';
import { deleteAddress, updateAddress } from '@/app/api/services/userServices';
import { authenticateRequest } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

export async function PUT(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;

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

  const result = await updateAddress(parseId, Number(auth.userId), updatedAddressData);

  if (!result) {
    return NextResponse.json(
      { message: 'Address not found or does not belong to the authenticated user', error: true },
      { status: 404 }
    );
  }
}


/**
 * DELETE /api/address/[addressId]
 * Deletes an address by its ID, ensuring it belongs to the authenticated user.
 */
export async function DELETE(request: NextRequest, context: { params: { addressId: string } }) {
  const auth = await authenticateRequest();
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;

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
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;

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

  const result = await updateAddress(parseId, Number(auth.userId), updatedAddressData);

  if (!result) {
    return NextResponse.json(
      { message: 'Address not found or does not belong to the authenticated user', error: true },
      { status: 404 }
    );
  }
}