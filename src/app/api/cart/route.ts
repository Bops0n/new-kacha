// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { poolQuery } from '../../../../db'; // Adjust this path if your db.js is elsewhere
import { ProductInventory } from '../../../../types'; // Import ProductInventory from types.ts

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
 * @param {Request} request - The incoming request object. Expected to contain userId as a query parameter.
 * @returns {NextResponse} - JSON response containing cart items or an error message.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '');

    if (isNaN(userId)) {
        return NextResponse.json({ message: 'Missing or invalid userId', error: true }, { status: 400 });
    }

    try {
        // Use a JOIN query to fetch data from both Cart_Detail and Product_Inventory
        const result = await poolQuery(
            `SELECT
                cd."Product_ID",
                cd."Quantity" AS "CartQuantity", -- Quantity from Cart_Detail
                pi."Name",
                pi."Brand",
                pi."Unit",
                pi."Sale_Price",
                pi."Image_URL",
                pi."Quantity" AS "AvailableStock" -- Quantity from Product_Inventory (actual stock)
            FROM
                "Cart_Detail" cd
            JOIN
                "Product_Inventory" pi ON cd."Product_ID" = pi."Product_ID"
            WHERE
                cd."User_ID" = $1`,
            [userId]
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
        return NextResponse.json({ message: 'Internal server error', error: true }, { status: 500 });
    }
}

/**
 * POST /api/cart
 * Adds a new item to the cart or updates the quantity of an existing item.
 * @param {Request} request - The incoming request object. Expected body: { userId: number, productId: number, quantity: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 */
export async function POST(request: Request) {
    const { userId, productId, quantity } = await request.json();

    if (isNaN(userId) || isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ message: 'Invalid input data', error: true }, { status: 400 });
    }

    try {
        // 1. Get product details to check stock
        const productResult = await poolQuery(
            'SELECT "Name", "Quantity" FROM "Product_Inventory" WHERE "Product_ID" = $1',
            [productId]
        );
        const product = productResult.rows[0] as ProductInventory | undefined;

        if (!product) {
            return NextResponse.json({ message: 'Product not found', error: true }, { status: 404 });
        }

        // 2. Check current quantity in cart
        const cartItemResult = await poolQuery(
            'SELECT "Quantity" FROM "Cart_Detail" WHERE "User_ID" = $1 AND "Product_ID" = $2',
            [userId, productId]
        );
        const existingCartItem = cartItemResult.rows[0];

        if (existingCartItem) {
            // Item exists, update quantity
            const currentQuantity = existingCartItem.Quantity;
            const newTotalQuantity = currentQuantity + quantity;

            if (newTotalQuantity > product.Quantity) {
                return NextResponse.json(
                    { message: `Total quantity for ${product.Name} would exceed available stock (${product.Quantity}). Current in cart: ${currentQuantity}.`, error: true },
                    { status: 400 }
                );
            }

            await poolQuery(
                'UPDATE "Cart_Detail" SET "Quantity" = $3 WHERE "User_ID" = $1 AND "Product_ID" = $2',
                [userId, productId, newTotalQuantity]
            );
            console.log(`Updated quantity for User ${userId}, Product ${productId} to ${newTotalQuantity}`);
        } else {
            // Item does not exist, insert new item
            if (quantity > product.Quantity) {
                return NextResponse.json(
                    { message: `Requested quantity exceeds available stock (${product.Quantity}) for ${product.Name}.`, error: true },
                    { status: 400 }
                );
            }

            await poolQuery(
                'INSERT INTO "Cart_Detail" ("User_ID", "Product_ID", "Quantity") VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
            console.log(`Added new item for User ${userId}, Product ${productId} with quantity ${quantity}`);
        }

        return NextResponse.json({ message: 'Cart updated successfully', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error adding/updating cart item:', error);
        return NextResponse.json({ message: 'Internal server error', error: true }, { status: 500 });
    }
}

/**
 * DELETE /api/cart
 * Removes an item from the cart.
 * @param {Request} request - The incoming request object. Expected body: { userId: number, productId: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 */
export async function DELETE(request: Request) {
    const { userId, productId } = await request.json();

    if (isNaN(userId) || isNaN(productId)) {
        return NextResponse.json({ message: 'Invalid input data', error: true }, { status: 400 });
    }

    try {
        const deleteResult = await poolQuery(
            'DELETE FROM "Cart_Detail" WHERE "User_ID" = $1 AND "Product_ID" = $2 RETURNING "Product_ID"', // RETURNING to check if any row was deleted
            [userId, productId]
        );

        if (deleteResult.rowCount === 0) {
            return NextResponse.json({ message: 'Item not found in cart', error: true }, { status: 404 });
        }
        console.log(`Removed item for User ${userId}, Product ${productId}`);

        return NextResponse.json({ message: 'Item removed from cart successfully', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error removing cart item:', error);
        return NextResponse.json({ message: 'Internal server error', error: true }, { status: 500 });
    }
}

/**
 * PATCH /api/cart
 * Updates the quantity of an existing item in the cart to a new specified quantity.
 * @param {Request} request - The incoming request object. Expected body: { userId: number, productId: number, newQuantity: number }
 * @returns {NextResponse} - JSON response indicating success or failure.
 */
export async function PATCH(request: Request) {
    const { userId, productId, newQuantity } = await request.json();

    if (isNaN(userId) || isNaN(productId) || isNaN(newQuantity) || newQuantity <= 0) {
        return NextResponse.json({ message: 'Invalid input data', error: true }, { status: 400 });
    }

    try {
        // 1. Get product details to check stock
        const productResult = await poolQuery(
            'SELECT "Name", "Quantity" FROM "Product_Inventory" WHERE "Product_ID" = $1',
            [productId]
        );
        const product = productResult.rows[0] as ProductInventory | undefined;

        if (!product) {
            return NextResponse.json({ message: 'Product not found', error: true }, { status: 404 });
        }

        if (newQuantity > product.Quantity) { // Use product.Quantity for stock
            return NextResponse.json(
                { message: `Requested quantity exceeds available stock (${product.Quantity}) for ${product.Name}.`, error: true },
                { status: 400 }
            );
        }

        // 2. Update quantity in Cart_Detail
        const updateResult = await poolQuery(
            'UPDATE "Cart_Detail" SET "Quantity" = $3 WHERE "User_ID" = $1 AND "Product_ID" = $2 RETURNING "Product_ID"',
            [userId, productId, newQuantity]
        );

        if (updateResult.rowCount === 0) {
            return NextResponse.json({ message: 'Item not found in cart to update', error: true }, { status: 404 });
        }
        console.log(`Set quantity for User ${userId}, Product ${productId} to ${newQuantity}`);

        return NextResponse.json({ message: 'Cart item quantity updated successfully', error: false }, { status: 200 });
    } catch (error) {
        console.error('Error patching cart item quantity:', error);
        return NextResponse.json({ message: 'Internal server error', error: true }, { status: 500 });
    }
}
