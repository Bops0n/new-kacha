import { poolQuery, pool } from '@/app/api/lib/db';
import { Order, OrderProductDetail } from '@/types';

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
    const sql = `
        SELECT
            o."Order_ID", o."User_ID", o."Order_Date", o."Status", o."Payment_Type",
            o."Invoice_ID", o."Address_ID", o."DeliveryDate", o."Tracking_ID", o."Shipping_Carrier",
            o."Transfer_Slip_Image_URL", o."Cancellation_Reason", o."Address", o."Phone",
            o."Total_Amount",
            u."Full_Name" AS "UserFullName",
            od."Product_ID", od."Quantity", od."Product_Sale_Cost", od."Product_Sale_Price",
            od."Product_Name", od."Product_Brand", od."Product_Unit", od."Product_Image_URL",
            od."Product_Discount_Price"
        FROM
            public."Order" AS o
        LEFT JOIN
            public."User" AS u ON o."User_ID" = u."User_ID"
        LEFT JOIN
            public."Order_Detail" AS od ON o."Order_ID" = od."Order_ID"
        ${orderId ? 'WHERE o."Order_ID" = $1' : ''}
        ORDER BY 
            o."Order_ID" DESC, od."Product_ID" ASC;
    `;
    const queryParams = orderId ? [orderId] : [];
    const result = await poolQuery(sql, queryParams);
    
    if (orderId && result.rows.length === 0) {
        throw new Error('Order not found');
    }
    return mapDbRowsToUiOrder(result.rows);
}

/**
 * อัปเดตข้อมูลคำสั่งซื้อ
 * @param payload ข้อมูลที่ต้องการอัปเดต
 * @returns ข้อมูล Order ที่ถูกอัปเดตแล้ว
 */
export async function updateOrder(payload: Partial<Order>): Promise<Order> {
    const { Order_ID, ...fieldsToUpdate } = payload;

    if (!Order_ID) {
        throw new Error("Order_ID is required for update.");
    }
    const allowedOrderColumns = [ 'Status', 'DeliveryDate', 'Tracking_ID', 'Shipping_Carrier', 'Cancellation_Reason' ];
    const updateEntries = Object.entries(fieldsToUpdate).filter(([key, value]) => allowedOrderColumns.includes(key) && value !== undefined);
    
    if (updateEntries.length === 0) {
        throw new Error("No valid fields provided for update.");
    }
    
    const setClause = updateEntries.map(([key, value], index) => `"${key}" = $${index + 1}`).join(', ');
    const queryParams = updateEntries.map(([key, value]) => value);
    queryParams.push(Order_ID);

    const sql = `UPDATE public."Order" SET ${setClause} WHERE "Order_ID" = $${queryParams.length} RETURNING *`;
    const result = await poolQuery(sql, queryParams);

    if (result.rowCount === 0) {
        throw new Error(`Order with ID ${Order_ID} not found.`);
    }
    return result.rows[0];
}

/**
 * ลบคำสั่งซื้อและรายละเอียดที่เกี่ยวข้อง
 * @param orderId ID ของคำสั่งซื้อที่ต้องการลบ
 */
export async function deleteOrder(orderId: number): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM public."Order_Detail" WHERE "Order_ID" = $1', [orderId]);
        const result = await client.query('DELETE FROM public."Order" WHERE "Order_ID" = $1', [orderId]);
        await client.query('COMMIT');

        if (result.rowCount === 0) {
            throw new Error(`Order with ID ${orderId} not found.`);
        }
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}