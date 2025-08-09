// types/order.types.ts
import React from 'react';

// Common types for Order Status
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type TransferSlipStatusFilter = 'all' | 'has_slip' | 'no_slip' | string | null;
export type Payment_Type = 'bank_transfer' | 'cash_on_delivery'
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
  Payment_Type: Payment_Type;
  Tracking_ID: string | null;
  Shipping_Carrier: string | null;
  Cancellation_Reason: string | null;
  Transfer_Slip_Image_URL: TransferSlipStatusFilter;
  DeliveryDate: string | null;
  Invoice_ID: string | null;
  Address: string;
  Phone: string;
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