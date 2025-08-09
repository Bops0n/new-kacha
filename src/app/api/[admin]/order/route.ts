import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '@/app/api/lib/db';
import { Order, OrderProductDetail } from '@/types';

// Helper function to map database rows to the Order UI model
const mapDbRowsToUiOrder = (dbRows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
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
                Customer_Name: row.UserFullName || 'N/A',
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
 * GET: ดึงข้อมูลคำสั่งซื้อทั้งหมด (สำหรับ Admin)
 */
export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get('id');

    // *** แก้ไข SQL Query ให้ใช้ "" ครอบชื่อ Column ทั้งหมด ***
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
        ${orderId ? 'WHERE o."Order_ID" = $1' : ''}
        ORDER BY 
            o."Order_ID" DESC, od."Product_ID" ASC;
    `;
    const queryParams = orderId ? [parseInt(orderId, 10)] : [];

    try {
        const result = await poolQuery(sql, queryParams);
        const ordersUI = mapDbRowsToUiOrder(result.rows);
        if (orderId && ordersUI.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json({ orders: ordersUI });
    } catch (dbError: any) {
        console.error("Error fetching orders:", dbError);
        return NextResponse.json({ message: "Failed to fetch orders", error: dbError.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body: Partial<Order> = await req.json();
        const { Order_ID, ...fieldsToUpdate } = body;

        if (!Order_ID) {
            return NextResponse.json({ message: "Order_ID is required for update." }, { status: 400 });
        }
        
        // Filter out keys that are not direct columns of the Order table
        const allowedOrderColumns = [
            'Status', 'Payment_Type', 'Invoice_ID', 'Address_ID', 'DeliveryDate', 
            'Tracking_ID', 'Shipping_Carrier', 'Transfer_Slip_Image_URL', 
            'Cancellation_Reason', 'Address', 'Phone', 'Total_Amount'
        ];
        
        const updateEntries = Object.entries(fieldsToUpdate)
            .filter(([key, value]) => allowedOrderColumns.includes(key) && value !== undefined);
        
        if (updateEntries.length === 0) {
            return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
        }
        
        const setClause = updateEntries.map(([key, value], index) => `"${key}" = $${index + 1}`).join(', ');
        const queryParams = updateEntries.map(([key, value]) => value);
        queryParams.push(Order_ID);

        const sql = `UPDATE public."Order" SET ${setClause} WHERE "Order_ID" = $${queryParams.length}`;

        const result = await poolQuery(sql, queryParams);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Order with ID ${Order_ID} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Order ID ${Order_ID} updated successfully.` });
    } catch (error: any) {
        console.error("Error updating order:", error);
        return NextResponse.json({ message: "Failed to update order", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get('id');
    if (!orderId) {
        return NextResponse.json({ message: "Order ID is required as a query parameter." }, { status: 400 });
    }
    try {
        const parsedOrderId = parseInt(orderId, 10);
        await poolQuery('BEGIN');
        await poolQuery('DELETE FROM public."Order_Detail" WHERE "Order_ID" = $1', [parsedOrderId]);
        const result = await poolQuery('DELETE FROM public."Order" WHERE "Order_ID" = $1', [parsedOrderId]);
        await poolQuery('COMMIT');
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Order with ID ${orderId} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Order ID ${orderId} and its details deleted successfully.` });
    } catch (error: any) {
        await poolQuery('ROLLBACK');
        console.error("Error deleting order:", error);
        return NextResponse.json({ message: "Failed to delete order", error: error.message }, { status: 500 });
    }
}