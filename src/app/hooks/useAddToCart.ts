'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { ProductInventory } from '@/types';
import { calculateAvailableStock } from '@/app/utils/calculations';

export function useAddToCart() {
  const { data: session, status } = useSession();
  const { showAlert } = useAlert();
  const { increment } = useCounter();
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async (product: ProductInventory, quantity: number) => {
    
    if (status !== "authenticated" || !session?.user) {
      showAlert('กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงในตะกร้า', 'warning');
      return;
    }

    const availableStock = calculateAvailableStock(product);

    if (quantity > availableStock) {
      showAlert(`สินค้ามีในสต็อกเพียง ${availableStock} ${product.Unit}`, 'error');
      return;
    }

    showAlert(`ต้องการเพิ่ม ${product?.Name} ลงในตะกร้าจำนวน ${quantity}/${product?.Unit}?`, 'info','เพิ่มสินค้าลงตะกร้า', async () => {
      setIsAdding(true);
      try {
        const response = await fetch('/api/main/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.Product_ID, quantity }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'เกิดข้อผิดพลาด');

        increment();
        showAlert(`เพิ่ม "${product.Name}" (${quantity} ${product.Unit}) ลงตะกร้าแล้ว!`, 'success');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        showAlert(message, 'error');
      } finally {
        setIsAdding(false);
      }
    })
  };

  return { addToCart, isAdding };
}