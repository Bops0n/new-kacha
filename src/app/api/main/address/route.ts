import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../auth/utils';
import { getAddressesByUserId, addNewAddress } from '@/app/api/services/userServices'; // << Import service

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated || !auth.userId) return auth.response!;

  try {
    const addresses = await getAddressesByUserId(auth.userId);
    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  if (!auth.authenticated || !auth.userId) return auth.response!;

  try {
    const body = await request.json();
    const newAddress = await addNewAddress(auth.userId, body);
    return NextResponse.json({ message: 'เพิ่มที่อยู่สำเร็จ', address: newAddress }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to add address' }, { status: 500 });
  }
}