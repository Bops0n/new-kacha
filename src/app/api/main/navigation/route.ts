import { NextResponse } from 'next/server';
import { getAllCategories } from '../../services/user/userServices';
import { logger } from '@/server/logger';

export async function GET() {
  try {
    const { categories, subCategories, childSubCategories } = await getAllCategories();
    
    return NextResponse.json({
      categories: categories,
      subCategories: subCategories,
      childSubCategories: childSubCategories,
    });

  } catch (error) {
    logger.error('API Error fetching navigation data:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}