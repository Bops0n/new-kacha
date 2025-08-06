// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db'; // Adjust path if your db.js is elsewhere
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path to your NextAuth config
import { AddressSchema, ProductInventory, AccessLevel, OrderProductDetail, OrderStatus, Order } from '../../../../types/types'; // Import types as needed

// --- Define Types specific to this API's data flow ---
// These types reflect the data structures expected/returned by this API,
// complementing (or sometimes duplicating for clarity) those in types.ts.

// Type for product items received in the order request body
interface OrderProductRequestBody {
    Product_ID: number;
    CartQuantity: number; // This is the quantity the user wants to order
}

// Type for the full request body when placing an order
interface PlaceOrderRequestBody {
    addressId: number;
    paymentMethod: 'COD' | 'Bank Transfer';
    cartItems: OrderProductRequestBody[];
    totalPrice: number; // *** ADDED totalPrice TO INTERFACE ***
}

// OrderResponse (used for GET /api/orders) will now use the shared Order type from types.ts
// OrderProductDetail is also shared.


// --- Helper Function for Authentication ---
async function authenticateRequest() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 }),
            userId: null,
            accessLevel: null as AccessLevel | null,
        };
    }

    const authenticatedUserId = parseInt(session.user.id as string);
    if (isNaN(authenticatedUserId)) {
        console.error('Session user ID is not a valid number:', session.user.id);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'User ID จาก session ไม่ถูกต้อง', error: true }, { status: 500 }),
            userId: null,
            accessLevel: null as AccessLevel | null,
        };
    }

    // Ensure accessLevel is part of the session token from NextAuth callbacks
    const accessLevel = (session.user as any).accessLevel as AccessLevel; // Cast to AccessLevel type
    if (!accessLevel) {
        console.error('Access level not found in session:', session.user);
        return {
            authenticated: false,
            response: NextResponse.json({ message: 'ข้อมูลสิทธิ์การเข้าถึงไม่สมบูรณ์', error: true }, { status: 500 }),
            userId: null,
            accessLevel: null,
        };
    }

    return { authenticated: true, userId: authenticatedUserId, accessLevel, response: null };
}

// --- API Route Handlers ---

/**
 * GET /api/orders
 * Retrieves all orders for the authenticated user.
 * Admins can retrieve all orders (add query param 'all=true').
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - JSON response containing orders or an error message.
 */
export async function GET(request: Request) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response;
    }
    const userId = auth.userId as number;
    const accessLevel = auth.accessLevel as AccessLevel;

    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';

    // *** MODIFICATION START ***
    // Now selecting Total_Amount directly from the "Order" table
    // Correcting column names for Tracking_ID, Shipping_Carrier, Cancellation_Reason, Transfer_Slip_Image_URL
    let baseQuery = `
        SELECT
            o."Order_ID",
            o."User_ID",
            o."Order_Date",
            o."Total_Amount",
            o."Status",
            o."Payment_Type",
            o."Invoice_ID",
            o."Address_ID" AS "Shipping_Address_ID",
            o."DeliveryDate",
            o."Tracking_ID", -- Corrected column name
            o."Shipping_Carrier", -- Corrected column name
            o."Cancellation_Reason", -- Corrected column name
            o."Transfer_Slip_Image_URL", -- Corrected column name
            o."Address",
            o."Phone",
            json_agg(
                json_build_object(
                    'Product_ID', od."Product_ID",
                    'Product_Name', od."Product_Name",
                    'Product_Brand', od."Product_Brand",
                    'Product_Unit', od."Product_Unit",
                    'Product_Image_URL', od."Product_Image_URL",
                    'Quantity', od."Quantity",
                    'Price', od."Price",
                    'Discount', od."Discount",
                    'Subtotal', od."Quantity" * od."Price" - od."Discount"
                )
            ) AS "Products"
        FROM
            "Order" o
        JOIN
            "Order_Detail" od ON o."Order_ID" = od."Order_ID"
    `;
    // *** MODIFICATION END ***

    let queryParams: any[] = [];
    let whereClause = '';

    if (accessLevel === '0' || !fetchAll) { // If user is customer or not requesting all orders
        whereClause = ` WHERE o."User_ID" = $1`;
        queryParams.push(userId);
    } else if (accessLevel === '1' && fetchAll) { // If user is admin and requests all orders
        // No WHERE clause for User_ID needed
    } else {
        // Fallback for unexpected accessLevel or if fetchAll isn't explicitly true for admin
        whereClause = ` WHERE o."User_ID" = $1`;
        queryParams.push(userId);
    }

    const groupByClause = `
        GROUP BY
            o."Order_ID", o."User_ID", o."Order_Date", o."Total_Amount", o."Status", o."Payment_Type",
            o."Invoice_ID", o."Address_ID", o."DeliveryDate", o."Tracking_ID",
            o."Shipping_Carrier", o."Transfer_Slip_Image_URL", o."Cancellation_Reason",
            o."Address", o."Phone"
        ORDER BY o."Order_Date" DESC`;

    try {
        const result = await poolQuery(baseQuery + whereClause + groupByClause, queryParams);
        const orders: Order[] = result.rows; // Use the shared Order type

        orders.forEach(order => {
            if (!order.Products || order.Products[0]?.Product_ID === null) {
                order.Products = [];
            }
            order.Order_Date = new Date(order.Order_Date).toISOString();
            if (order.DeliveryDate) {
                order.DeliveryDate = new Date(order.DeliveryDate).toISOString();
            }
            // Ensure Total_Amount is a number
            order.Total_Amount = parseFloat(order.Total_Amount.toString());
        });

        return NextResponse.json({ orders, error: false }, { status: 200 });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะดึงข้อมูลคำสั่งซื้อ', error: true }, { status: 500 });
    }
}


