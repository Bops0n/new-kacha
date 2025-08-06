// app/api/admin/order/route.ts
// This file defines the API routes for managing orders under the /api/admin/order path,
// adapted for a normalized RDB schema.

import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db'; // Adjusted path for new route location
import { Order, OrderProductDetail } from '../../../../types/types'; // Import Order and OrderProductDetail

// Define interfaces that map to your database tables and the combined UI structure
interface DbOrder {
    Order_ID: number;
    User_ID: number;
    Order_Date: string; // DATE type in DB, string in TS
    Status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // PascalCase
    Payment_Type: string;
    Invoice_ID: string | null;
    Address_ID: number; // PascalCase, re-added
    DeliveryDate: string | null; // PascalCase
    TrackingId: string | null; // PascalCase
    ShippingCarrier: string | null; // PascalCase
    TransferSlipImageUrl: string | null; // PascalCase
    CancellationReason: string | null; // PascalCase
    Address: string | null; // PascalCase
    Phone: string | null; // PascalCase, re-added
    Total_Amount: number | null; // Added Total_Amount to DB schema interface
}

interface DbOrderDetail {
    Order_ID: number;
    Product_ID: number;
    Quantity: number;
    Price: number; // Price from Order_Detail is numeric(10,2)
    Discount: number; // Discount from Order_Detail is numeric(10,2)
    Product_Name: string; // Snapshotted product name
    Product_Brand: string | null; // Snapshotted product brand
    Product_Unit: string; // Snapshotted product unit
    Product_Image_URL: string | null; // Snapshotted product image URL
}

interface DbProduct {
    Product_ID: number;
    Name: string; // Assuming Product.Name for order details
}

// Assuming these schemas for User table
interface DbUser {
    User_ID: number;
    Full_Name: string; // Used for customerName
    Email: string | null; // Used for email
}

/**
 * Helper function to map database rows to the Order interface.
 * This aggregates order details and calculates total.
 */
const mapDbOrderToUiOrder = (dbOrders: any[]): Order[] => {
    // Group order details by Order_ID
    const ordersMap = new Map<number, Order>();

    dbOrders.forEach(row => {
        const orderId = row.Order_ID;

        if (!ordersMap.has(orderId)) {
            // Initialize new order if not already in map
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Customer_Name: row.UserFullName || 'N/A', // Pulled from User table
                Email: row.UserEmail || null,       // Pulled from User table
                Phone: row.Phone || null,           // Pulled from Order.Phone
                Products: [], // Initialize empty products array
                Total_Amount: parseFloat(row.Total_Amount), // Directly use Total_Amount from DB
                Status: row.Status,
                Order_Date: row.Order_Date,
                DeliveryDate: row.DeliveryDate || null,
                Address: row.Address || 'N/A',
                Shipping_Address_ID: row.Address_ID,
                Tracking_ID: row.Tracking_ID || null, // Use Tracking_ID from DB
                Shipping_Carrier: row.Shipping_Carrier || null, // Use Shipping_Carrier from DB
                Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL || null, // Use Transfer_Slip_Image_URL from DB
                Cancellation_Reason: row.Cancellation_Reason || null, // Use Cancellation_Reason from DB
                Payment_Type: row.Payment_Type,
                Invoice_ID: row.Invoice_ID || null,
            });
        }

        const currentOrder = ordersMap.get(orderId)!;

        // Add product detail if available (an order might exist without products if badly formed, but unlikely)
        if (row.Product_ID) { // Check if product detail exists for this row
            const productPrice = parseFloat(row.Price);
            const productDiscount = parseFloat(row.Discount);
            const productQuantity = row.Quantity;
            const itemSubtotal = (productPrice * productQuantity) - productDiscount;

            currentOrder.Products.push({
                Product_ID: row.Product_ID,
                Product_Name: row.ProductName,
                Product_Brand: row.ProductBrand,
                Product_Unit: row.ProductUnit,
                Product_Image_URL: row.ProductImageUrl,
                Quantity: productQuantity,
                Price: productPrice,
                Discount: productDiscount,
                Subtotal: itemSubtotal,
            });
            // Total_Amount is now directly from DB, no longer accumulated here
        }
    });

    // Sort products within each order for consistent display (optional)
    ordersMap.forEach(order => {
        order.Products.sort((a, b) => a.Product_Name.localeCompare(b.Product_Name));
    });


    return Array.from(ordersMap.values()).sort((a, b) => {
        // Sort by orderDate descending, then by Order_ID ascending
        if (a.Order_Date < b.Order_Date) return 1;
        if (a.Order_Date > b.Order_Date) return -1;
        return a.Order_ID - b.Order_ID;
    });
};


