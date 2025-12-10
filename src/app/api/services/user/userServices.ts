import { poolQuery } from '@/app/api/lib/db';
import { UserSchema, AddressSchema, PlaceOrderRequestBody } from '@/types';

// --- Profile Functions ---

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้จาก User ID
 */
export async function getUserProfileById(userId: number): Promise<UserSchema | null> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ACCOUNT_GET"($1)`, [userId]);
  return rows[0] || null;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้
 */
export async function updateUserProfile(userId: number, data: Partial<UserSchema>): Promise<boolean> {
  
  delete data.Addresses;
  delete data.Access_Level;
  delete data.User_ID;
  
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_ACCOUNT_UPD"($1, $2)`, [userId, JSON.stringify(data)]);
  return rowCount !== null && rowCount > 0;
}


// --- Address Functions ---

/**
 * ดึงที่อยู่ทั้งหมดของผู้ใช้
 */
export async function getAddressesByUserId(userId: number): Promise<AddressSchema[]> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_GET"($1, $2)`, ["User_ID", userId]);
  return rows;
}

export async function getAddressesByAddressId(addressId: number): Promise<AddressSchema[]> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_GET"($1, $2)`, ["Address_ID", addressId]);
  return rows;
}

/**
 * เพิ่มที่อยู่ใหม่ให้ผู้ใช้ (พร้อม Transaction)
 */
export async function addNewAddress(userId: number, addressData: Omit<AddressSchema, 'Address_ID'>): Promise<AddressSchema> {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_INS"($1, $2)`, [userId, JSON.stringify(addressData)]);
  return rows[0];
}

/**
 * อัปเดตที่อยู่ (พร้อม Transaction สำหรับ Is_Default)
 */
export async function updateAddress(addressId: number, userId: number, addressData: Partial<AddressSchema>): Promise<boolean> {
    const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_UPD"($1, $2, $3)`, [addressId, userId, JSON.stringify(addressData)]);
    return rowCount !== null && rowCount > 0;
}

export async function deleteAddress(addressID: number): Promise<boolean> {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_ADDRESS_DEL"($1)`, [addressID]);
  return rowCount !== null && rowCount > 0;
}

export async function getAllProducts() {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_PRODUCT_GET"()`);
  return rows[0];
}

export async function getAllCategories() {
  const { rows } = await poolQuery(`SELECT * FROM "SP_ALL_CATEGORIES_GET"()`);
  return rows[0];
}

export async function getOrderByUID(userId: number) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_GET"($1, $2)`, ["User_ID", userId]);
  return rows;
}

export async function getCartByUID(userId: number) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_CART_GET"($1)`, [userId]);
  return rows;
}

export async function addCartProduct(userId: number, productId: number, qty: number) {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_CART_INS"($1, $2, $3)`, [userId, productId, qty]);
  return rowCount !== null && rowCount > 0;
}

export async function deleteCartProduct(userId: number, productId: number) {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_CART_DEL"($1, $2)`, [userId, productId]);
  return rowCount !== null && rowCount > 0;
}

export async function updateCartProduct(userId: number, productId: number, qty: number) {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_CART_UPD"($1, $2, $3)`, [userId, productId, qty]);
  return rowCount !== null && rowCount > 0;
}

export async function uploadTransactionSlip(imageURL: string, orderId: number) {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_TRANS_SLIP_UPD"($1, $2)`, [imageURL, orderId]);
  return rowCount !== null && rowCount > 0;
}

export async function getProductDetail(productId: number) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_PRODUCT_DETAIL_GET"($1)`, [productId]);
  return rows[0];
}

export async function addOrderTransaction(userId: number, payload: PlaceOrderRequestBody) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_INS"($1, $2, $3, $4, $5)`, [
    userId, 
    payload.addressId, 
    payload.paymentMethod, 
    payload.totalPrice, 
    JSON.stringify(payload.cartItems)
  ]);
  return rows[0];
}