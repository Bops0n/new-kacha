import { NextResponse } from 'next/server';
import { getAllCategories, getAllProducts } from '../../services/user/userServices';
import { logger } from '@/server/logger';

export async function GET() {
  try {
    const { products }  = await getAllProducts();

    const { categories, subCategories, childSubCategories } = await getAllCategories();
    
    const payload = {
      products: products,
      categories: categories,
      subCategories: subCategories,
      childSubCategories: childSubCategories,
    }
    return NextResponse.json(payload);

  } catch (error) {
    logger.error('API Error fetching products page data:', { error: error });
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}