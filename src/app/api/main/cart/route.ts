import { NextResponse } from 'next/server';
import { CartDetailSchema } from '@/types';
import { authenticateRequest } from '../../auth/utils';
import { checkRequire } from '@/app/utils/client';
import { addCartProduct, deleteCartProduct, getCartByUID, updateCartProduct } from '../../services/user/userServices';
import { logger } from '@/server/logger';

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
        const result = await getCartByUID(Number(auth.userId));

        const cartItems: CartDetailSchema[] = result.map((row: any) => ({
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
            Cart_Quantity: row.Cart_Quantity,
        }));

        return NextResponse.json({ cartItems, error: false }, { status: 200 });
    } catch (error) {
        logger.error('Error fetching cart with JOIN:', error);
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
        const result = await addCartProduct(Number(auth.userId), productId, quantity);
        if (!result) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้า', error: true }, { status: 404 });
        }

        return NextResponse.json({ message: 'อัปเดตตะกร้าสินค้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        logger.error('Error adding/updating cart item:', error);
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
        const result = await deleteCartProduct(Number(auth.userId), productId);

        if (!result) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้า', error: true }, { status: 404 });
        }
        return NextResponse.json({ message: 'นำสินค้าออกจากตะกร้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        logger.error('Error removing cart item:', error);
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
        const result = await updateCartProduct(Number(auth.userId), productId, newQuantity);

        if (!result) {
            return NextResponse.json({ message: 'ไม่พบสินค้าในตะกร้าที่จะอัปเดต', error: true }, { status: 404 });
        }
        return NextResponse.json({ message: 'อัปเดตจำนวนสินค้าในตะกร้าสำเร็จ', error: false }, { status: 200 });
    } catch (error) {
        logger.error('Error patching cart item quantity:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', error: true }, { status: 500 });
    }
}
