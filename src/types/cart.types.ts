// types/cart.types.ts

// Cart Detail Schema (as seen in API response)
// types/cart.types.ts

/**
 * Schema สำหรับข้อมูลสินค้าที่แสดงในหน้าตะกร้า
 * เพิ่ม field ที่จำเป็นสำหรับการคำนวณสต็อก
 */
export interface CartDetailSchema {
  Product_ID: number;
  Name: string;
  Brand: string;
  Unit: string;
  Sale_Price: number;
  Discount_Price: number | null;
  Image_URL: string | null;
  
  // Fields สำหรับคำนวณ Available Stock
  Quantity: number; // สต็อกตั้งต้น (Base Stock from Product table)
  Total_Sales: number;
  Cancellation_Count: number;

  // Field สำหรับจำนวนในตะกร้า
  Cart_Quantity: number;
}