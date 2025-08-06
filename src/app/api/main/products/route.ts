// app/api/main/products/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db';

export async function GET() {
  try {
    // ใช้ Promise.all เพื่อดึงข้อมูลทั้งหมดพร้อมกัน
    const [
      productsResult,
      categoriesResult,
      subCategoriesResult,
      childSubCategoriesResult
    ] = await Promise.all([
      poolQuery('SELECT * FROM "Product" WHERE "Visibility" = TRUE ORDER BY "Product_ID" ASC'),
      poolQuery('SELECT * FROM "Category" ORDER BY "Name" ASC'),
      poolQuery('SELECT * FROM "Sub_Category" ORDER BY "Name" ASC'),
      poolQuery('SELECT * FROM "Child_Sub_Category" ORDER BY "Name" ASC')
    ]);

    // ส่งข้อมูลทั้งหมดกลับไปใน response เดียว
    return NextResponse.json({
      products: productsResult.rows,
      categories: categoriesResult.rows,
      subCategories: subCategoriesResult.rows,
      childSubCategories: childSubCategoriesResult.rows,
    });

  } catch (error) {
    console.error('API Error fetching products page data:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}