// types/order.types.ts
import React from 'react';

// Common types for Order Status
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Type for product items within an order (detailed snapshot)
export interface OrderProductDetail {
  Product_ID?: number;
  Product_Name: string;
  Product_Brand: string | null;
  Product_Unit: string;
  Product_Image_URL: string | null;
  Quantity: number;
  Price: number;
  Discount: number;
  Subtotal?: number;
}

// Main Order type
export type Order = {
  Order_ID: number;
  User_ID: number;
  Customer_Name: string;
  Email: string | null;
  Order_Date: string;
  Total_Amount: number;
  Status: OrderStatus;
  Shipping_Address_ID: number;
  Payment_Type: string;
  Tracking_ID: string | null;
  Shipping_Carrier: string | null;
  Cancellation_Reason: string | null;
  Transfer_Slip_Image_URL: string | null;
  DeliveryDate: string | null;
  Invoice_ID: string | null;
  Address: string;
  Phone: string;
  Products: OrderProductDetail[];
};

// Type for form data when editing an order in admin panel
export interface EditFormData {
  trackingId: string;
  shippingCarrier: string;
  deliveryDate: string;
  status: OrderStatus;
  transferSlipImageUrl: string;
  cancellationReason: string;
}