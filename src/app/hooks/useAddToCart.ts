'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { ProductInventory } from '../../types';

/**
 * Custom Hook สำหรับจัดการ Logic การเพิ่มสินค้าลงตะกร้า
 * @returns {object} - ฟังก์ชัน addToCart และสถานะ isAdding
 */
export function useAddToCart() {
  const session = useSession();
  const { showAlert } = useAlert();
  const { increment } = useCounter();
  const [isAdding, setIsAdding] = useState(false); // State สำหรับบอกว่ากำลังเพิ่มสินค้าอยู่หรือไม่

  /**
   * ฟังก์ชันสำหรับเพิ่มสินค้าลงในตะกร้า
   * @param product - Object ของสินค้าที่ต้องการเพิ่ม
   * @param quantity - จำนวนที่ต้องการเพิ่ม
   */
  const addToCart = async (product: ProductInventory, quantity: number) => {
    // 1. ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
    if (session?.status !== 'authenticated') {
      showAlert('กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงในตะกร้า', 'warning', 'คุณยังไม่ได้เข้าสู่ระบบ');
      return;
    }

    // 2. ตรวจสอบว่าจำนวนสินค้าที่เลือกถูกต้อง
    if (quantity < 1 || quantity > product.Quantity) {
      showAlert('จำนวนสินค้าไม่ถูกต้อง', 'error');
      return;
    }

    setIsAdding(true);
    try {
      // 3. ส่งข้อมูลไปที่ API
      const response = await fetch('/api/main/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.Product_ID,
          quantity: quantity,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
      }

      showAlert(`คุณแน่ใจที่จะเพิ่มสินค้า "${product.Name}" (${quantity} ชิ้น) ลงในตะกร้าหรือไม่?`, 'info', 'ยืนยันการเพิ่มสินค้า', async () => {
        console.log(`เพิ่ม "${product.Name}" (${quantity} ชิ้น) ลงตะกร้าแล้ว!`)
        // 4. อัปเดต UI และแสดงข้อความสำเร็จ
        increment(); // เพิ่มจำนวนในไอคอนตะกร้าที่ Navbar
        showAlert(`เพิ่ม "${product.Name}" (${quantity} ชิ้น) ลงตะกร้าแล้ว!`, 'success', 'เพิ่มสินค้าสำเร็จ');
      });

    } catch (error: any) {
      showAlert(error.message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsAdding(false);
    }
  };

  return { addToCart, isAdding };
}