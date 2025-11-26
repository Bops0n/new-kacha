import { Order } from "@/types";

export const mapDbRowsToOrders = (dbRows: any[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Order_Date: row.Order_Date,
                Total_Amount: parseFloat(row.Total_Amount),
                Status: row.Status,
                Payment_Type: row.Payment_Type,
                Is_Confirmed: row.Is_Confirmed,
                Confirmed_By: row.Confirmed_By,
                Confirmed_At: row.Confirmed_At,
                Update_By: row.Update_By,
                Update_At: row.Update_At,

                Is_Cancelled: row.Is_Cancelled,
                Cancel_By: row.Cancel_By,
                Cancel_Date: row.Cancel_Date,
                Cancel_Reason: row.Cancel_Reason,

                Is_Payment_Checked: row.Is_Payment_Checked,
                Transaction_Date: row.Transaction_Date,
                Transaction_Slip: row.Transaction_Slip,
                Transaction_Status: row.Transaction_Status,
                Checked_By: row.Checked_By,
                Checked_At: row.Checked_At,

                Is_Refunded: row.Is_Refunded,
                Refund_Slip: row.Refund_Slip,
                Refund_By: row.Refund_By,
                Refund_At: row.Refund_At,

                Shipping_Method: row.Shipping_Method,
                Shipping_Provider: row.Shipping_Provider,
                Shipping_Date: row.Shipping_Date,
                Shipping_Cost: row.Shipping_Cost,
                Vehicle_Type: row.Vehicle_Type,
                Driver_Name: row.Driver_Name,
                Driver_Phone: row.Driver_Phone,
                Tracking_Number: row.Tracking_Number,
                Tracking_URL: row.Tracking_URL,
                Internal_Note: row.Internal_Note,
                Customer_Note: row.Customer_Note,
                Is_Auto_Update_Status: row.Is_Auto_Update_Status,
                Shipping_Updated_By: row.Shipping_Updated_By,
                Shipping_Updated_At: row.Shipping_Updated_At,

                Is_Received: row.Is_Received,
                Received_At: row.Received_At,

                Address_1: row.Address_1,
                Address_2: row.Address_2,
                Sub_District: row.Sub_District,
                District: row.District,
                Province: row.Province,
                Zip_Code: row.Zip_Code,
                Phone: row.Phone,
                
                Customer_Name: row.Customer_Name || 'N/A',
                Customer_Email: row.Customer_Email || null,

                Products: [],

                // Action: {
                //     Order_ID: -1,
                //     Status: 'pending',
                //     Update_By: 'N/A',
                //     Update_Date: 'N/A',
                // }
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

        // if (row.OA_Order_ID) {
        //     currentOrder.Action.Order_ID = row.OA_Order_ID;
        //     currentOrder.Action.Status = row.OA_Status;
        //     currentOrder.Action.Update_By = row.OA_Update_By;
        //     currentOrder.Action.Update_Date = row.OA_Update_Date;
        // }
    });
    return Array.from(ordersMap.values()).sort((a, b) => b.Order_ID - a.Order_ID);
};