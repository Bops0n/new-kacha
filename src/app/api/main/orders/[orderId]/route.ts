// src/app/api/orders/[orderId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { poolQuery } from '../../../lib/db'; // Adjust this path if your db.js is elsewhere
// Import authenticateRequest from the new utility file
import { authenticateRequest } from '../../../auth/utils'; // <--- UPDATED PATH
import { AccessLevel, Order, OrderProductDetail, OrderStatus } from '../../../../../types/types'; // Adjust path for types.ts
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';


/**
 * GET /api/orders/[orderId]
 * Retrieves detailed information for a specific order, including associated products and shipping address.
 * Includes authentication and authorization:
 * - Regular users (AccessLevel '0') can only view their own orders.
 * - Staff/Admin users (AccessLevel '1' or '9') can view any order.
 * @param {Request} request - The incoming request object.
 * @param {object} context - The context object containing dynamic route parameters.
 * @param {object} context.params - The dynamic route parameters.
 * @param {string} context.params.orderId - The ID of the order to retrieve.
 * @returns {NextResponse} - JSON response containing order details or an error message.
 */
export async function GET(request: Request, context: { params: { orderId: string } }) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response;
    }
    const userId = auth.userId as number;
    const accessLevel = auth.accessLevel as AccessLevel;
    
    const orderId = parseInt(await context.params.orderId);

    console.log(context.params)
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Invalid Order ID', error: true }, { status: 400 });
    }

    try {
        let query = `
            SELECT
                o."Order_ID",
                o."User_ID",
                o."Order_Date",
                o."Total_Amount", -- Add Total_Amount here for GET_SingleOrder
                o."Status",
                o."Address_ID" AS "Shipping_Address_ID",
                o."Payment_Type",
                o."Tracking_ID", -- Corrected column name
                o."Shipping_Carrier", -- Corrected column name
                o."Cancellation_Reason", -- Corrected column name
                o."Transfer_Slip_Image_URL", -- Corrected column name
                o."DeliveryDate",
                o."Invoice_ID",
                o."Address",
                o."Phone",
                od."Product_ID",
                od."Quantity" AS "Product_Quantity_Ordered",
                od."Price" AS "Product_Price_At_Order",
                od."Discount" AS "Product_Discount_At_Order",
                od."Product_Name" ,
                od."Product_Brand" ,
                od."Product_Unit" ,
                od."Product_Image_URL"
            FROM
                "Order" o
            LEFT JOIN
                "Order_Detail" od ON o."Order_ID" = od."Order_ID"
            WHERE
                o."Order_ID" = $1
        `;
        const queryParams: (string | number)[] = [orderId];

        // Authorization logic: Regular users can only see their own orders
        if (accessLevel === '0') {
            query += ` AND o."User_ID" = $2`;
            queryParams.push(userId);
        }

        query += ` ORDER BY od."Product_ID"`; // Ensure consistent grouping for products

        const result = await poolQuery(query, queryParams);
        console.log(result)

        if (result.rows.length === 0) {
            // Differentiate between "not found" and "forbidden" if regular user tries to access another's order
            const checkOrderOwner = await poolQuery(`SELECT "User_ID" FROM "Order" WHERE "Order_ID" = $1`, [orderId]);
            if (checkOrderOwner.rowCount > 0 && accessLevel === '0' && checkOrderOwner.rows[0].User_ID !== userId) {
                return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้', error: true }, { status: 403 });
            }
            return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อd', error: true }, { status: 404 });
        }

        // Process rows to construct a single Order object with nested Products array
        let order: Order | null = null;
        const products: OrderProductDetail[] = []; // Using OrderProductDetail type

        result.rows.forEach((row: any, index: number) => {
            if (index === 0) {
                // Initialize order details from the first row (common for all products)
                order = {
                    Order_ID: row.Order_ID,
                    User_ID: row.User_ID,
                    Customer_Name: row.User_Name || '', // Assuming User_Name might be joined if needed
                    Email: row.User_Email || null,       // Assuming User_Email might be joined if needed
                    Order_Date: new Date(row.Order_Date).toISOString(), // Ensure ISO string for dates
                    Total_Amount: parseFloat(row.Total_Amount),
                    Status: row.Status,
                    Shipping_Address_ID: row.Shipping_Address_ID,
                    Payment_Type: row.Payment_Type,
                    Tracking_ID: row.Tracking_ID, // Use corrected name
                    Shipping_Carrier: row.Shipping_Carrier, // Use corrected name
                    Cancellation_Reason: row.Cancellation_Reason, // Use corrected name
                    Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL, // Use corrected name
                    DeliveryDate: row.DeliveryDate ? new Date(row.DeliveryDate).toISOString() : null,
                    Invoice_ID: row.Invoice_ID,
                    Address: row.Address,
                    Phone: row.Phone,
                    Products: [], // Will be populated next
                };
            }

            // Add product details if available (an order might exist without products if badly formed, but unlikely)
            if (row.Product_ID) {
                products.push({
                    Product_ID: row.Product_ID,
                    Product_Name: row.Product_Name,
                    Quantity: row.Product_Quantity_Ordered,
                    Price: parseFloat(row.Product_Price_At_Order),
                    Product_Image_URL: row.Product_Image_URL,
                    Product_Brand: row.Product_Brand,
                    Product_Unit: row.Product_Unit,
                    Discount: parseFloat(row.Product_Discount_At_Order || 0), // Default to 0 if null
                    Subtotal: parseFloat((row.Product_Quantity_Ordered * row.Product_Price_At_Order) - (row.Product_Discount_At_Order || 0)), // Calculate subtotal
                });
            }
        });

        if (order) {
            order.Products = products;
            return NextResponse.json({ order, error: false }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Failed to construct order details', error: true }, { status: 500 });
        }

    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json({ message: 'Internal server error', error: true }, { status: 500 });
    }
}

