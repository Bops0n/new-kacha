import { poolQuery } from '@/app/api/lib/db';
import { mapDbRowsToOrders, Order } from '@/types';

export async function getOrderById(orderId: number): Promise<Order | null> {    
    const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_GET"($1, $2)`, ["Order_ID", orderId]);
    const orders = mapDbRowsToOrders(rows);
    return orders[0] || null;
}

export async function cancelOrder(orderId: number, userId: number, reason: string) {
  const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_CANCEL_UPD"($1, $2, $3)`, [orderId, userId, reason]);
  return rows[0];
}

export async function confirmReceiveOrder(orderId: number, userId: number) {
    const { rows } = await poolQuery(
        `SELECT * FROM "SP_USER_ORDER_CONFIRM_RECEIVE_UPD"($1, $2)`,
        [orderId, userId]
    );
    return rows[0];
}