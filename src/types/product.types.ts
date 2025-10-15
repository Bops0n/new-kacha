// types/product.types.ts

import { Category, ChildSubCategory, SubCategory } from "./category.types";

// Product Inventory Type
export interface ProductInventory {
  Product_ID: number;
  Child_ID: number | null;
  Name: string;
  Brand: string | null;
  Description: string | null;
  Unit: string;
  Quantity: number;
  Total_Sales: number;
  Cancellation_Count: number;
  Sale_Cost: number;
  Sale_Price: number;
  Discount_Price: number | null;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string | null;
  Dimensions: string | null;
  Material: string | null;
}

export interface SimpleProductDetail {
  Product_ID: number;
  Name: string;
  Image_URL: string | null;
  Quantity: number;             // สต็อกตั้งต้น (Base Stock)
  Total_Sales: number;          // ยอดขายสะสม
  Cancellation_Count: number;   // ยอดคืน/ยกเลิกสะสม
}

export interface ProductsPageData {
  products: ProductInventory[];
  categories: Category[];
  subCategories: SubCategory[];
  childSubCategories: ChildSubCategory[];
}

export type ProductFormData = Partial<ProductInventory> & {
  Selected_Category_ID?: number | null;
  Selected_Sub_Category_ID?: number | null;
};

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AddStockRequestBody {
  productId: number;
  amountToAdd: number;
}