// Common types for Order Status

export type OrderStatus = 'waiting_payment' | 'pending' | 'preparing' | 'shipped' | 'delivered' | 'req_cancel' | 'refunding' | 'refunded' | 'cancelled';
export type TransferSlipStatusFilter = 'all' | 'has_slip' | 'no_slip';
export type Payment_Type = 'bank_transfer' | 'cash_on_delivery'
export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

// Type for product items within an order (detailed snapshot)
export interface OrderProductDetail {
  Product_ID?: number;
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
  Current_Vat: string;

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

  // Order Receive
  Is_Received: boolean;
  Received_At: string;

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
    paymentMethod: Payment_Type;
    cartItems: OrderProductRequestBody[];
    totalPrice: number;
}

export interface OrderShipping {
  Shipping_Method: string,
  Shipping_Provider: string,
  Shipping_Date: string,
  Shipping_Cost: number,
  Vehicle_Type: string,
  Driver_Name: string,
  Driver_Phone: string,
  Tracking_Number: string,
  Tracking_URL: string,
  Internal_Note: string,
  Customer_Note: string,
  Is_Auto_Update_Status: boolean
}

export interface DbOrderRow {
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
  Current_Vat: string;

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

  // Order Receive
  Is_Received: boolean;
  Received_At: string;

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

  // product fields (nullable)
  Product_ID?: number;
  Product_Name: string;
  Product_Brand: string | null;
  Product_Unit: string;
  Product_Image_URL: string | null;
  Product_Sale_Cost: number;
  Product_Sale_Price: number;
  Product_Discount_Price: number | null;
  Quantity: number;
}

