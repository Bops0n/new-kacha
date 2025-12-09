import { poolQuery } from '@/app/api/lib/db';
import { ProductInventory } from '@/types';

/**
 * ดึงข้อมูลสินค้าทั้งหมดสำหรับหน้า Admin
 */
export async function getAllAdminProducts(): Promise<ProductInventory[]> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_GET"()`);
  return rows;
}

/**
 * เพิ่มสินค้าใหม่ลงในฐานข้อมูล
 */
export async function addProduct(productData: Partial<ProductInventory>, UserID: number): Promise<ProductInventory> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_INS"($1, $2)`, [JSON.stringify([productData]), UserID]);
  return rows[0];
}

/**
 * อัปเดตข้อมูลสินค้าที่มีอยู่
 */
export async function updateProduct(productId: number, UserID: number, productData: Partial<ProductInventory>): Promise<boolean> {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_UPD"($1, $2, $3)`, [productId, UserID, JSON.stringify(productData)]);
  return rowCount > 0;
}

/**
 * ลบสินค้าออกจากฐานข้อมูล
 */
export async function deleteProduct(productId: number, UserID: number): Promise<boolean> {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_DEL"($1, $2)`, [productId, UserID]);
  return rowCount > 0;
}

export async function getProductDetailByID(productId: number[]) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_DETAIL_GET"($1)`, [productId]);
  return rows;
}

export async function increaseProductQtyInStock(productId: number, increaseQty: number) {
  const { rows, rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_PRODUCT_STOCK_INC"($1, $2)`, [productId, increaseQty]);
  return { 
    data: rows[0], 
    result: rowCount > 0 
  };
}