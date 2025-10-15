import { poolQuery } from '@/app/api/lib/db';
import { Order } from '@/types';
import { authenticateRequest } from '../../auth/utils';
import { checkRequire } from '@/app/utils/client';
import { mapDbRowsToOrders } from '@/app/utils/server';

/**
 * ดึงข้อมูลคำสั่งซื้อทั้งหมด หรือเฉพาะเจาะจงตาม ID
 * @param orderId (Optional) ID ของคำสั่งซื้อที่ต้องการ
 * @returns Array ของ Order object
 */
export async function getOrders(orderId: number | null): Promise<Order[]> {
    const { rows } = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_GET"($1)`, [orderId]);
    
    if (orderId && rows.length === 0) {
        throw new Error('Order not found');
    }
    
    return mapDbRowsToOrders(rows);
}

/**
 * อัปเดตข้อมูลคำสั่งซื้อ และคืนสต็อกหากมีการยกเลิก
 * @param payload ข้อมูลที่ต้องการอัปเดต, ต้องมี Order_ID
 * @returns ข้อมูล Order ที่ถูกอัปเดตแล้ว
 */
export async function updateOrder(payload: Partial<Order>): Promise<Order> {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { Order_ID, Status, ...otherFields } = payload;

    if (!Order_ID) {
        throw new Error("Order_ID is required for an update.");
    }

    const fieldsToUpdate: { [key: string]: any } = {};
    if (Status) fieldsToUpdate.Status = Status;
    Object.assign(fieldsToUpdate, otherFields);

    const orderUpdateResult = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_UPD"($1, $2, $3)`, 
        [Order_ID, JSON.stringify(fieldsToUpdate), auth.userId]);

    if (orderUpdateResult.rowCount === 0) {
        throw new Error(`Order with ID ${Order_ID} not found.`);
    }
    
    return orderUpdateResult.rows[0];
}


/**
 * ลบคำสั่งซื้อและรายละเอียดที่เกี่ยวข้อง
 * @param orderId ID ของคำสั่งซื้อที่ต้องการลบ
 */
export async function deleteOrder(orderId: number, UserID: number) {
    const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_DEL"($1, $2)`, [orderId, UserID]);
    return rowCount > 0;
}