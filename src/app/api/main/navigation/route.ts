import { NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';

export async function GET() {
  try {
    // ใช้ Promise.all เพื่อดึงข้อมูลทั้ง 3 ตารางพร้อมกัน
    const [
      categoriesRes,
      subCategoriesRes,
      childSubCategoriesRes
    ] = await Promise.all([
      poolQuery('SELECT * FROM "Category" ORDER BY "Category_ID" ASC'),
      poolQuery('SELECT * FROM "Sub_Category" ORDER BY "Sub_Category_ID" ASC'),
      poolQuery('SELECT * FROM "Child_Sub_Category" ORDER BY "Child_ID" ASC')
    ]);

    return NextResponse.json({
      categories: categoriesRes.rows,
      subCategories: subCategoriesRes.rows,
      childSubCategories: childSubCategoriesRes.rows,
    });

  } catch (error) {
    console.error('API Error fetching navigation data:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' },
      { status: 500 }
    );
  }
}