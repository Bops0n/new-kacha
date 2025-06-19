// types.ts
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'; // Ensure react-icons/fi is installed

// Existing Order Types (keep these if still needed for other parts of your app)
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type Product = {
  name: string;
  quantity: number;
  price: number;
}; // This Product type is used for Order products. It should be kept distinct from the new Product type for inventory.

export type Order = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  products: Product[]; // This refers to the Product type defined above for orders
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
    icon: React.ElementType; // This type comes from React itself, it's correct
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

// --- NEW TYPES FOR PRODUCT MANAGEMENT ---

// Type for the Product table
export type ProductInventory = {
  Product_ID: number;
  Child_ID: number; // Foreign key to Child_Sub_Category
  Name: string;
  Brand: string;
  Description: string | null;
  Unit: string;
  Quantity: number;
  Sale_Cost: number; // 'real' in SQL often maps to number in TS
  Sale_Price: number; // 'real' in SQL often maps to number in TS
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null; // Can be null if no reviews, assuming 1-5 scale or similar
  Image_URL: string | null;
};

// Type for the Category table
export type Category = {
  Category_ID: number;
  Name: string;
};

// Type for the Sub_Category table
export type SubCategory = {
  Category_ID: number;
  Sub_Category_ID: number;
  Name: string;
};

// Type for the Child_Sub_Category table (this is what Product.Child_ID links to)
export type ChildSubCategory = {
  Category_ID: number;
  Sub_Category_ID: number;
  Child_ID: number;
  Name: string;
};

// Type for product form data (for adding/editing)
// Includes fields for selecting the hierarchical category path
export type ProductEditForm = {
  Product_ID: number | null; // Null for new products
  Child_ID: number; // This will be the selected Child_ID from the dropdowns
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
  Image_URL: string; // Assuming input will be a string, can be empty
  // Fields for category selection in the form, these map to Child_ID indirectly
  Selected_Category_ID: number | null; // User's selected main category
  Selected_Sub_Category_ID: number | null; // User's selected sub-category
  Selected_Child_ID: number | null; // User's selected child-category (this will be the Child_ID used in ProductInventory)
};

// Helper type to consolidate Category information for display
export type FullCategoryPath = {
  Category_ID: number;
  Category_Name: string;
  Sub_Category_ID: number;
  Sub_Category_Name: string;
  Child_ID: number;
  Child_Name: string;
};
