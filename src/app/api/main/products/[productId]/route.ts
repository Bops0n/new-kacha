import { NextRequest, NextResponse } from 'next/server';
import { getProductDetail } from '@/app/api/services/user/userServices';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: number } }
) {
  const { productId } = await params;

  if (!productId || isNaN(Number(productId))) {
    return NextResponse.json({ message: 'Product ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    const { Status_Code, Message, Product, Related_Products, Category_Path } = await getProductDetail(productId);

    if (Status_Code != 200) {
      return NextResponse.json({ message: Message }, { status: Status_Code });  
    }

    return NextResponse.json({ Product, Related_Products, Category_Path, message: Message }, { status: Status_Code });

  } catch (error) {
    console.error('API Error fetching product:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}