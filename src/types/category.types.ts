export type CategoryType = 'main' | 'sub' | 'child';

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

export interface CategoryDisplayItem {
  ID: number;
  Name: string;
  Type: CategoryType;
  ParentId: number | null;
  ParentName?: string;
  FullPathName?: string;
}

export interface FullCategoryPath {
  Category_ID: number;
  Category_Name: string;
  Sub_Category_ID: number;
  Sub_Category_Name: string;
  Child_ID: number;
  Child_Name: string;
}

export interface CategoryFormData {
  Type: CategoryType;
  ID: number | null;
  Name: string;
  Category_ID: number | null;
  Sub_Category_ID: number | null;
}