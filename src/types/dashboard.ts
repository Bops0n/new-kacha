export interface TopProduct {
  Product_ID: number;
  Product_Name: string;
  Product_Unit: string;
  Total_Sales: number;
  Quantity: number;
  Revenue: number;
};

export interface RecentOrder {
  Order_ID: number;
  Customer_Name: string;
  Order_Date: string;
  Total_Amount: number;
  Status: string;
  Update_At: string;
}

export interface SalesData {
  Label: string; 
  TotalSales: number;
  AvgSales: number; 
  DeviationPercent: number
}

export interface LowStock {
  Product_ID: number;
  Product_Name: string;
  Category_Name: string;
  Quantity: number;
  Reorder_Point: number;
  Image_URL: string;
  Stock_Percent: number;
}

export type PEROID_TYPE = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";