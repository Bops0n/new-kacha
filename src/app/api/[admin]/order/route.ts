// app/api/admin/order/route.ts
// This file defines the API routes for managing orders under the /api/admin/order path,
// adapted for a normalized RDB schema.

import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db'; // Adjusted path for new route location

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
}

interface DbOrderDetail {
    Order_ID: number;
    Product_ID: number;
    Quantity: number;
    Price: number; // Price from Order_Detail is numeric(10,2)
    Discount: number; // Discount from Order_Detail is numeric(10,2)
}

interface DbProduct {
    Product_ID: number;
    Name: string; // Assuming Product.Name for order details
}

// Assuming these schemas for User table
interface DbUser {
    User_ID: number;
    FullName: string; // Used for customerName
    Email: string | null; // Used for email
}

// Interface for the combined Order data sent to the UI
// This is the shape the frontend `Order` interface should match.
interface OrderUI {
    id: number; // Maps to Order_ID
    userId: number; // Added userId for UI display
    customerName: string; // From User.FullName
    email: string | null; // From User.Email
    phone: string | null; // From Order.Phone (snapshot)
    products: Array<{ name: string; quantity: number; price: number; discount: number }>; // Detailed products
    total: number; // Calculated total
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // Maps to Status from DB
    orderDate: string;
    deliveryDate: string | null; // From Order.DeliveryDate
    address: string; // From Order.Address (snapshot)
    addressId: number; // From Order.Address_ID
    trackingId: string | null; // From Order.TrackingId
    shippingCarrier: string | null; // From Order.ShippingCarrier
    transferSlipImageUrl: string | null; // From Order.TransferSlipImageUrl
    cancellationReason: string | null; // From Order.CancellationReason
    paymentType: string; // From DB (Payment_Type)
    invoiceId: string | null; // From DB (Invoice_ID)
}


/**
 * Helper function to map database rows to the OrderUI interface.
 * This aggregates order details and calculates total.
 */
const mapDbOrderToUiOrder = (dbOrders: any[]): OrderUI[] => {
    // Group order details by Order_ID
    const ordersMap = new Map<number, OrderUI>();

    dbOrders.forEach(row => {
        const orderId = row.Order_ID;

        if (!ordersMap.has(orderId)) {
            // Initialize new order if not already in map
            ordersMap.set(orderId, {
                id: row.Order_ID,
                userId: row.User_ID, // Map User_ID from DB to userId in UI
                customerName: row.UserName || 'N/A', // Pulled from User table
                email: row.UserEmail || null,       // Pulled from User table
                phone: row.Phone || null,           // Pulled from Order.Phone
                products: [], // Initialize empty products array
                total: 0, // Initialize total
                status: row.Status, // Map DB 'Status' to UI 'status'
                orderDate: row.Order_Date,
                deliveryDate: row.DeliveryDate || null, // Map from DeliveryDate
                address: row.Address || 'N/A', // Map from Address
                addressId: row.Address_ID, // Map from Address_ID
                trackingId: row.TrackingId || null, // Map from TrackingId
                shippingCarrier: row.ShippingCarrier || null, // Map from ShippingCarrier
                transferSlipImageUrl: row.TransferSlipImageUrl || null, // Map from TransferSlipImageUrl
                cancellationReason: row.CancellationReason || null, // Map from CancellationReason
                paymentType: row.Payment_Type,
                invoiceId: row.Invoice_ID || null,
            });
        }

        const currentOrder = ordersMap.get(orderId)!;

        // Add product detail if available for this row
        if (row.Product_ID) { // Check if product detail exists for this row
            const productPrice = parseFloat(row.Price);
            const productDiscount = parseFloat(row.Discount);
            const productQuantity = row.Quantity;
            const itemTotal = (productPrice * productQuantity) - productDiscount;

            currentOrder.products.push({
                name: row.ProductName, // From Product table
                quantity: productQuantity,
                price: productPrice,
                discount: productDiscount,
            });
            currentOrder.total += itemTotal; // Accumulate total
        }
    });

    // Sort products within each order for consistent display (optional)
    ordersMap.forEach(order => {
        order.products.sort((a, b) => a.name.localeCompare(b.name));
    });


    return Array.from(ordersMap.values()).sort((a, b) => {
        // Sort by orderDate descending, then by Order_ID ascending
        if (a.orderDate < b.orderDate) return 1;
        if (a.orderDate > b.orderDate) return -1;
        return a.id - b.id;
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
            o."Status",                -- Changed to Status (PascalCase)
            o."Payment_Type",
            o."Invoice_ID",
            o."Address_ID",            -- Included Address_ID
            o."DeliveryDate",          -- Included DeliveryDate (PascalCase)
            o."TrackingId",            -- Included TrackingId (PascalCase)
            o."ShippingCarrier",       -- Included ShippingCarrier (PascalCase)
            o."TransferSlipImageUrl",  -- Included TransferSlipImageUrl (PascalCase)
            o."CancellationReason",    -- Included CancellationReason (PascalCase)
            o."Address",               -- Included Address (PascalCase)
            o."Phone",                 -- Included Phone
            od."Product_ID",
            od."Quantity",
            od."Price",
            od."Discount",
            p."Name" AS "ProductName",
            u."Full_Name" AS "UserName",
            u."Email" AS "UserEmail"
        FROM
            public."Order" AS o
        LEFT JOIN
            public."Order_Detail" AS od ON o."Order_ID" = od."Order_ID"
        LEFT JOIN
            public."Product" AS p ON od."Product_ID" = p."Product_ID"
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

    let updatedOrderData: Partial<OrderUI>; // Use OrderUI interface for incoming data
    try {
        updatedOrderData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    if (typeof updatedOrderData.id === 'undefined' || updatedOrderData.id === null) {
        return NextResponse.json({ message: "Order 'id' is required for update." }, { status: 400 });
    }

    const orderIdToUpdate = updatedOrderData.id;
    const updateColumns: string[] = [];
    const queryParams: (string | number | null)[] = [];
    let paramIndex = 1;

    // Map UI field names (camelCase from frontend) to DB column names (PascalCase)
    const fieldMap: { [key: string]: string } = {
        status: 'Status',
        deliveryDate: 'DeliveryDate',
        trackingId: 'TrackingId',
        shippingCarrier: 'ShippingCarrier',
        transferSlipImageUrl: 'TransferSlipImageUrl',
        cancellationReason: 'CancellationReason',
        address: 'Address',
        phone: 'Phone',
        addressId: 'Address_ID', // Map for Address_ID if it were to be updated
        // userId is not typically updated directly from UI in this context
    };

    for (const uiKey in updatedOrderData) {
        if (Object.prototype.hasOwnProperty.call(updatedOrderData, uiKey) &&
            updatedOrderData[uiKey as keyof Partial<OrderUI>] !== undefined &&
            fieldMap[uiKey]) { // Only include fields that are mapped and present
            
            const dbColumn = fieldMap[uiKey];
            let valueToSet: any = updatedOrderData[uiKey as keyof Partial<OrderUI>];

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
