// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';
import { authenticateRequest } from '@/app/api/auth/utils';
import { AddressSchema, Order, PlaceOrderRequestBody } from '@/types';
import { checkRequire } from '@/app/utils/client';
import { getOrderByUID } from '../../services/user/userServices';
import { mapDbRowsToOrders } from '@/app/utils/server';

/**
 * GET /api/main/orders
 * ดึงข้อมูลคำสั่งซื้อทั้งหมดสำหรับผู้ใช้ที่ login อยู่
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {

        const result = await getOrderByUID(Number(auth.userId));
        const orders: Order[] = mapDbRowsToOrders(result);

        return NextResponse.json({ orders });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ', error: true }, { status: 500 });
    }
}


/**
 * POST /api/orders
 * Places a new order for the authenticated user.
 * This is a transactional operation: checks stock, creates order/details, updates sales count, and clears cart.
 * @param {Request} request - The incoming request object. Expected body: PlaceOrderRequestBody
 * @returns {NextResponse} - JSON response indicating success/failure and the new order ID.
 * Authorization: Only allows authenticated users to place orders for themselves.
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const { addressId, paymentMethod, cartItems, totalPrice }: PlaceOrderRequestBody = await request.json();

    if (!addressId || !paymentMethod || !cartItems || cartItems.length === 0) {
        return NextResponse.json({ message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วน', error: true }, { status: 400 });
    }
    
    const addressResult = await poolQuery('SELECT * FROM "Address" WHERE "Address_ID" = $1 AND "User_ID" = $2', [addressId, auth.userId]);
    if (addressResult.rowCount === 0) {
        return NextResponse.json({ message: 'ที่อยู่จัดส่งไม่ถูกต้อง', error: true }, { status: 400 });
    }
    const selectedAddress: AddressSchema = addressResult.rows[0];
    const shippingAddressString = `${selectedAddress.Address_1}${selectedAddress.Address_2 ? `, ${selectedAddress.Address_2}` : ''}, ${selectedAddress.Sub_District}, ${selectedAddress.District}, ${selectedAddress.Province} ${selectedAddress.Zip_Code}`;
    const shippingPhone = selectedAddress.Phone || '';

    const orderInsertResult = await poolQuery(
        `INSERT INTO "Order" (
            "User_ID", "Order_Date", "Status", "Payment_Type", "Address_ID", 
            "Address", "Phone", "Total_Amount"
        ) VALUES ($1, NOW(), 'pending', $2, $3, $4, $5, $6) RETURNING "Order_ID"`,
        [auth.userId, paymentMethod, addressId, shippingAddressString, shippingPhone, totalPrice]
    );
    const orderId: number = orderInsertResult.rows[0].Order_ID;

    for (const item of cartItems) {
        const productResult = await poolQuery(
            `SELECT "Name", "Brand", "Unit", "Image_URL", "Sale_Cost", "Sale_Price", "Discount_Price", "Quantity", "Total_Sales", "Cancellation_Count" 
                FROM "Product" WHERE "Product_ID" = $1 FOR UPDATE`,
            [item.Product_ID]
        );
        
        if (productResult.rowCount === 0) throw new Error(`ไม่พบสินค้า ID: ${item.Product_ID}`);
        const product = productResult.rows[0];

        const availableStock = product.Quantity - product.Total_Sales + product.Cancellation_Count;
        if (item.CartQuantity > availableStock) {
            throw new Error(`สินค้า "${product.Name}" มีในสต็อกไม่เพียงพอ`);
        }
        
        await poolQuery(
            `INSERT INTO "Order_Detail" (
                "Order_ID", "Product_ID", "Quantity", 
                "Product_Sale_Cost", "Product_Sale_Price", "Product_Name", 
                "Product_Brand", "Product_Unit", "Product_Image_URL", "Product_Discount_Price"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                orderId, item.Product_ID, item.CartQuantity,
                product.Sale_Cost, product.Sale_Price, product.Name, 
                product.Brand, product.Unit, product.Image_URL, product.Discount_Price
            ]
        );
        
        await poolQuery(
            `UPDATE "Product" SET "Total_Sales" = "Total_Sales" + $1 WHERE "Product_ID" = $2`,
            [item.CartQuantity, item.Product_ID]
        );
    }

    await poolQuery(`DELETE FROM "Cart_Detail" WHERE "User_ID" = $1`, [auth.userId]);
    
    return NextResponse.json({ message: 'สร้างคำสั่งซื้อสำเร็จ', orderId }, { status: 201 });
}