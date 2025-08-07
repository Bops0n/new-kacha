import { poolQuery } from '@/app/api/lib/db';
import { Order, FullCategoryPath, OrderProductDetail } from '@/types';

// Helper function to map database rows to the Order UI model.
const mapDbRowsToOrders = (rows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    rows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Customer_Name: row.UserFullName || 'N/A',
                Email: row.UserEmail || null,
                Phone: row.Phone,
                Products: [],
                Total_Amount: parseFloat(row.Total_Amount),
                Status: row.Status,
                Order_Date: row.Order_Date,
                DeliveryDate: row.DeliveryDate,
                Address: row.Address,
                Shipping_Address_ID: row.Address_ID,
                Tracking_ID: row.Tracking_ID,
                Shipping_Carrier: row.Shipping_Carrier,
                Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL,
                Cancellation_Reason: row.Cancellation_Reason,
                Payment_Type: row.Payment_Type,
                Invoice_ID: row.Invoice_ID,
            });
        }

        const currentOrder = ordersMap.get(orderId)!;
        if (row.Product_ID) {
            currentOrder.Products.push({
                Product_ID: row.Product_ID,
                Product_Name: row.ProductName,
                Product_Brand: row.ProductBrand,
                Product_Unit: row.ProductUnit,
                Product_Image_URL: row.ProductImageUrl,
                Quantity: row.Quantity,
                Price: parseFloat(row.Price),
                Discount: parseFloat(row.Discount || 0),
                Subtotal: (row.Quantity * parseFloat(row.Price)) - parseFloat(row.Discount || 0),
            });
        }
    });

    return Array.from(ordersMap.values());
};

const BASE_ORDER_QUERY = `
    SELECT
        o."Order_ID", o."User_ID", o."Order_Date", o."Total_Amount", o."Status",
        o."Payment_Type", o."Invoice_ID", o."Address_ID", o."DeliveryDate",
        o."Tracking_ID", o."Shipping_Carrier", o."Transfer_Slip_Image_URL",
        o."Cancellation_Reason", o."Address", o."Phone",
        od."Product_ID", od."Quantity", od."Price", od."Discount",
        od."Product_Name" AS "ProductName", od."Product_Brand" AS "ProductBrand",
        od."Product_Unit" AS "ProductUnit", od."Product_Image_URL" AS "ProductImageUrl",
        u."Full_Name" AS "UserFullName", u."Email" AS "UserEmail"
    FROM
        public."Order" AS o
    LEFT JOIN
        public."Order_Detail" AS od ON o."Order_ID" = od."Order_ID"
    LEFT JOIN
        public."User" AS u ON o."User_ID" = u."User_ID"
`;

/**
 * Fetches a single order by its ID.
 * Optional userId can be provided for an authorization check to ensure the user owns the order.
 * @returns {Promise<Order | null>} The found order or null.
 */
export async function getOrderById(orderId: number, userId?: number): Promise<Order | null> {
    let sql = `${BASE_ORDER_QUERY} WHERE o."Order_ID" = $1`;
    const params: (number | string)[] = [orderId];

    if (userId) {
        sql += ` AND o."User_ID" = $2`;
        params.push(userId);
    }
    
    sql += ` ORDER BY od."Product_ID" ASC;`;
    
    const result = await poolQuery(sql, params);
    if (result.rows.length === 0) {
        // If no rows, check if the order exists but belongs to another user (if userId is provided)
        if (userId) {
            const ownerCheck = await poolQuery('SELECT "Order_ID" FROM "Order" WHERE "Order_ID" = $1', [orderId]);
            if (ownerCheck.rowCount > 0) {
                // The order exists, but doesn't belong to this user. Throw an error to indicate this.
                throw new Error('Access denied');
            }
        }
        return null; // Order truly does not exist
    }
    
    const orders = mapDbRowsToOrders(result.rows);
    return orders[0] || null;
}