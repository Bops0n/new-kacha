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

/**
 * Fetches a single order by its ID.
 * Optional userId can be provided for an authorization check.
 */
export async function getOrderById(orderId: number, userId?: number): Promise<Order | null> {    
    const result = await poolQuery(`SELECT * FROM "SP_USER_ORDER_GET"($1, $2)`, [orderId, userId]);
    const orders = mapDbRowsToOrders(result.rows);
    return orders[0] || null;
}