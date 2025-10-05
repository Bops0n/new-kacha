// app/api/main/products/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db';

export async function GET() {
  try {
    // ใช้ Promise.all เพื่อดึงข้อมูลทั้งหมดพร้อมกัน
    const result  = await poolQuery(`SELECT * FROM "SP_USER_PRODUCT_GET"()`);
    
    const allCategories = await poolQuery(`SELECT * FROM "SP_ALL_CATEGORIES_GET"()`);
    const { categories, subCategories, childSubCategories } = allCategories.rows[0];
    
    const payload = {
      products: result.rows[0].products,
      categories: categories,
      subCategories: subCategories,
      childSubCategories: childSubCategories,
    }
    // console.log(payload)
    // ส่งข้อมูลทั้งหมดกลับไปใน response เดียว
    return NextResponse.json(payload);

  } catch (error) {
    console.error('API Error fetching products page data:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}