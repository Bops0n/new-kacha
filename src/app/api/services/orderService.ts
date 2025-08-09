import { poolQuery } from '@/app/api/lib/db';
import { Order } from '@/types';

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
                Shipping_Address_ID: row.Address_ID, // Use Address_ID from Order table
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

    return Array.from(ordersMap.values());
};

// Base SQL Query with corrected column names
const BASE_ORDER_QUERY = `
    SELECT
        o."Order_ID", o."User_ID", o."Order_Date", o."Total_Amount", o."Status",
        o."Payment_Type", o."Invoice_ID", o."Address_ID", o."DeliveryDate",
        o."Tracking_ID", o."Shipping_Carrier", o."Transfer_Slip_Image_URL",
        o."Cancellation_Reason", o."Address", o."Phone",
        od."Product_ID", od."Quantity", od."Product_Sale_Cost", od."Product_Sale_Price",
        od."Product_Name", od."Product_Brand", od."Product_Unit", od."Product_Image_URL",
        od."Product_Discount_Price",
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
 * Optional userId can be provided for an authorization check.
 */
export async function getOrderById(orderId: number, userId?: number): Promise<Order | null> {
    let sql = `${BASE_ORDER_QUERY} WHERE o."Order_ID" = $1`;
    const params: (number | string)[] = [orderId];

    if (userId) {
        sql += ` AND o."User_ID" = $2`;
        params.push(userId);
    }
    
    const result = await poolQuery(sql, params);
    if (result.rows.length === 0) {
        if (userId) {
            const ownerCheck = await poolQuery('SELECT "Order_ID" FROM "Order" WHERE "Order_ID" = $1', [orderId]);
            if (ownerCheck.rowCount > 0) throw new Error('Access denied');
        }
        return null;
    }
    
    const orders = mapDbRowsToOrders(result.rows);
    return orders[0] || null;
}