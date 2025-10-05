import { NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';

export async function GET() {
  try {
    // ใช้ Promise.all เพื่อดึงข้อมูลทั้ง 3 ตารางพร้อมกัน
    const allCategories = await poolQuery(`SELECT * FROM "SP_ALL_CATEGORIES_GET"()`);
    const { categories, subCategories, childSubCategories } = allCategories.rows[0];
    
    return NextResponse.json({
      categories: categories,
      subCategories: subCategories,
      childSubCategories: childSubCategories,
    });

  } catch (error) {
    console.error('API Error fetching navigation data:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}