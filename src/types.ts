import React from 'react';

// Common types for Order Status
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Configuration for Order Status display
export interface StatusConfig {
  [key: string]: {
    label: string;
    color: string; // Tailwind CSS class for badge color
    icon: React.ElementType; // Icon component from react-icons/fi
    bgColor: string; // Tailwind CSS class for background color
  };
}

// Type for product items within an order (detailed snapshot)
export interface OrderProductDetail {
  Product_ID?: number; // Optional as it might not always be needed for UI, but present in DB snapshot
  Product_Name: string;
  Product_Brand: string | null;
  Product_Unit: string;
  Product_Image_URL: string | null;
  Quantity: number;
  Price: number;
  Discount: number;
  Subtotal?: number; // Calculated on backend
}

// Main Order type (PascalCase for API/DB consistency, as requested)
// Adjusted for exact database column naming (PascalCase WITHOUT underscores for general fields,
// and PascalCase WITH underscores for specific fields as requested by user's initial proposal).
export type Order = {
  Order_ID: number;
  User_ID: number;
  Customer_Name: string; // From User table, not Order table
  Email: string | null;   // From User table, not Order table
  Order_Date: string; // ISO 8601 string
  Total_Amount: number;
  Status: OrderStatus;
  Shipping_Address_ID: number; // Matches DB "Address_ID"
  Payment_Type: string; // e.g., 'Bank Transfer', 'Cash on Delivery'
  Tracking_ID: string | null; // **Adjusted to use underscore as requested for consistency**
  Shipping_Carrier: string | null; // **Adjusted to use underscore as requested for consistency**
  Cancellation_Reason: string | null; // **Adjusted to use underscore as requested for consistency**
  Transfer_Slip_Image_URL: string | null; // **Adjusted to use underscore as requested for consistency**
  DeliveryDate: string | null; // ISO 8601 string
  Invoice_ID: string | null;
  Address: string; // Snapshotted full address string
  Phone: string; // Snapshotted phone number
  Products: OrderProductDetail[]; // Using the detailed OrderProductDetail type
};


// Type for form data when editing an order in admin panel
export interface EditFormData {
  trackingId: string; // Form field names can be camelCase for convenience
  shippingCarrier: string; // Form field names can be camelCase for convenience
  deliveryDate: string;
  status: OrderStatus;
  transferSlipImageUrl: string; // Form field names can be camelCase for convenience
  cancellationReason: string; // Form field names can be camelCase for convenience
}

// User schema
export interface UserSchema {
  User_ID: number;
  Username: string;
  Full_Name: string;
  Email: string | null;
  Phone: string | null;
  Access_Level: '0' | '1' | '9'; // Access levels
  Token?: string | null; // Token is usually not passed to frontend directly or used from session
  Addresses?: AddressSchema[]; // Addresses can be nested, but often fetched separately
}

// Address schema
export interface AddressSchema {
  Address_ID: number;
  User_ID: number;
  Address_1: string;
  Address_2: string | null;
  Sub_District: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Phone: string | null;
}

// Data structure for user profile page
export interface UserProfilePageData {
  user: UserSchema;
  addresses: AddressSchema[];
}

// Form data for adding/editing a new address
export interface NewAddressForm {
  Address_ID: number | null; // For editing existing, null for new
  User_ID: number; // Will be set by parent component or session
  Address_1: string;
  Address_2: string | null;
  Sub_District: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Phone: string; // Required for form submission, though DB may allow null
}

// Type for User Edit Form (for admin user management)
export interface UserEditForm {
  User_ID: number | null; // Null for new users, ID for existing
  Username: string;
  Password?: string; // Optional for edit, required for add
  Full_Name: string;
  Email: string | null;
  Phone: string | null;
  Access_Level: '0' | '1' | '9';
  Token: string | null;
  Addresses: AddressSchema[]; // User's addresses
}

// Access level type
export type AccessLevel = '0' | '1' | '9';


// Product Inventory Type
export interface ProductInventory {
  Product_ID: number;
  Child_ID: number | null;
  Name: string;
  Brand: string | null;
  Description: string | null;
  Unit: string;
  Quantity: number;
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string | null;
  Dimensions: string | null;
  Material: string | null;
}

// Category types
export interface Category {
  Category_ID: number;
  Name: string;
}

export interface SubCategory {
  Category_ID: number;
  Sub_Category_ID: number;
  Name: string;
}

export interface ChildSubCategory {
  Category_ID: number;
  Sub_Category_ID: number;
  Child_ID: number;
  Name: string;
}

// Full category path for display
export interface FullCategoryPath {
  Category_ID: number;
  Category_Name: string;
  Sub_Category_ID: number;
  Sub_Category_Name: string;
  Child_ID: number;
  Child_Name: string;
}

// Alert Modal Types
export type AlertModalType = 'info' | 'success' | 'warning' | 'error';

export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: AlertModalType;
  title?: string;
  onConfirm?: () => void;
}

// Cart Detail Schema (as seen in API response)
export interface CartDetailSchema {
  Product_ID: number;
  Name: string;
  Brand: string;
  Unit: string;
  Sale_Price: number;
  Image_URL: string | null;
  Quantity: number; // Quantity in cart
  AvailableStock: number; // Available stock (from ProductInventory.Quantity)
}