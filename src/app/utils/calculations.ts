import { ProductInventory } from '@/types/product.types';

/**
 * Calculates the available stock for a product based on the perpetual inventory formula.
 * Available Stock = Quantity - Total_Sales + Cancellation_Count
 * @param product The product inventory object.
 * @returns The number of units available for sale.
 */
export function calculateAvailableStock(product: ProductInventory): number {
  if (!product) {
    return 0;
  }
  return product.Quantity - product.Total_Sales + product.Cancellation_Count;
}