/**
 * POST /api/orders
 * Places a new order for the authenticated user.
 * This is a transactional operation: checks stock, creates order/details, decrements stock, clears cart.
 * @param {Request} request - The incoming request object. Expected body: PlaceOrderRequestBody
 * @returns {NextResponse} - JSON response indicating success/failure and the new order ID.
 * Authorization: Only allows authenticated users to place orders for themselves.
 */
export async function POST(request: Request) {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
        return auth.response;
    }
    const userId = auth.userId as number;

    const { addressId, paymentMethod, cartItems, totalPrice }: PlaceOrderRequestBody = await request.json(); // *** ADDED totalPrice TO DESTRUCTURING ***

    if (!addressId || !paymentMethod || !cartItems || cartItems.length === 0 || typeof totalPrice === 'undefined') { // *** ADDED typeof totalPrice CHECK ***
        return NextResponse.json({ message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วน', error: true }, { status: 400 });
    }

    let calculatedTotalAmount = 0; // Renamed to avoid conflict with sent totalPrice
    const productsToOrder: {
        productId: number;
        quantity: number;
        price: number;
        discount: number;
        name: string;
        brand: string | null;
        unit: string;
        imageUrl: string | null;
        stock: number;
    }[] = [];
    let shippingAddressString: string = '';
    let shippingPhone: string = '';

    await poolQuery('BEGIN');

    try {
        // 1. Verify Address ownership and snapshot address details
        const addressResult = await poolQuery(`SELECT * FROM "Address" WHERE "Address_ID" = $1`, [addressId]);
        if (addressResult.rowCount === 0 || addressResult.rows[0].User_ID !== userId) {
             await poolQuery('ROLLBACK');
             return NextResponse.json({ message: 'ที่อยู่จัดส่งไม่ถูกต้องหรือไม่เป็นของคุณ', error: true }, { status: 400 });
        }
        const selectedAddress: Address = addressResult.rows[0];

        shippingAddressString = `${selectedAddress.Address_1}`;
        if (selectedAddress.Address_2) {
            shippingAddressString += `, ${selectedAddress.Address_2}`;
        }
        shippingAddressString += `, แขวง/ตำบล ${selectedAddress.Sub_District}, เขต/อำเภอ ${selectedAddress.District}`;
        shippingAddressString += `, จังหวัด ${selectedAddress.Province}, รหัสไปรษณีย์ ${selectedAddress.Zip_Code}`;
        shippingPhone = selectedAddress.Phone;

        // 2. Validate products and check stock within the transaction
        for (const item of cartItems) {
            // Fetch more product details for snapshotting
            const productResult = await poolQuery(
                `SELECT "Product_ID", "Name", "Brand", "Unit", "Sale_Price", "Quantity", "Image_URL" FROM "Product" WHERE "Product_ID" = $1`,
                [item.Product_ID]
            );
            const product: ProductInventory & { Name: string; Brand: string | null; Unit: string; Image_URL: string | null; } | undefined = productResult.rows[0];

            if (!product) {
                await poolQuery('ROLLBACK');
                return NextResponse.json({ message: `ไม่พบสินค้า Product_ID: ${item.Product_ID}`, error: true }, { status: 404 });
            }

            if (item.CartQuantity > product.Quantity) {
                await poolQuery('ROLLBACK');
                return NextResponse.json({ message: `สินค้า "${product.Name}" มีในสต็อกไม่เพียงพอ (เหลือ ${product.Quantity} ชิ้น)`, error: true }, { status: 400 });
            }

            productsToOrder.push({
                productId: product.Product_ID,
                quantity: item.CartQuantity,
                price: product.Sale_Price,
                discount: 0.00,
                name: product.Name,
                brand: product.Brand,
                unit: product.Unit,
                imageUrl: product.Image_URL,
                stock: product.Quantity,
            });
            calculatedTotalAmount += item.CartQuantity * product.Sale_Price;
        }

        // *** MODIFICATION START ***
        // Optional: Compare sent totalPrice with calculatedTotalAmount for validation
        if (Math.abs(totalPrice - calculatedTotalAmount) > 0.01) { // Allow for small floating point differences
            console.warn(`Sent totalPrice (${totalPrice}) differs from calculatedTotalAmount (${calculatedTotalAmount}) for order by User ${userId}. Using calculated amount for DB.`);
            // You might choose to return an error here instead, depending on your business rules
            // return NextResponse.json({ message: 'ยอดรวมไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', error: true }, { status: 400 });
        }
        // Use calculatedTotalAmount for database insertion to ensure integrity
        const amountToStore = calculatedTotalAmount;
        // *** MODIFICATION END ***

        // 3. Create the Order entry
        const orderStatus = 'pending';
        const orderDate = new Date().toISOString().split('T')[0];

        // Include "Total_Amount" in the INSERT statement for "Order"
        const orderInsertResult = await poolQuery(
            `INSERT INTO "Order" (
                "User_ID", "Order_Date", "Status", "Payment_Type",
                "Address_ID", "Address", "Phone", "Total_Amount"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "Order_ID"`,
            [userId, orderDate, orderStatus, paymentMethod, addressId, shippingAddressString, shippingPhone, amountToStore] // Use amountToStore
        );
        const orderId: number = orderInsertResult.rows[0].Order_ID;

        // 4. Insert into Order_Detail and Decrement Product Stock
        for (const item of productsToOrder) {
            await poolQuery(
                `INSERT INTO "Order_Detail" (
                    "Order_ID", "Product_ID", "Quantity", "Price", "Discount",
                    "Product_Name", "Product_Brand", "Product_Unit", "Product_Image_URL"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [orderId, item.productId, item.quantity, item.price, item.discount,
                 item.name, item.brand, item.unit, item.imageUrl]
            );

            await poolQuery(
                `UPDATE "Product" SET "Quantity" = "Quantity" - $2 WHERE "Product_ID" = $1`,
                [item.productId, item.quantity]
            );
        }

        // 5. Clear the user's cart (Cart_Detail table)
        await poolQuery(`DELETE FROM "Cart_Detail" WHERE "User_ID" = $1`, [userId]);

        // 6. Commit the transaction
        await poolQuery('COMMIT');

        console.log(`Order ${orderId} placed successfully by User ${userId}`);
        return NextResponse.json({ message: 'สร้างคำสั่งซื้อสำเร็จ', orderId, error: false }, { status: 201 });

    } catch (error) {
        await poolQuery('ROLLBACK');
        console.error('Error placing order:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ', error: true }, { status: 500 });
    }
}