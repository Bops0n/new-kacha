export interface TopProduct {
  Product_ID: number;
  Product_Name: string;
  Total_Sold: number;
  Revenue: number;
};

export interface RecentOrder {
  Order_ID: number;
  Customer_Name: string;
  Order_Date: string;
  Total_Amount: number;
  Status: string;
}

export interface SalesData {
  Label: string; 
  TotalSales: number;
  AvgSales: number; 
  DeviationPercent: number
}