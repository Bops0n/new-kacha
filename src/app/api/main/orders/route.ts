// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool, poolQuery } from '@/app/api/lib/db';
import { authenticateRequest } from '@/app/api/auth/utils';
import { AddressSchema, Order } from '@/types';

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
    totalPrice: number;
}


// Helper function to map database rows to the Order UI model
const mapDbRowsToUiOrder = (dbRows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                // Map fields from 'Order' table
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Order_Date: row.Order_Date,
                Status: row.Status,
                Payment_Type: row.Payment_Type,
                Invoice_ID: row.Invoice_ID,
                Address_ID: row.Address_ID,
                DeliveryDate: row.DeliveryDate,
                Tracking_ID: row.Tracking_ID,
                Shipping_Carrier: row.Shipping_Carrier,
                Transfer_Slip_Image_URL: row.Transfer_Slip_Image_URL,
                Cancellation_Reason: row.Cancellation_Reason,
                Address: row.Address,
                Phone: row.Phone,
                Total_Amount: parseFloat(row.Total_Amount),
                
                // Mapped from JOIN
                Customer_Name: row.UserFullName || 'N/A', // Customer name for their own orders
                Products: [],
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
    return Array.from(ordersMap.values()).sort((a, b) => b.Order_ID - a.Order_ID);
};


/**
 * GET /api/main/orders
 * ดึงข้อมูลคำสั่งซื้อทั้งหมดสำหรับผู้ใช้ที่ login อยู่
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) {
        return auth.response!;
    }
    const userId = auth.userId;

    try {
        const sql = `
            SELECT
                o."Order_ID", o."User_ID", o."Order_Date", o."Status", o."Payment_Type",
                o."Invoice_ID", o."Address_ID", o."DeliveryDate", o."Tracking_ID", o."Shipping_Carrier",
                o."Transfer_Slip_Image_URL", o."Cancellation_Reason", o."Address", o."Phone",
                o."Total_Amount",
                u."Full_Name" AS "UserFullName",
                od."Product_ID", od."Quantity", od."Product_Sale_Cost", od."Product_Sale_Price",
                od."Product_Name", od."Product_Brand", od."Product_Unit", od."Product_Image_URL",
                od."Product_Discount_Price"
            FROM
                public."Order" AS o
            LEFT JOIN
                public."User" AS u ON o."User_ID" = u."User_ID"
            LEFT JOIN
                public."Order_Detail" AS od ON o."Order_ID" = od."Order_ID"
            WHERE
                o."User_ID" = $1
            ORDER BY 
                o."Order_ID" DESC, od."Product_ID" ASC;
        `;

        const result = await poolQuery(sql, [userId]);
        const orders: Order[] = mapDbRowsToUiOrder(result.rows);

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
    if (!auth.authenticated || !auth.userId) {
        return auth.response!;
    }
    const userId = auth.userId;

    const { addressId, paymentMethod, cartItems, totalPrice }: PlaceOrderRequestBody = await request.json();

    if (!addressId || !paymentMethod || !cartItems || cartItems.length === 0) {
        return NextResponse.json({ message: 'ข้อมูลคำสั่งซื้อไม่ครบถ้วน', error: true }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const addressResult = await client.query('SELECT * FROM "Address" WHERE "Address_ID" = $1 AND "User_ID" = $2', [addressId, userId]);
        if (addressResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'ที่อยู่จัดส่งไม่ถูกต้อง', error: true }, { status: 400 });
        }
        const selectedAddress: AddressSchema = addressResult.rows[0];
        const shippingAddressString = `${selectedAddress.Address_1}${selectedAddress.Address_2 ? `, ${selectedAddress.Address_2}` : ''}, ${selectedAddress.Sub_District}, ${selectedAddress.District}, ${selectedAddress.Province} ${selectedAddress.Zip_Code}`;
        const shippingPhone = selectedAddress.Phone || '';

        const orderInsertResult = await client.query(
            `INSERT INTO "Order" (
                "User_ID", "Order_Date", "Status", "Payment_Type", "Address_ID", 
                "Address", "Phone", "Total_Amount"
            ) VALUES ($1, NOW(), 'pending', $2, $3, $4, $5, $6) RETURNING "Order_ID"`,
            [userId, paymentMethod, addressId, shippingAddressString, shippingPhone, totalPrice]
        );
        const orderId: number = orderInsertResult.rows[0].Order_ID;

        for (const item of cartItems) {
            const productResult = await client.query(
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
            
            await client.query(
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
            
            await client.query(
                `UPDATE "Product" SET "Total_Sales" = "Total_Sales" + $1 WHERE "Product_ID" = $2`,
                [item.CartQuantity, item.Product_ID]
            );
        }

        await client.query(`DELETE FROM "Cart_Detail" WHERE "User_ID" = $1`, [userId]);

        await client.query('COMMIT');
        
        return NextResponse.json({ message: 'สร้างคำสั่งซื้อสำเร็จ', orderId }, { status: 201 });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error placing order:', error);
        return NextResponse.json({ message: error.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ', error: true }, { status: 500 });
    } finally {
        client.release();
    }
}