import { Order } from "@/types";

export const mapDbRowsToOrders = (dbRows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Order_Date: row.Order_Date, // SQL ส่งมาเป็น string ที่ format แล้ว
                Status: row.Status,
                Payment_Type: row.Payment_Type,
                Invoice_ID: row.Invoice_ID,
                Shipping_Address_ID: 0, // 0 หรือ null: SQL ใหม่ไม่ได้ SELECT Address_ID มา (แต่ JOIN field มาแทน)
                DeliveryDate: row.DeliveryDate, // SQL ส่งมาเป็น string ที่ format แล้ว
                Tracking_ID: row.Tracking_ID,
                Shipping_Carrier: row.Shipping_Carrier,
                Transfer_Slip_Image_URL: row.Transaction_Slip, // <-- แก้ไข: แมปจาก OP."Transaction_Slip"
                Cancellation_Reason: row.Cancel_Reason,     // <-- แก้ไข: แมปจาก OC."Cancel_Reason"
                Address_1: row.Address_1,
                Address_2: row.Address_2,
                Sub_District: row.Sub_District,
                District: row.District,
                Province: row.Province,
                Zip_Code: row.Zip_Code,
                Phone: row.Phone,
                Total_Amount: parseFloat(row.Total_Amount),
                Return_Slip_Image_URL : row.Refund_Slip,
                cancelled : '',

                Customer_Name: row.User_FullName || 'N/A',
                Email: row.User_Email || null,
                Products: [],
                Action: { // <-- ใช้ค่าเริ่มต้น เพราะ SQL ใหม่ไม่มีข้อมูลจาก Order_Action (OA_...)
                    Order_ID: -1,
                    Status: 'pending',
                    Update_By: -1,
                    Update_Name: 'N/A',
                    Update_Date: 'N/A',
                }
            });
        }

        const currentOrder = ordersMap.get(orderId)!;

        // ส่วนนี้ยังใช้ได้เหมือนเดิม เพราะ SQL ใหม่ยังคง SELECT OD.* (Order_Detail) มา
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

        // --- ลบส่วน Action ออก ---
        // โค้ด SQL ใหม่ไม่ได้ JOIN ตาราง Order_Action (ที่ใช้ชื่อย่อ OA)
        // ดังนั้น เราจึงลบ block `if (row.OA_Order_ID)` เดิมออก
    });
    return Array.from(ordersMap.values()).sort((a, b) => b.Order_ID - a.Order_ID);
};