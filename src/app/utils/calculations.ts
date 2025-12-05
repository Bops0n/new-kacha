import { CartDetailSchema } from '@/types';
import { ProductFormData, ProductInventory, SimpleProductDetail } from '@/types/product.types';

/**
 * Calculates the available stock for a product based on the perpetual inventory formula.
 * Available Stock = Quantity - Total_Sales + Cancellation_Count
 * @param product The product inventory object.
 * @returns The number of units available for sale.
 */
export function calculateAvailableStock(product: ProductInventory | CartDetailSchema | SimpleProductDetail | ProductFormData ): number {
  if (!product) {
    return 0;
  }
  
  const quantity = product.Quantity ?? 0;
  const totalSales = product.Total_Sales ?? 0;
  const cancellationCount = product.Cancellation_Count ?? 0;
  
  return quantity - totalSales + cancellationCount;
}
