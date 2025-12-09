import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories } from '../../services/user/userServices'; // ตรวจสอบ path นี้ให้ตรงกับโปรเจกต์จริงของคุณ
import { poolQuery } from '@/app/api/lib/db';
import { logger } from '@/server/logger';

export async function GET(request: NextRequest) {
  try {
    // 1. รับค่า Query Parameters จาก URL
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // จำนวนที่จะโหลดต่อครั้ง
    
    // รับค่า Filter (ถ้าไม่มีให้เป็น null)
    const search = searchParams.get('search') || null;
    
    const categoryIdParam = searchParams.get('categoryId');
    const categoryId = categoryIdParam && categoryIdParam !== 'null' ? parseInt(categoryIdParam) : null;

    const subCategoryIdParam = searchParams.get('subCategoryId');
    const subCategoryId = subCategoryIdParam && subCategoryIdParam !== 'null' ? parseInt(subCategoryIdParam) : null;

    const childCategoryIdParam = searchParams.get('childCategoryId');
    const childCategoryId = childCategoryIdParam && childCategoryIdParam !== 'null' ? parseInt(childCategoryIdParam) : null;

    const isDiscount = searchParams.get('discount') === 'true';

    // 2. เรียก Stored Procedure ที่ทำ Pagination ไว้ (SP_USER_PRODUCT_SEARCH)
    // ลำดับพารามิเตอร์: Search, Cat, Sub, Child, IsDiscount, Page, PageSize
    const { rows } = await poolQuery(
        `SELECT * FROM public."SP_USER_PRODUCT_SEARCH_GET"($1, $2, $3, $4, $5, $6, $7)`,
        [search, categoryId, subCategoryId, childCategoryId, isDiscount, page, limit]
    );

    // 3. ดึงข้อมูลหมวดหมู่ (สำหรับ Sidebar)
    // หมายเหตุ: ถ้าข้อมูลหมวดหมู่ไม่เปลี่ยนบ่อย อาจจะแยก API นี้ออกไปต่างหากเพื่อความเร็วได้ในอนาคต
    const { categories, subCategories, childSubCategories } = await getAllCategories();
    
    // 4. จัดการข้อมูลผลลัพธ์
    // ดึง Total_Rows ออกมาจากแถวแรก (Postgres ส่งมาเป็น String สำหรับ BigInt)
    const totalItems = rows.length > 0 ? parseInt(rows[0].Total_Rows) : 0;

    // ลบ Total_Rows ออกจาก Object สินค้า เพื่อไม่ให้ข้อมูลซ้ำซ้อน
    const products = rows.map((row: any) => {
        const { Total_Rows, ...productData } = row;
        return productData;
    });

    // คำนวณว่ามีหน้าถัดไปหรือไม่
      const hasMore = (page * limit) < totalItems;
      console.log(hasMore)

    return NextResponse.json({
      products: products,
      total: totalItems,
      page: page,
      limit: limit,
      hasMore: hasMore, // ค่านี้สำคัญมากสำหรับ Infinite Scroll
      categories,
      subCategories,
      childSubCategories,

    });

  } catch (error: any) {
    logger.error('API Error fetching products:', { error: error });
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}