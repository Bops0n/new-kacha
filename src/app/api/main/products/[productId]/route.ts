import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../../lib/db';
import { ProductInventory, FullCategoryPath } from '../../../../../types';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const { productId } = await params;

  if (!productId || isNaN(Number(productId))) {
    return NextResponse.json({ message: 'Product ID ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    // 1. ดึงข้อมูลสินค้าหลัก
    const productResult = await poolQuery('SELECT "Product_ID", "Child_ID", "Name", "Brand", "Description", "Unit", "Quantity", "Sale_Cost", "Sale_Price", "Discount_Price", "Reorder_Point", "Visibility", "Review_Rating", "Image_URL", "Dimensions", "Material" FROM "Product" WHERE "Product_ID" = $1 AND "Visibility" = TRUE', [productId]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ message: 'ไม่พบสินค้า' }, { status: 404 });
    }
    const product: ProductInventory = productResult.rows[0];

    // 2. ดึงข้อมูลสินค้าที่เกี่ยวข้องและเส้นทางหมวดหมู่พร้อมกัน
    let relatedProducts: ProductInventory[] = [];
    let categoryPath: FullCategoryPath | null = null;

    if (product.Child_ID) {
      const [relatedResult, pathResult] = await Promise.all([
        poolQuery(
          `SELECT * FROM "Product" WHERE "Child_ID" = $1 AND "Product_ID" != $2 AND "Visibility" = TRUE LIMIT 4`,
          [product.Child_ID, productId]
        ),
        poolQuery(
          `SELECT 
            c."Category_ID", c."Name" as "Category_Name",
            sc."Sub_Category_ID", sc."Name" as "Sub_Category_Name",
            csc."Child_ID", csc."Name" as "Child_Name"
           FROM "Child_Sub_Category" csc
           JOIN "Sub_Category" sc ON csc."Sub_Category_ID" = sc."Sub_Category_ID"
           JOIN "Category" c ON sc."Category_ID" = c."Category_ID"
           WHERE csc."Child_ID" = $1`,
          [product.Child_ID]
        )
      ]);
      
      relatedProducts = relatedResult.rows;
      if (pathResult.rows.length > 0) {
        categoryPath = pathResult.rows[0];
      }
    }

    // 3. ส่งข้อมูลทั้งหมดกลับไป
    return NextResponse.json({
      product,
      relatedProducts,
      categoryPath,
    });

  } catch (error) {
    console.error('API Error fetching product:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}