import { poolQuery } from '@/app/api/lib/db'; // Import pool for transaction capabilities
import { CategoryFormData, CategoryType } from '@/types';

/**
 * เพิ่มหมวดหมู่ใหม่ลงในฐานข้อมูลตามประเภทที่ระบุ
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะเพิ่ม (name, parentId)
 * @returns ข้อมูลหมวดหมู่ที่ถูกสร้างขึ้นใหม่
 */
export async function addCategory(type: CategoryType, payload: CategoryFormData) {
    try {
        const { rows } = await poolQuery(`SELECT public."SP_ADMIN_CATEGORY_INS"($1, $2)`, [type, JSON.stringify(payload)]);
        return rows[0];
    } catch (error) {
        console.error("Call to category add failed:", error);
        throw error;
    }
}

/**
 * อัปเดตชื่อหมวดหมู่ที่มีอยู่
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะอัปเดต (id, name)
 * @returns ข้อมูลหมวดหมู่ที่ถูกอัปเดต
 */
export async function updateCategory(type: CategoryType, categoryId: number, payload: CategoryFormData) {
    try {
        const { rows } = await poolQuery(`SELECT public."SP_ADMIN_CATEGORY_UPD"($1, $2, $3)`, [type, categoryId, JSON.stringify(payload)]);
        return rows[0];
    } catch (error) {
        console.error("Call to category update failed:", error);
        throw error;
    }
}

/**
 * ลบหมวดหมู่ออกจากฐานข้อมูลแบบขั้นบันได (Cascading) ภายใน Transaction
 * *** มีการ UPDATE Product.Child_ID ให้เป็น NULL ก่อนลบ ***
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะลบ (id)
 * @returns boolean ยืนยันการลบ
 */
export async function deleteCategory(type: CategoryType, payload: { id: number }) {
    if (!payload.id) throw new Error('ID is required for delete.');

    try {
        const { rowCount } = await poolQuery(`SELECT public."SP_ADMIN_CATEGORY_DEL"($1, $2)`, [type, payload.id]);
        return rowCount > 0;
    } catch (error) {
        console.error("Call to category delete failed:", error);
        throw error;
    }
}