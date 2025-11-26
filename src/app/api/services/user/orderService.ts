import { poolQuery } from '@/app/api/lib/db';
import { mapDbRowsToOrders } from '@/app/utils/server';
import { Order } from '@/types';

export async function getOrderById(orderId: number): Promise<Order | null> {    
    const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_GET"($1, $2)`, ["Order_ID", orderId]);
    const orders = mapDbRowsToOrders(rows);
    return orders[0] || null;
}
export async function cancelOrder(orderId: number, userId: number, reason: string) {
  const { rows } = await poolQuery(
      `SELECT * FROM "SP_USER_ORDER_CANCEL"($1, $2, $3)`, 
      [orderId, userId, reason]
  );
  return rows[0]; // จะคืนค่า { Status_Code: 200, Message: '...' }
}
export async function confirmReceiveOrder(orderId: number, userId: number) {
    // เรียกใช้ SQL Function ที่เพิ่งสร้าง
    const { rows } = await poolQuery(
        `SELECT * FROM "SP_USER_ORDER_CONFIRM_RECEIVE_UPD"($1, $2)`,
        [orderId, userId]
    );
    
    // คืนค่า True ถ้า Status Code เป็น 200
    return rows[0]?.Status_Code === 200;
}