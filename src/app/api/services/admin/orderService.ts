import { poolQuery, pool } from '@/app/api/lib/db';
import { Order, OrderStatus } from '@/types';

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
                Address_ID: row.Address_ID,
                DeliveryDate: row.DeliveryDate,
                Tracking_ID: row.Tracking_ID,
                Shipping_Carrier: row.Shipping_Carrier,
                Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL,
                Cancellation_Reason: row.Cancellation_Reason,
                Address: row.Address,
                Phone: row.Phone,
                Total_Amount: parseFloat(row.Total_Amount),
                Customer_Name: row.UserFullName || 'N/A',
                Products: [],
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
    const { Order_ID, Status, ...otherFields } = payload;
    console.log(payload)

    if (!Order_ID) {
        throw new Error("Order_ID is required for an update.");
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Step 1: Update the order status and other details
        const allowedOrderColumns = ['Status', 'DeliveryDate', 'Tracking_ID', 'Shipping_Carrier', 'Cancellation_Reason'];
        
        // We create a new object to avoid mutating the original payload
        const fieldsToUpdate: { [key: string]: any } = {};
        if (Status) fieldsToUpdate.Status = Status;
        Object.assign(fieldsToUpdate, otherFields);

        const updateEntries = Object.entries(fieldsToUpdate)
            .filter(([key, value]) => allowedOrderColumns.includes(key) && value !== undefined);

        if (updateEntries.length === 0) {
            throw new Error("No valid fields provided for update.");
        }

        const setClause = updateEntries.map(([key], value) => `"${key}" = '${value}'`).join(', ');
        
        const orderUpdateResult = await client.query(`SELECT * FROM "SP_ADMIN_ORDER_UPD"($1, $2)`, Order_ID, setClause);

        if (orderUpdateResult.rowCount === 0) {
            throw new Error(`Order with ID ${Order_ID} not found.`);
        }

        await client.query('COMMIT');
        return orderUpdateResult.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to update order ${Order_ID}:`, error);
        // Re-throw a more specific error to be caught by the API route
        if (error instanceof Error) {
            throw new Error(`Database error while updating order: ${error.message}`);
        }
        throw new Error('An unknown error occurred during order update.');
    } finally {
        client.release();
    }
}


/**
 * ลบคำสั่งซื้อและรายละเอียดที่เกี่ยวข้อง
 * @param orderId ID ของคำสั่งซื้อที่ต้องการลบ
 */
export async function deleteOrder(orderId: number, UserID: number): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(`SELECT * FROM "SP_ADMIN_ORDER_DEL"($1, $2)`, orderId, UserID);
        
        if (result.rowCount === 0) {
            throw new Error(`Order with ID ${orderId} not found.`);
        }
        
        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        // Log and re-throw the error to be handled by the calling API route
        console.error(`Failed to delete order ${orderId}:`, error);
        if (error instanceof Error) {
            throw new Error(`Database error while deleting order: ${error.message}`);
        }
        throw new Error('An unknown error occurred during order deletion.');
    } finally {
        client.release();
    }
}