import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../auth/utils';
import { getAddressesByUserId, addNewAddress } from '@/app/api/services/user/userServices'; // << Import service
import { checkRequire } from '@/app/utils/client';
import { logger } from '@/server/logger';

export async function GET() {
  const auth = await authenticateRequest();
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;

  try {
    const addresses = await getAddressesByUserId(Number(auth.userId));
    return NextResponse.json({ addresses });
  } catch (error) {
    logger.error('API Server Error', { error: error })
    return NextResponse.json({ message: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();
  const isCheck = checkRequire(auth);
  if (isCheck) return isCheck;

  try {
    const body = await request.json();
    const newAddress = await addNewAddress(Number(auth.userId), body);
    return NextResponse.json({ message: 'เพิ่มที่อยู่สำเร็จ', address: newAddress }, { status: 200 });
  } catch (error) {
    logger.error('API Server Error', { error: error })
    return NextResponse.json({ message: 'Failed to add address' }, { status: 500 });
  }
}