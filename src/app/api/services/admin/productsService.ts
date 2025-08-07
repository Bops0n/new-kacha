import { poolQuery } from '@/app/api/lib/db';
import { ProductInventory } from '@/types';

/**
 * ดึงข้อมูลสินค้าทั้งหมดสำหรับหน้า Admin
 */
export async function getAllAdminProducts(): Promise<ProductInventory[]> {
  const result = await poolQuery('SELECT * FROM "Product" ORDER BY "Product_ID" DESC');
  return result.rows;
}

/**
 * เพิ่มสินค้าใหม่ลงในฐานข้อมูล
 */
export async function addProduct(productData: Partial<ProductInventory>): Promise<ProductInventory> {
  const {
    Child_ID, Name, Brand, Description, Unit, Quantity, Sale_Cost, Sale_Price,
    Reorder_Point, Visibility, Review_Rating, Image_URL, Dimensions, Material
  } = productData;

  const result = await poolQuery(
    `INSERT INTO "Product" (
        "Child_ID", "Name", "Brand", "Description", "Unit", "Quantity", "Sale_Cost", 
        "Sale_Price", "Reorder_Point", "Visibility", "Review_Rating", "Image_URL", 
        "Dimensions", "Material"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    [
      Child_ID, Name, Brand, Description, Unit, Quantity, Sale_Cost, Sale_Price,
      Reorder_Point, Visibility, Review_Rating, Image_URL, Dimensions, Material
    ]
  );
  return result.rows[0];
}

/**
 * อัปเดตข้อมูลสินค้าที่มีอยู่
 */
export async function updateProduct(productId: number, productData: Partial<ProductInventory>): Promise<ProductInventory | null> {
  const updateColumns: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Dynamically build the SET clause
  // delete productData[''] 
  for (const key in productData) {
    if (key !== 'Product_ID' && productData[key] !== undefined) {
      updateColumns.push(`"${key}" = $${paramIndex}`);
      queryParams.push(productData[key]);
      paramIndex++;
    }
  }

  if (updateColumns.length === 0) {
    throw new Error('No fields to update');
  }

  queryParams.push(productId);
  const sql = `UPDATE "Product" SET ${updateColumns.join(', ')} WHERE "Product_ID" = $${paramIndex} RETURNING *`;
  console.log(sql)
  const result = await poolQuery(sql, queryParams);
  return result.rows[0] || null;
}

/**
 * ลบสินค้าออกจากฐานข้อมูล
 */
export async function deleteProduct(productId: number): Promise<boolean> {
  const result = await poolQuery('DELETE FROM "Product" WHERE "Product_ID" = $1', [productId]);
  return result.rowCount > 0;
}