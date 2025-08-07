// types/product.types.ts

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
  Discount_Price: number | null;
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

export interface ProductsPageData {
  products: ProductInventory[];
  categories: Category[];
  subCategories: SubCategory[];
  childSubCategories: ChildSubCategory[];
}