import { NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db';
import { ProductInventory } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { CartDetailSchema } from '@/types';
import { authenticateRequest } from '../../auth/utils';
import { checkRequire } from '@/app/utils/client';

/**
 * GET /api/cart
 * Retrieves all items in the specified user's cart using a JOIN query for efficiency.
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - JSON response containing cart items or an error message.
 * Authorization: Only allows a user to retrieve their own cart items.
 */
export async function GET(request: Request) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const result = await poolQuery(
            `SELECT
                cd."Product_ID",
                cd."Quantity" AS "CartQuantity",
                p."Name",
                p."Brand",
                p."Unit",
                p."Sale_Price",
                p."Discount_Price",
                p."Image_URL",
                p."Quantity", -- Base Stock
                p."Total_Sales",
                p."Cancellation_Count"
            FROM
                "Cart_Detail" cd
            JOIN
                "Product" p ON cd."Product_ID" = p."Product_ID"
            WHERE
                cd."User_ID" = $1`,
            [auth.userId]
        );

        // Map ผลลัพธ์ให้ตรงกับ CartDetailSchema ใหม่
        const cartItems: CartDetailSchema[] = result.rows.map((row: any) => ({
            Product_ID: row.Product_ID,
            Name: row.Name,
            Brand: row.Brand,
            Unit: row.Unit,
            Sale_Price: parseFloat(row.Sale_Price),
            Discount_Price: row.Discount_Price ? parseFloat(row.Discount_Price) : null,
            Image_URL: row.Image_URL,
            Quantity: row.Quantity,
            Total_Sales: row.Total_Sales,
            Cancellation_Count: row.Cancellation_Count,
            CartQuantity: row.CartQuantity,
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
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { productId, quantity } = await request.json(); // userId is now taken from session

    if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
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
            [auth.userId, productId]
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
                [auth.userId, productId, newTotalQuantity]
            );
            console.log(`Updated quantity for User ${auth.userId}, Product ${productId} to ${newTotalQuantity}`);
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
                [auth.userId, productId, quantity]
            );
            console.log(`Added new item for User ${auth.userId}, Product ${productId} with quantity ${quantity}`);
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
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { productId } = await request.json(); // userId is now taken from session

    if (isNaN(productId)) {
        return NextResponse.json({ message: 'ข้อมูลนำเข้าไม่ถูกต้อง', error: true }, { status: 400 });
    }

    try {
        const deleteResult = await poolQuery(
            'DELETE FROM "Cart_Detail" WHERE "User_ID" = $1 AND "Product_ID" = $2 RETURNING "Product_ID"', // RETURNING to check if any row was deleted
            [auth.userId, productId]
        );

        if (deleteResult.rowCount === 0) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้า', error: true }, { status: 404 });
        }
        console.log(`Removed item for User ${auth.userId}, Product ${productId}`);

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
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { productId, newQuantity } = await request.json(); // userId is now taken from session

    if (isNaN(productId) || isNaN(newQuantity) || newQuantity <= 0) {
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
            [auth.userId, productId, newQuantity]
        );

        if (updateResult.rowCount === 0) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้าที่จะอัปเดต', error: true }, { status: 404 });
        }
        console.log(`Set quantity for User ${auth.userId}, Product ${productId} to ${newQuantity}`);

        return NextResponse.json({ message: 'อัปเดตจำนวนสินค้าในตะกร้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error patching cart item quantity:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', error: true }, { status: 500 });
    }
}
