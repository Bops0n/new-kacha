import { poolQuery } from '@/app/api/lib/db';
import { mapDbRowsToOrders } from '@/app/utils/server';
import { Order } from '@/types';

export async function getOrderById(orderId: number): Promise<Order | null> {    
    const { rows } = await poolQuery(`SELECT * FROM "SP_USER_ORDER_ORDID_GET"($1)`, [orderId]);
    const orders = mapDbRowsToOrders(rows);
    return orders[0] || null;
}