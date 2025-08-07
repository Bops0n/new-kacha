import { poolQuery, pool } from '@/app/api/lib/db';
import { UserSchema, AddressSchema, NewAddressForm } from '@/types';

// --- Profile Functions ---

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้จาก User ID
 */
export async function getUserProfileById(userId: number): Promise<UserSchema | null> {
  const result = await poolQuery('SELECT "User_ID", "Username", "Full_Name", "Email", "Phone", "Access_Level" FROM "User" WHERE "User_ID" = $1', [userId]);
  return result.rows[0] || null;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้
 */
export async function updateUserProfile(userId: number, data: Partial<UserSchema>): Promise<boolean> {
  const { Full_Name, Email, Phone } = data; // Whitelist editable fields
  const result = await poolQuery(
    'UPDATE "User" SET "Full_Name" = $1, "Email" = $2, "Phone" = $3 WHERE "User_ID" = $4',
    [Full_Name, Email, Phone, userId]
  );
  return result.rowCount > 0;
}


// --- Address Functions ---

/**
 * ดึงที่อยู่ทั้งหมดของผู้ใช้
 */
export async function getAddressesByUserId(userId: number): Promise<AddressSchema[]> {
  const result = await poolQuery('SELECT * FROM "Address" WHERE "User_ID" = $1 ORDER BY "Is_Default" DESC, "Address_ID" ASC', [userId]);
  return result.rows;
}

/**
 * เพิ่มที่อยู่ใหม่ให้ผู้ใช้ (พร้อม Transaction)
 */
export async function addNewAddress(userId: number, addressData: NewAddressForm): Promise<AddressSchema> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (addressData.Is_Default) {
      await client.query('UPDATE "Address" SET "Is_Default" = FALSE WHERE "User_ID" = $1', [userId]);
    }
    const result = await client.query(
      `INSERT INTO "Address" ("User_ID", "Address_1", "Address_2", "Sub_District", "District", "Province", "Zip_Code", "Is_Default", "Phone") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, addressData.Address_1, addressData.Address_2, addressData.Sub_District, addressData.District, addressData.Province, addressData.Zip_Code, addressData.Is_Default, addressData.Phone]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * อัปเดตที่อยู่ (พร้อม Transaction สำหรับ Is_Default)
 */
export async function updateAddress(userId: number, addressId: number, addressData: Partial<AddressSchema>): Promise<boolean> {
    // ... (สามารถเพิ่ม Logic การอัปเดตที่ซับซ้อนที่นี่ได้ในอนาคต) ...
    // สำหรับตอนนี้ API route จัดการได้ดีอยู่แล้ว แต่ถ้าซับซ้อนขึ้นควรย้ายมาที่นี่
    return true; // Placeholder
}