// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../lib/db'; // Adjust this path if your db.js is elsewhere
import { ProductInventory } from '../../../types'; // Import ProductInventory from types.ts
import { getServerSession } from 'next-auth'; // Import getServerSession
import { authOptions } from '../auth/[...nextauth]/route'; // Import your NextAuth config (adjust path as needed)

// Define Type for CartItem to be sent to the Frontend
// This combines data from ProductInventory and Cart_Detail
interface CartItem {
    Product_ID: number;
    Name: string;
    Brand: string;
    Unit: string;
    Sale_Price: number;
    Image_URL: string | null;
    Quantity: number; // Quantity in cart
    AvailableStock: number; // Available stock (from ProductInventory.Quantity)
}

/**
 * GET /api/cart
 * Retrieves all items in the specified user's cart using a JOIN query for efficiency.
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - JSON response containing cart items or an error message.
 * Authorization: Only allows a user to retrieve their own cart items.
 */
export async function GET(request: Request) {
    // 1. Get the session of the authenticated user
    const session = await getServerSession(authOptions);
    console.log(session?.user)

    // 2. Check if the user is authenticated and get their ID
    if (!session || !session.user || !session.user.id) {
        // If no session or user ID is found, deny access
        return NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 });
    }

    // Use the authenticated user's ID for all cart operations
    const authenticatedUserId = parseInt(session.user.id as string);

    // Remove parsing userId from query params as it's no longer used for auth
    // Also remove the `await request.json()` line as GET requests don't typically have a body
    // const { searchParams } = new URL(request.url);
    // const userId = parseInt(searchParams.get('userId') || '');
    // const k = await request.json() // This line is incorrect for a GET request
    // console.log(k)

    if (isNaN(authenticatedUserId)) {
        // This case should ideally not happen if session.user.id is always a valid number string
        return NextResponse.json({ message: 'User ID จาก session ไม่ถูกต้อง', error: true }, { status: 500 });
    }

    try {
        // Use a JOIN query to fetch data from both Cart_Detail and Product
        const result = await poolQuery(
            `SELECT
                cd."Product_ID",
                cd."Quantity" AS "CartQuantity", -- Quantity from Cart_Detail
                pi."Name",
                pi."Brand",
                pi."Unit",
                pi."Sale_Price",
                pi."Image_URL",
                pi."Quantity" AS "AvailableStock" -- Quantity from Product (actual stock)
            FROM
                "Cart_Detail" cd
            JOIN
                "Product" pi ON cd."Product_ID" = pi."Product_ID"
            WHERE
                cd."User_ID" = $1`,
            [authenticatedUserId] // Use the authenticated user's ID
        );

        // Map the joined results directly to the CartItem interface
        const cartItems: CartItem[] = result.rows.map((row: any) => ({
            Product_ID: row.Product_ID,
            Name: row.Name,
            Brand: row.Brand,
            Unit: row.Unit,
            Sale_Price: parseFloat(row.Sale_Price), // Ensure Sale_Price is parsed to number
            Image_URL: row.Image_URL,
            Quantity: row.CartQuantity,
            AvailableStock: row.AvailableStock,
        }));

        return NextResponse.json({ cartItems, error: false }, { status: 200 });
    } catch (error) {
        console.error('Error fetching cart with JOIN:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะดึงข้อมูลตะกร้าสินค้า', error: true }, { status: 500 });
    }
}

/**
 * POST /api/cart
 * Adds a new item to the cart or updates the quantity of an existing item.
 * @param {Request} request - The incoming request object. Expected body: { productId: number, quantity: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 * Authorization: Ensures cart operation is for the authenticated user.
 */
export async function POST(request: Request) {
    // Get the session of the authenticated user
    const session = await getServerSession(authOptions);
    console.log(session,'d')

    // Check if the user is authenticated and get their ID
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 });
    }
    const authenticatedUserId = parseInt(session.user.id as string);

    const { productId, quantity } = await request.json(); // userId is now taken from session

    if (isNaN(authenticatedUserId) || isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ message: 'ข้อมูลนำเข้าไม่ถูกต้อง', error: true }, { status: 400 });
    }

    try {
        // 1. Get product details to check stock
        const productResult = await poolQuery(
            'SELECT "Name", "Quantity" FROM "Product" WHERE "Product_ID" = $1',
            [productId]
        );
        const product = productResult.rows[0] as ProductInventory | undefined;

        if (!product) {
            return NextResponse.json({ message: 'ไม่พบสินค้า', error: true }, { status: 404 });
        }

        // 2. Check current quantity in cart for the authenticated user
        const cartItemResult = await poolQuery(
            'SELECT "Quantity" FROM "Cart_Detail" WHERE "User_ID" = $1 AND "Product_ID" = $2',
            [authenticatedUserId, productId]
        );
        const existingCartItem = cartItemResult.rows[0];

        if (existingCartItem) {
            // Item exists, update quantity
            const currentQuantity = existingCartItem.Quantity;
            const newTotalQuantity = currentQuantity + quantity;

            if (newTotalQuantity > product.Quantity) {
                return NextResponse.json(
                    { message: `จำนวนสินค้าสำหรับ ${product.Name} จะเกินจำนวนสินค้าที่มีในสต็อก (${product.Quantity}) มีในตะกร้า: ${currentQuantity}.`, error: true },
                    { status: 400 }
                );
            }

            await poolQuery(
                'UPDATE "Cart_Detail" SET "Quantity" = $3 WHERE "User_ID" = $1 AND "Product_ID" = $2',
                [authenticatedUserId, productId, newTotalQuantity]
            );
            console.log(`Updated quantity for User ${authenticatedUserId}, Product ${productId} to ${newTotalQuantity}`);
        } else {
            // Item does not exist, insert new item
            if (quantity > product.Quantity) {
                return NextResponse.json(
                    { message: `จำนวนสินค้าที่ร้องขอเกินจำนวนสินค้าที่มีในสต็อก (${product.Quantity}) สำหรับ ${product.Name}.`, error: true },
                    { status: 400 }
                );
            }

            await poolQuery(
                'INSERT INTO "Cart_Detail" ("User_ID", "Product_ID", "Quantity") VALUES ($1, $2, $3)',
                [authenticatedUserId, productId, quantity]
            );
            console.log(`Added new item for User ${authenticatedUserId}, Product ${productId} with quantity ${quantity}`);
        }

        return NextResponse.json({ message: 'อัปเดตตะกร้าสินค้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error adding/updating cart item:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', error: true }, { status: 500 });
    }
}

