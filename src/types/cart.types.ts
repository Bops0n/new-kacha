// types/cart.types.ts

// Cart Detail Schema (as seen in API response)
export interface CartDetailSchema {
  Product_ID: number;
  Name: string;
  Brand: string;
  Unit: string;
  Sale_Price: number;
  Image_URL: string | null;
  Quantity: number; // Quantity in cart
  AvailableStock: number; // Available stock
}