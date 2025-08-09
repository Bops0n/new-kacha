// app/api/main/products/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db';

export async function GET() {
  try {
    // ใช้ Promise.all เพื่อดึงข้อมูลทั้งหมดพร้อมกัน
    const  SP_GET_VISIBLE_PRODUCTS  = await poolQuery(`SELECT * FROM public."SP_GET_VISIBLE_PRODUCTS"()`);

    const allCategories = await poolQuery('SELECT * FROM public."SP_GET_ALL_CATEGORY"()');
    const { categories, subcategories, childsubcategories } = allCategories.rows[0];
    // console.log(SP_GET_VISIBLE_PRODUCTS.rows[0].SP_GET_ALL_CATEGORY)
    // console.log(result1)
    
    
    const payload = {
      products: SP_GET_VISIBLE_PRODUCTS.rows[0],
      categories: categories,
      subCategories: subcategories,
      childSubCategories: childsubcategories,
    }
    console.log(payload)
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