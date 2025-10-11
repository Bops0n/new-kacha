import { poolQuery, pool } from '@/app/api/lib/db';
import { Order, OrderStatus } from '@/types';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../auth/utils';
import { checkRequire } from '@/app/utils/client';

// Helper: แปลงข้อมูลจาก Database Row เป็น Order Object ที่ Frontend ต้องการ
const mapDbRowsToUiOrder = (dbRows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Order_Date: row.Order_Date,
                Status: row.Status,
                Payment_Type: row.Payment_Type,
                Invoice_ID: row.Invoice_ID,
                Shipping_Address_ID: row.Address_ID,
                DeliveryDate: row.DeliveryDate,
                Tracking_ID: row.Tracking_ID,
                Shipping_Carrier: row.Shipping_Carrier,
                Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL,
                Cancellation_Reason: row.Cancellation_Reason,
                Address: row.Address,
                Phone: row.Phone,
                Total_Amount: parseFloat(row.Total_Amount),
                Customer_Name: row.User_FullName || 'N/A',
                Email: row.User_Email || null,
                Products: [],
                Action: {
                    Order_ID: -1,
                    Status: 'pending',
                    Update_By: -1,
                    Update_Name: 'N/A',
                    Update_Date: 'N/A',
                }
            });
        }

        const currentOrder = ordersMap.get(orderId)!;

        if (row.Product_ID) {
            const salePrice = parseFloat(row.Product_Sale_Price);
            const discountPrice = row.Product_Discount_Price ? parseFloat(row.Product_Discount_Price) : null;
            const quantity = parseInt(row.Quantity, 10);
            const pricePaidPerItem = discountPrice ?? salePrice;

            currentOrder.Products.push({
                Product_ID: row.Product_ID,
                Quantity: quantity,
                Product_Sale_Cost: parseFloat(row.Product_Sale_Cost),
                Product_Sale_Price: salePrice,
                Product_Name: row.Product_Name,
                Product_Brand: row.Product_Brand,
                Product_Unit: row.Product_Unit,
                Product_Image_URL: row.Product_Image_URL,
                Product_Discount_Price: discountPrice,
                Price_Paid_Per_Item: pricePaidPerItem,
                Subtotal: pricePaidPerItem * quantity,
            });
        }
        
        if (row.OA_Order_ID) {
            currentOrder.Action.Order_ID = row.OA_Order_ID;
            currentOrder.Action.Status = row.OA_Status;
            currentOrder.Action.Update_By = row.OA_Update_By;
            currentOrder.Action.Update_Name = row.OA_Update_Name;
            currentOrder.Action.Update_Date = row.OA_Update_Date;
        }
    });
    return Array.from(ordersMap.values()).sort((a, b) => b.Order_ID - a.Order_ID);
};

/**
 * ดึงข้อมูลคำสั่งซื้อทั้งหมด หรือเฉพาะเจาะจงตาม ID
 * @param orderId (Optional) ID ของคำสั่งซื้อที่ต้องการ
 * @returns Array ของ Order object
 */
export async function getOrders(orderId: number | null): Promise<Order[]> {
    const result = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_GET"($1)`, [orderId]);
    
    if (orderId && result.rows.length === 0) {
        throw new Error('Order not found');
    }
    
    return mapDbRowsToUiOrder(result.rows);
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
export async function deleteOrder(orderId: number, UserID: number): Promise<void> {
    const result = await poolQuery(`SELECT * FROM "SP_ADMIN_ORDER_DEL"($1, $2)`, [orderId, UserID]);
        
    if (result.rowCount === 0) {
        throw new Error(`Order with ID ${orderId} not found.`);
    }
}