export const mapDbRowsToOrders = (dbRows: DbOrderRow[]): Order[] => {
    const ordersMap = new Map<number, Order>();

    dbRows.forEach(row => {
        const orderId = row.Order_ID;
        if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
                Order_ID: row.Order_ID,
                User_ID: row.User_ID,
                Order_Date: row.Order_Date,
                Total_Amount: row.Total_Amount,
                Status: row.Status,
                Payment_Type: row.Payment_Type,
                Is_Confirmed: row.Is_Confirmed,
                Confirmed_By: row.Confirmed_By,
                Confirmed_At: row.Confirmed_At,
                Update_By: row.Update_By,
                Update_At: row.Update_At,
                Current_Vat: row.Current_Vat,

                // Order Cancellation

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
            });
        }

        const currentOrder = ordersMap.get(orderId)!;

        if (row.Product_ID) {
            const salePrice = row.Product_Sale_Price;
            const discountPrice = row.Product_Discount_Price ? row.Product_Discount_Price : null;
            const quantity = row.Quantity;
            const pricePaidPerItem = discountPrice ?? salePrice;

            currentOrder.Products.push({
                Product_ID: row.Product_ID,
                Quantity: quantity,
                Product_Sale_Cost: row.Product_Sale_Cost,
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

interface OrderNextStepResult {
  btnNextEnable: boolean;
  lbButtonText: string;
  BackStep: string;
  NextStep: string | null;
  btnSpecial: boolean;
  isSaved: boolean;
  btnCancelOrder: boolean;
}

export function getOrderNextStep(order: Order, controller: string | null): OrderNextStepResult {
  const IsCheckOrder = controller === 'checkorder';
  const IsShipping = controller === 'shipping';
  const IsSummary = controller === 'summary';
  const IsShipped = controller === 'shipped';
  const IsRefunding = controller === 'refunding';
  const IsReqCancel = controller === 'req_cancel';
  
  const v_isRefunding = order.Status === 'refunding' && order.Is_Cancelled;
  const v_btnCancel = order.Status !== 'shipped' && order.Status !== 'delivered';

  if (IsRefunding) {
    if (order.Status === 'refunding') {
        return {
          btnNextEnable: order.Refund_Slip !== null && order.Is_Refunded,
          lbButtonText: 'ยืนยันการคืนเงิน',
          BackStep: `/admin/order-management/${order.Order_ID}?controller=checkorder`,
          NextStep: `/admin/order-management/${order.Order_ID}?controller=refunding`,
          btnSpecial: false,
          isSaved: true,
          btnCancelOrder: false,
        }
    }

    return {
      btnNextEnable: true,
      lbButtonText: 'จัดการคำสั่งซื้อ',
      BackStep: `/admin/order-management`,
      NextStep: null,
      btnSpecial: false,
      isSaved: false,
      btnCancelOrder: false,
    };
  }

  if (IsReqCancel && order.Status === 'req_cancel') {
    return {
      btnNextEnable: true,
      lbButtonText: 'จัดการคำสั่งซื้อ',
      BackStep: `/admin/order-management`,
      NextStep: null,
      btnSpecial: true,
      isSaved: false,
      btnCancelOrder: false,
    };
  }

  if (order.Status === 'cancelled' || order.Status === 'refunding' || order.Status === 'refunded' || order.Is_Cancelled) {
    return {
      btnNextEnable: v_isRefunding,
      lbButtonText: v_isRefunding ? 'ดำเนินการคืนเงิน' : 'คำสั่งซื้อถูกยกเลิก',
      BackStep: '/admin/order-management',
      NextStep: v_isRefunding
        ? `/admin/order-management/${order.Order_ID}?controller=refunding`
        : `/admin/order-management/${order.Order_ID}?controller=checkorder`,
      btnSpecial: false,
      isSaved: false,
      btnCancelOrder: false,
    };
  }

  if (IsCheckOrder) {
    const v_isPaymentChecked = order.Payment_Type === 'bank_transfer' && order.Status === 'pending' && order.Transaction_Slip !== null && order.Transaction_Status === 'pending';

    return {
      btnNextEnable: true,
      lbButtonText: !order.Is_Confirmed && ((!v_isPaymentChecked && order.Status !== 'waiting_payment') || order.Payment_Type === 'cash_on_delivery') ? 'ยืนยันคำสั่งซื้อ' : 'ถัดไป',
      BackStep: '/admin/order-management',
      NextStep: `/admin/order-management/${order.Order_ID}?controller=shipping`,
      btnSpecial: v_isPaymentChecked,
      isSaved: !order.Is_Confirmed && order.Status === 'pending' && (order.Payment_Type === 'cash_on_delivery' || order.Transaction_Status === 'confirmed'),
      btnCancelOrder: v_btnCancel,
    };
  }

  if (IsShipping) {
    return {
      btnNextEnable: true,
      lbButtonText: 'ถัดไป',
      BackStep: `/admin/order-management/${order.Order_ID}?controller=checkorder`,
      NextStep: `/admin/order-management/${order.Order_ID}?controller=summary`,
      btnSpecial: false,
      isSaved: true,
      btnCancelOrder: v_btnCancel,
    };
  }

  if (IsSummary) {
    return {
      btnNextEnable: true,
      lbButtonText: 'ถัดไป',
      BackStep: `/admin/order-management/${order.Order_ID}?controller=shipping`,
      NextStep: `/admin/order-management/${order.Order_ID}?controller=shipped`,
      btnSpecial: false,
      isSaved: false,
      btnCancelOrder: v_btnCancel,
    };
  }

  if (IsShipped) {
    if (order.Status === 'preparing') {
      return {
        btnNextEnable: true,
        lbButtonText: 'ยืนยันการจัดส่ง',
        BackStep: `/admin/order-management/${order.Order_ID}?controller=summary`,
        NextStep: `/admin/order-management/${order.Order_ID}?controller=shipped`,
        btnSpecial: false,
        isSaved: true,
        btnCancelOrder: v_btnCancel,
      };
    }
    
    return {
      btnNextEnable: true,
      lbButtonText: 'จัดการคำสั่งซื้อ',
      BackStep: `/admin/order-management/${order.Order_ID}?controller=summary`,
      NextStep: null,
      btnSpecial: false,
      isSaved: false,
      btnCancelOrder: v_btnCancel,
    };
  }

  return {
    btnNextEnable: true,
    lbButtonText: 'จัดการคำสั่งซื้อ',
    BackStep: `/admin/order-management`,
    NextStep: null,
    btnSpecial: false,
    isSaved: false,
    btnCancelOrder: false,
  };
}