/**
 * GET handler to fetch orders with all relevant details from joined tables.
 * Can fetch all orders or a specific order by ID.
 * Example: GET /api/admin/order -> fetches all orders
 * Example: GET /api/admin/order?id=123 -> fetches order with Order_ID 123
 */
export async function GET(req: NextRequest) {
    // Optional: Implement server-side session check for authorization
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const orderId = req.nextUrl.searchParams.get('id');

    let sql: string;
    let queryParams: (string | number)[] = [];

    // Complex JOIN query to get all necessary data
    sql = `
        SELECT
            o."Order_ID",
            o."User_ID",
            o."Order_Date",
            o."Status",
            o."Payment_Type",
            o."Invoice_ID",
            o."Address_ID",
            o."DeliveryDate",
            o."Tracking_ID", -- Selected with underscore
            o."Shipping_Carrier", -- Selected with underscore
            o."Transfer_Slip_Image_URL", -- Selected with underscore
            o."Cancellation_Reason", -- Selected with underscore
            o."Address",
            o."Phone",
            o."Total_Amount", -- Selected Total_Amount from DB
            od."Product_ID",
            od."Quantity",
            od."Price",
            od."Discount",
            od."Product_Name" AS "ProductName",
            od."Product_Brand" AS "ProductBrand",
            od."Product_Unit" AS "ProductUnit",
            od."Product_Image_URL" AS "ProductImageUrl",
            u."Full_Name" AS "UserFullName",
            u."Email" AS "UserEmail"
        FROM
            public."Order" AS o
        LEFT JOIN
            public."Order_Detail" AS od ON o."Order_ID" = od."Order_ID"
        LEFT JOIN
            public."User" AS u ON o."User_ID" = u."User_ID"
    `;

    if (orderId) {
        sql += ` WHERE o."Order_ID" = $1`;
        queryParams.push(parseInt(orderId, 10)); // Ensure ID is parsed as integer
    }

    sql += ` ORDER BY o."Order_ID" DESC, od."Product_ID" ASC;`; // Order to help aggregation

    try {
        const result = await poolQuery(sql, queryParams);
        const ordersUI = mapDbOrderToUiOrder(result.rows);

        if (orderId && ordersUI.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ orders: ordersUI }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error fetching orders:", dbError);
        return NextResponse.json({ message: "Failed to fetch orders", error: dbError.message }, { status: 500 });
    }
}

/**
 * PATCH handler to update an existing order.
 * Only updates fields directly in the public."Order" table.
 * Does NOT handle Order_Detail updates.
 */
