import { pool, poolQuery } from '@/app/api/lib/db'; // Import pool for transaction capabilities

/**
 * เพิ่มหมวดหมู่ใหม่ลงในฐานข้อมูลตามประเภทที่ระบุ
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะเพิ่ม (name, parentId)
 * @returns ข้อมูลหมวดหมู่ที่ถูกสร้างขึ้นใหม่
 */
export async function addCategory(type: 'main' | 'sub' | 'child', payload: { name: string; parentId?: number }) {
    let result;
        switch (type) {
            case 'main':
                if (!payload.name) throw new Error('Category name is required.');
                result = await poolQuery('INSERT INTO "Category" ("Name") VALUES ($1) RETURNING *', [payload.name]);
                break;
            case 'sub':
                if (!payload.name || !payload.parentId) throw new Error('Name and parentId are required for sub-category.');
                result = await poolQuery('INSERT INTO "Sub_Category" ("Name", "Category_ID") VALUES ($1, $2) RETURNING *', [payload.name, payload.parentId]);
                break;
            case 'child':
                if (!payload.name || !payload.parentId) throw new Error('Name and parentId are required for child-category.');
                result = await poolQuery('INSERT INTO "Child_Sub_Category" ("Name", "Sub_Category_ID") VALUES ($1, $2) RETURNING *', [payload.name, payload.parentId]);
                break;
            default:
                throw new Error('Invalid category type for ADD action.');
        }
        return result.rows[0];
}

/**
 * อัปเดตชื่อหมวดหมู่ที่มีอยู่
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะอัปเดต (id, name)
 * @returns ข้อมูลหมวดหมู่ที่ถูกอัปเดต
 */
export async function updateCategory(type: 'main' | 'sub' | 'child', payload: { id: number; name: string }) {
    let result;
        if (!payload.id || !payload.name) throw new Error('ID and name are required for update.');

        switch (type) {
            case 'main':
                result = await poolQuery('UPDATE "Category" SET "Name" = $1 WHERE "Category_ID" = $2 RETURNING *', [payload.name, payload.id]);
                break;
            case 'sub':
                result = await poolQuery('UPDATE "Sub_Category" SET "Name" = $1 WHERE "Sub_Category_ID" = $2 RETURNING *', [payload.name, payload.id]);
                break;
            case 'child':
                result = await poolQuery('UPDATE "Child_Sub_Category" SET "Name" = $1 WHERE "Child_ID" = $2 RETURNING *', [payload.name, payload.id]);
                break;
            default:
                throw new Error('Invalid category type for UPDATE action.');
        }
        if (result.rowCount === 0) throw new Error('Category not found for update.');
        return result.rows[0];
}

/**
 * ลบหมวดหมู่ออกจากฐานข้อมูลแบบขั้นบันได (Cascading) ภายใน Transaction
 * *** มีการ UPDATE Product.Child_ID ให้เป็น NULL ก่อนลบ ***
 * @param type - ประเภทของหมวดหมู่ ('main', 'sub', 'child')
 * @param payload - ข้อมูลที่จะลบ (id)
 * @returns boolean ยืนยันการลบ
 */
export async function deleteCategory(type: 'main' | 'sub' | 'child', payload: { id: number }) {
    if (!payload.id) throw new Error('ID is required for delete.');

    try {
        // --- เรียกใช้ฟังก์ชันใน DB ใน 1 Query ---
        await poolQuery('SELECT public."SP_ADMIN_CATEGORY_DEL"($1, $2)', [type, payload.id]);
        return true;
    } catch (error) {
        console.error("Call to category delete failed:", error);
        throw error; // Re-throw the error to be caught by the API route
    }
}