/**
 * DELETE /api/cart
 * Removes an item from the cart.
 * @param {Request} request - The incoming request object. Expected body: { productId: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 * Authorization: Ensures cart operation is for the authenticated user.
 */
export async function DELETE(request: Request) {
    // Get the session of the authenticated user
    const session = await getServerSession(authOptions);
    console.log('delete')

    // Check if the user is authenticated and get their ID
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 });
    }
    const authenticatedUserId = parseInt(session.user.id as string);

    const { productId } = await request.json(); // userId is now taken from session

    if (isNaN(authenticatedUserId) || isNaN(productId)) {
        return NextResponse.json({ message: 'ข้อมูลนำเข้าไม่ถูกต้อง', error: true }, { status: 400 });
    }

    try {
        const deleteResult = await poolQuery(
            'DELETE FROM "Cart_Detail" WHERE "User_ID" = $1 AND "Product_ID" = $2 RETURNING "Product_ID"', // RETURNING to check if any row was deleted
            [authenticatedUserId, productId]
        );

        if (deleteResult.rowCount === 0) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้า', error: true }, { status: 404 });
        }
        console.log(`Removed item for User ${authenticatedUserId}, Product ${productId}`);

        return NextResponse.json({ message: 'นำสินค้าออกจากตะกร้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', error: true }, { status: 500 });
    }
}

/**
 * PATCH /api/cart
 * Updates the quantity of an existing item in the cart to a new specified quantity.
 * @param {Request} request - The incoming request object. Expected body: { productId: number, newQuantity: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 * Authorization: Ensures cart operation is for the authenticated user.
 */
export async function PATCH(request: Request) {
    // Get the session of the authenticated user
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated and get their ID
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: 'ไม่ได้รับอนุญาต', error: true }, { status: 401 });
    }
    const authenticatedUserId = parseInt(session.user.id as string);

    const { productId, newQuantity } = await request.json(); // userId is now taken from session

    if (isNaN(authenticatedUserId) || isNaN(productId) || isNaN(newQuantity) || newQuantity <= 0) {
        return NextResponse.json({ message: 'ข้อมูลนำเข้าไม่ถูกต้อง', error: true }, { status: 400 });
    }

    try {
        // 1. Get product details to check stock
        const productResult = await poolQuery(
            'SELECT "Name", "Quantity" FROM "Product" WHERE "Product_ID" = $1',
            [productId]
        );
        const product = productResult.rows[0] as ProductInventory | undefined;

        if (!product) {
            return NextResponse.json({ message: 'ไม่พบสินค้า', error: true }, { status: 404 });
        }

        if (newQuantity > product.Quantity) { // Use product.Quantity for stock
            return NextResponse.json(
                { message: `จำนวนสินค้าที่ร้องขอเกินจำนวนสินค้าที่มีในสต็อก (${product.Quantity}) สำหรับ ${product.Name}.`, error: true },
                { status: 400 }
            );
        }

        // 2. Update quantity in Cart_Detail for the authenticated user
        const updateResult = await poolQuery(
            'UPDATE "Cart_Detail" SET "Quantity" = $3 WHERE "User_ID" = $1 AND "Product_ID" = $2 RETURNING "Product_ID"',
            [authenticatedUserId, productId, newQuantity]
        );

        if (updateResult.rowCount === 0) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้าที่จะอัปเดต', error: true }, { status: 404 });
        }
        console.log(`Set quantity for User ${authenticatedUserId}, Product ${productId} to ${newQuantity}`);

        return NextResponse.json({ message: 'อัปเดตจำนวนสินค้าในตะกร้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error patching cart item quantity:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', error: true }, { status: 500 });
    }
}
