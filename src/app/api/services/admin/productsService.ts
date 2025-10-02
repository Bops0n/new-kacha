import { poolQuery } from '@/app/api/lib/db';
import { ProductInventory } from '@/types';

/**
 * ดึงข้อมูลสินค้าทั้งหมดสำหรับหน้า Admin
 */
export async function getAllAdminProducts(): Promise<ProductInventory[]> {
  const result = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_GET"()`);
  return result.rows;
}

/**
 * เพิ่มสินค้าใหม่ลงในฐานข้อมูล
 */
export async function addProduct(productData: Partial<ProductInventory>, UserID: number): Promise<ProductInventory> {
  const result = await poolQuery(
    `SELECT * FROM "SP_ADMIN_PRODUCT_INS"($1, $2)`, [JSON.stringify([productData]), UserID]
  );

  console.log(result.rows[0]);

  return result.rows[0];
}

/**
 * อัปเดตข้อมูลสินค้าที่มีอยู่
 */
export async function updateProduct(productId: number, UserID: number, productData: Partial<ProductInventory>): Promise<ProductInventory | null> {
  const result = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_UPD"($1, $2, $3)`, [productId, UserID, JSON.stringify(productData)]);
  return result.rows[0] || null;
}

/**
 * ลบสินค้าออกจากฐานข้อมูล
 */
export async function deleteProduct(productId: number, UserID: number): Promise<boolean> {
  const result = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_DEL"($1, $2)`, [productId, UserID]);
  return result.rowCount > 0;
}