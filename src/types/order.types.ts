// Common types for Order Status
export type OrderStatus = 'waiting_payment' | 'pending' | 'preparing' | 'shipped' | 'delivered' | 'refunding' | 'refunded' | 'cancelled';
export type TransferSlipStatusFilter = 'all' | 'has_slip' | 'no_slip';
export type Payment_Type = 'bank_transfer' | 'cash_on_delivery'
export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

// Type for product items within an order (detailed snapshot)
export interface OrderProductDetail {
  Product_ID?: number;
  // เปลี่ยนชื่อ Field ให้ตรงกับ DB
  Product_Name: string;
  Product_Brand: string | null;
  Product_Unit: string;
  Product_Image_URL: string | null;
  Quantity: number;
  Product_Sale_Cost: number;       // ราคาต้นทุน ณ เวลาที่สั่ง
  Product_Sale_Price: number;      // ราคาขาย ณ เวลาที่สั่ง
  Product_Discount_Price: number | null; // ราคาลด ณ เวลาที่สั่ง
  Price_Paid_Per_Item : number | null;
  Subtotal?: number;
}

// export interface OrderAction {
//   Order_ID: number;
//   Status: OrderStatus;
//   Update_By: string;
//   Update_Date: string | null;
// }

// Main Order type
export type Order = {
  Order_ID: number;
  User_ID: number;
  Order_Date: string;
  Total_Amount: number;
  Status: OrderStatus;
  Payment_Type: Payment_Type;
  Is_Confirmed: boolean;
  Confirmed_By: string;
  Confirmed_At: string;
  Update_By: string;
  Update_At: string;

  // Order Cancellation
  Is_Cancelled: boolean;
  Cancel_Reason: string | null;
  Cancel_By: number;
  Cancel_Date: string;

  // Order Payment
  Is_Payment_Checked: boolean;
  Transaction_Date: string;
  Transaction_Slip: string | null;
  Transaction_Status: TransactionStatus;
  Checked_By: string;
  Checked_At: string;

  // Order Refund
  Is_Refunded: boolean;
  Refund_Slip: string | null;
  Refund_By: string;
  Refund_At: string;

  // Order Shipping
  Shipping_Method: string;
  Shipping_Provider: string;
  Shipping_Date: string;
  Shipping_Cost: number;
  Vehicle_Type: string;
  Driver_Name: string;
  Driver_Phone: string;
  Tracking_Number: string;
  Tracking_URL: string;
  Internal_Note: string;
  Customer_Note: string;
  Is_Auto_Update_Status: boolean;
  Shipping_Updated_By: string;
  Shipping_Updated_At: string;

  // Address
  Address_1: string;
  Address_2: string | null;
  Sub_District: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Phone: string;

  // Customer
  Customer_Name: string;
  Customer_Email: string | null;

  // Product Details
  Products: OrderProductDetail[];

  // Order Action History
  // Action: OrderAction;
};

// Type for form data when editing an order in admin panel
export interface EditOrderFormData {
  trackingId: string;
  shippingCarrier: string;
  deliveryDate: string;
  status: OrderStatus;
  transferSlipImageUrl: string;
  cancellationReason: string;
}


// Type for product items received in the order request body
export interface OrderProductRequestBody {
    Product_ID: number;
    Cart_Quantity: number; // This is the quantity the user wants to order
}

// Type for the full request body when placing an order
export interface PlaceOrderRequestBody {
    addressId: number;
    paymentMethod: 'COD' | 'Bank Transfer';
    cartItems: OrderProductRequestBody[];
    totalPrice: number;
}