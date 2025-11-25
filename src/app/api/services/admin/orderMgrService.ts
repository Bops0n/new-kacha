import { poolQuery } from '@/app/api/lib/db';
import { Order } from '@/types';
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

export async function uploadRefundSlip(imageURL: string, orderId: number, userId: number) {
  const { rowCount } = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_REFUND_SLIP_UPD"($1, $2, $3)`, [imageURL, orderId, userId]);
  return rowCount > 0;
}