export async function PATCH(req: NextRequest) {
    // Optional: Implement server-side session check for authorization
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let updatedOrderData: Partial<Order>; // Use Order interface for incoming data
    try {
        updatedOrderData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    if (typeof updatedOrderData.Order_ID === 'undefined' || updatedOrderData.Order_ID === null) {
        return NextResponse.json({ message: "Order 'Order_ID' is required for update." }, { status: 400 });
    }

    const orderIdToUpdate = updatedOrderData.Order_ID;
    const updateColumns: string[] = [];
    const queryParams: (string | number | null)[] = [];
    let paramIndex = 1;

    // Map UI field names (PascalCase from frontend) to DB column names (PascalCase)
    // Adjusted fieldMap to use PascalCase with underscores for DB column names
    const fieldMap: { [key: string]: string } = {
        Status: 'Status',
        DeliveryDate: 'DeliveryDate',
        Tracking_ID: 'Tracking_ID', // Matched to new DB column name
        Shipping_Carrier: 'Shipping_Carrier', // Matched to new DB column name
        Transfer_Slip_Image_URL: 'Transfer_Slip_Image_URL', // Matched to new DB column name
        Cancellation_Reason: 'Cancellation_Reason', // Matched to new DB column name
        Address: 'Address',
        Phone: 'Phone',
        Shipping_Address_ID: 'Address_ID',
        // Total_Amount is removed from fieldMap to prevent direct updates
        // Total_Amount: 'Total_Amount', // Removed from fieldMap
    };

    for (const uiKey in updatedOrderData) {
        if (Object.prototype.hasOwnProperty.call(updatedOrderData, uiKey) &&
            updatedOrderData[uiKey as keyof Partial<Order>] !== undefined &&
            fieldMap[uiKey]) { // Only include fields that are mapped and present
            
            const dbColumn = fieldMap[uiKey];
            let valueToSet: any = updatedOrderData[uiKey as keyof Partial<Order>];

            // Handle empty strings for nullable text/date fields (should become NULL in DB)
            if (typeof valueToSet === 'string' && valueToSet.trim() === '') {
                valueToSet = null;
            }

            updateColumns.push(`"${dbColumn}" = $${paramIndex}`);
            queryParams.push(valueToSet);
            paramIndex++;
        }
    }

    if (updateColumns.length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }

    queryParams.push(orderIdToUpdate); // Add the Order_ID for the WHERE clause
    const sql = `
        UPDATE public."Order"
        SET ${updateColumns.join(', ')}
        WHERE "Order_ID" = $${paramIndex};
    `;

    try {
        const result = await poolQuery(sql, queryParams);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Order with ID ${orderIdToUpdate} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Order ID ${orderIdToUpdate} updated successfully.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error updating order:", dbError);
        return NextResponse.json({ message: "Failed to update order.", error: dbError.message }, { status: 500 });
    }
}

/**
 * DELETE handler to delete an order.
 * Expects 'id' (Order_ID) as a query parameter.
 * Example: DELETE /api/admin/order?id=123
 * This will also cascade delete associated Order_Detail records due to FK constraint.
 */
export async function DELETE(req: NextRequest) {
    // Optional: Implement server-side session check for authorization
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const orderIdToDelete = req.nextUrl.searchParams.get('id');

    if (!orderIdToDelete || orderIdToDelete.trim() === '') {
        return NextResponse.json({ message: "Order 'id' is required as a query parameter for deleting an order." }, { status: 400 });
    }

    const parsedOrderId = parseInt(orderIdToDelete, 10);
    if (isNaN(parsedOrderId)) {
        return NextResponse.json({ message: "Invalid Order ID provided. Must be a number." }, { status: 400 });
    }

    // Step 1: Check the User_ID of the order before attempting deletion
    const checkUserSql = `SELECT "User_ID" FROM public."Order" WHERE "Order_ID" = $1;`;
    let orderUserId: number | null = null;

    try {
        const checkResult = await poolQuery(checkUserSql, [parsedOrderId]);
        if (checkResult.rows.length === 0) {
            // Order not found, return 404
            return NextResponse.json({ message: `Order with ID ${parsedOrderId} not found.` }, { status: 404 });
        }
        orderUserId = checkResult.rows[0].User_ID;
    } catch (dbError: any) {
        console.error("Error checking order user ID:", dbError);
        return NextResponse.json({ message: "Failed to verify order user ID for deletion.", error: dbError.message }, { status: 500 });
    }

    // Step 2: Apply the deletion condition based on orderUserId
    // If orderUserId is between 101 and 105 (inclusive), prevent deletion.
    if (orderUserId !== null && orderUserId >= 101 && orderUserId <= 105) {
        return NextResponse.json({ message: `Order ID ${parsedOrderId} cannot be deleted. It belongs to a protected user (ID: ${orderUserId}).` }, { status: 403 }); // 403 Forbidden
    }

    // Step 3: Proceed with deletion if the condition is met
    const deleteSql = `DELETE FROM public."Order" WHERE "Order_ID" = $1;`;

    try {
        const result = await poolQuery(deleteSql, [parsedOrderId]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Failed to delete order ID ${parsedOrderId}.` }, { status: 500 });
        }
        return NextResponse.json({ message: `Order ID ${parsedOrderId} deleted successfully. Associated order details have also been removed.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error deleting order:", dbError);
        return NextResponse.json({ message: "Failed to delete order.", error: dbError.message }, { status: 500 });
    }
}