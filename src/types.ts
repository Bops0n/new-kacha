// types.ts

// Existing Order/Product Types (KEEP THESE AS THEY ARE IF YOUR APP STILL USES THEM)
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// --- UPDATED Product Type for Orders (Added image_url, brand, unit) ---
export type Product = {
  name: string;
  quantity: number;
  price: number;
  image_url: string | null; // เพิ่ม image_url
  brand: string | null;     // เพิ่ม brand
  unit: string;             // เพิ่ม unit
};

export type Order = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  products: Product[]; // ใช้ Product type ที่อัปเดตแล้ว
  total: number;
  status: OrderStatus;
  orderDate: string;
  deliveryDate: string;
  address: string;
  trackingId: string | null;
  shippingCarrier: string | null;
  transferSlipImageUrl: string | null;
  cancellationReason: string | null;
};

export type StatusConfig = {
  [key in OrderStatus]: {
    label: string;
    color: string;
    icon: React.ElementType;
    bgColor: string;
  };
};

export type EditFormData = {
  trackingId: string;
  shippingCarrier: string;
  deliveryDate: string;
  status: OrderStatus;
  transferSlipImageUrl: string;
  cancellationReason: string;
};

// Existing Product Inventory Types (keep these unchanged)
export type ProductInventory = {
  Product_ID: number;
  Child_ID: number;
  Name: string;
  Brand: string;
  Description: string | null;
  Unit: string;
  Quantity: number;
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string | null;
};

export type Category = {
  Category_ID: number;
  Name: string;
};

export type SubCategory = {
  Category_ID: number;
  Sub_Category_ID: number;
  Name: string;
};

export type ChildSubCategory = {
  Category_ID: number;
  Sub_Category_ID: number;
  Child_ID: number;
  Name: string;
};

export type ProductEditForm = {
  Product_ID: number | null;
  Child_ID: number;
  Name: string;
  Brand: string;
  Description: string;
  Unit: string;
  Quantity: number;
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string;
  Selected_Category_ID: number | null;
  Selected_Sub_Category_ID: number | null;
  Selected_Child_ID: number | null;
};

export type FullCategoryPath = {
  Category_ID: number;
  Category_Name: string;
  Sub_Category_ID: number;
  Sub_Category_Name: string;
  Child_ID: number;
  Child_Name: string;
};


// Existing User Types (keep these unchanged)
export type AccessLevel = '0' | '1' | '9';

export type User = {
  User_ID: number;
  Username: string;
  Password: string;
  Full_Name: string;
  Email: string | null;
  Phone: string | null;
  Access_Level: AccessLevel;
  Token: string;
  Addresses: Address[];
};

export type Address = {
  Address_ID: number;
  User_ID: number;
  Address_1: string;
  Address_2: string | null;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Sub_District: string;
  Phone: string;
};

export type UserEditForm = {
  User_ID: number | null;
  Username: string;
  Full_Name: string;
  Email: string;
  Phone: string;
  Access_Level: AccessLevel;
  Password: string;
  Token: string;
  Addresses: Address[];
};

export type NewAddressForm = {
  Address_ID: null;
  User_ID: number;
  Address_1: string;
  Address_2: string;
  District: string;
  Province: string;
  Zip_Code: string;
  Is_Default: boolean;
  Sub_District: string;
  Phone: string;
};


export type AlertModalType = 'info' | 'success' | 'warning' | 'error';

/**
 * Interface for the props that the AlertModal component accepts.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal. If true, the modal is displayed.
 * @property {string} message - The main message text to be shown inside the alert modal.
 * @property {() => void} onClose - A callback function that is invoked when the user closes the modal (e.g., by clicking the 'OK' button).
 * @property {AlertModalType} [type='info'] - The type of alert, which determines the icon and button color. Defaults to 'info'.
 */
export interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: AlertModalType;
}
