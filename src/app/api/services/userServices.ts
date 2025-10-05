import { poolQuery, pool } from '@/app/api/lib/db';
import { UserSchema, AddressSchema, NewAddressForm } from '@/types';

// --- Profile Functions ---

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้จาก User ID
 */
export async function getUserProfileById(userId: number): Promise<UserSchema | null> {
  const result = await poolQuery(`SELECT * FROM "SP_USER_ACCOUNT_GET"($1)`, [userId]);
  console.log(result.rows[0]);
  return result.rows[0] || null;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้
 */
export async function updateUserProfile(userId: number, data: Partial<UserSchema>): Promise<boolean> {
  const { Full_Name, Email, Phone } = data; // Whitelist editable fields
  const result = await poolQuery(`SELECT * FROM "SP_USER_ACCOUNT_UPD"($1, $2, $3, $4)`, [Full_Name, Email, Phone, userId]);
  return result.rowCount > 0;
}


// --- Address Functions ---

/**
 * ดึงที่อยู่ทั้งหมดของผู้ใช้
 */
export async function getAddressesByUserId(userId: number): Promise<AddressSchema[]> {
  const result = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_UID_GET"($1)`, [userId]);
  return result.rows;
}

export async function getAddressesByAddressId(addressId: number): Promise<AddressSchema[]> {
  const result = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_ADDRID_GET"($1)`, [addressId]);
  return result.rows;
}

/**
 * เพิ่มที่อยู่ใหม่ให้ผู้ใช้ (พร้อม Transaction)
 */
export async function addNewAddress(userId: number, addressData: Omit<AddressSchema, 'Address_ID'>): Promise<AddressSchema> {
  const result = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_INS"($1, $2)`, [userId, JSON.stringify(addressData)]);
  return result.rows[0];
}

/**
 * อัปเดตที่อยู่ (พร้อม Transaction สำหรับ Is_Default)
 */
export async function updateAddress(addressId: number, userId: number, addressData: Partial<AddressSchema>): Promise<boolean> {
    const result = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_UPD"($1, $2, $3)`, [addressId, userId, JSON.stringify(addressData)]);
    return result.rows[0];
}

export async function deleteAddress(addressID: number): Promise<boolean>{
  const result = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_DEL"($1)`, [addressID]);
  return result.rowCount > 0;
}