/**
 * PATCH /api/orders/[orderId]
 * Updates the transfer slip image URL for a specific order.
 * Includes authentication, authorization, and file validation.
 * @param {NextRequest} request - The incoming request object (expected to contain FormData with 'transferSlip' file).
 * @param {object} context - The context object containing dynamic route parameters.
 * @param {object} context.params - The dynamic route parameters.
 * @param {string} context.params.orderId - The ID of the order to update.
 * @returns {NextResponse} - JSON response containing the updated slip URL or an error message.
 */
export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response;
    }
    const userId = auth.userId as number; // User ID from authenticated session

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
        return NextResponse.json({ message: 'Order ID ไม่ถูกต้อง', error: true }, { status: 400 });
    }

    const formData = await request.formData();
    const transferSlipFile = formData.get('transferSlip') as File | null;

    if (!transferSlipFile) {
        return NextResponse.json({ message: 'ไม่พบไฟล์สลิป', error: true }, { status: 400 });
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedImageTypes.includes(transferSlipFile.type)) {
        return NextResponse.json({ message: 'รองรับเฉพาะไฟล์รูปภาพ JPEG, JPG, และ PNG เท่านั้น', error: true }, { status: 400 });
    }

    if (transferSlipFile.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json({ message: 'ขนาดไฟล์สลิปต้องไม่เกิน 5MB', error: true }, { status: 400 });
    }

    try {
        // Verify order ownership and status
        const orderResult = await poolQuery(
            `SELECT "User_ID", "Status", "Transfer_Slip_Image_URL" FROM "Order" WHERE "Order_ID" = $1`,
            [orderId]
        );

        if (orderResult.rowCount === 0) {
            return NextResponse.json({ message: 'ไม่พบคำสั่งซื้อ', error: true }, { status: 404 });
        }
        const order = orderResult.rows[0];

        // Authorization check: Ensure the current user owns the order
        if (order.User_ID !== userId) {
            return NextResponse.json({ message: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้', error: true }, { status: 403 });
        }

        // Status check: Ensure order is 'pending' before allowing slip upload
        if (order.Status !== 'pending') {
            return NextResponse.json({ message: 'ไม่สามารถอัปโหลด/เปลี่ยนสลิปได้เนื่องจากคำสั่งซื้อไม่อยู่ในสถานะ "รอดำเนินการ"', error: true }, { status: 400 });
        }

        // Read file bytes
        const buffer = await transferSlipFile.arrayBuffer();
        const bytes = Buffer.from(buffer);

        // Generate unique filename and construct file paths
        const filename = `slip-${orderId}-${uuidv4()}${path.extname(transferSlipFile.name)}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips'); // Ensure this directory exists
        await fs.mkdir(uploadDir, { recursive: true }); // Create directory if it doesn't exist
        const filePath = path.join(uploadDir, filename);
        const imageUrl = `/uploads/slips/${filename}`;

        // Write the file to the public directory
        await fs.writeFile(filePath, bytes);

        // Update the order in the database with the new image URL
        await poolQuery(`UPDATE "Order" SET "Transfer_Slip_Image_URL" = $1 WHERE "Order_ID" = $2`, [imageUrl, orderId]);

        // Optionally delete the old slip file if it exists and was stored in our uploads directory
        if (order.Transfer_Slip_Image_URL && order.Transfer_Slip_Image_URL.startsWith('/uploads/slips/')) {
            const oldFilePath = path.join(process.cwd(), 'public', order.Transfer_Slip_Image_URL);
            await fs.rm(oldFilePath, { force: true }); // Use force: true to prevent errors if file doesn't exist
        }

        return NextResponse.json({ message: 'อัปโหลดสลิปสำเร็จ', imageUrl, error: false }, { status: 200 });

    } catch (error) {
        console.error('Error uploading transfer slip:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป', error: true }, { status: 500 });
    }
}