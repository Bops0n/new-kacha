'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { AddressSchema, CartDetailSchema } from '@/types';
import { calculateAvailableStock } from '@/app/utils/calculations';

/**
 * Hook สำหรับจัดการ State และ Logic ทั้งหมดของหน้าตะกร้าสินค้า (/cart)
 * - ดึงข้อมูลตะกร้าและที่อยู่
 * - จัดการการเลือกที่อยู่และช่องทางชำระเงิน
 * - อัปเดต/ลบ สินค้าในตะกร้า โดยมีการตรวจสอบสต็อกล่าสุด
 * - จัดการการสร้างคำสั่งซื้อ
 */
export function useCart() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { setCounter, decrement } = useCounter();

  const [cartItems, setCartItems] = useState<CartDetailSchema[]>([]);
  const [addressList, setAddressList] = useState<AddressSchema[]>([]);

  const [selectedAddress, setSelectedAddress] = useState<AddressSchema | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash_on_delivery'>('bank_transfer');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCartAndAddresses = useCallback(async () => {
    // if (status !== 'authenticated') {
    //   if (status === 'unauthenticated') router.push('/login');
    //   return;
    // }
    setLoading(true);
    setError(null);
    try {
      const [cartRes, addressRes] = await Promise.all([
        fetch('/api/main/cart'),
        fetch('/api/main/address'),
      ]);
      
      if (!cartRes.ok) throw new Error('ไม่สามารถดึงข้อมูลตะกร้าสินค้าได้');
      if (!addressRes.ok) throw new Error('ไม่สามารถดึงข้อมูลที่อยู่ได้');

      const cartData = await cartRes.json();
      const addressData = await addressRes.json();
      
      setCartItems(cartData.cartItems || []);
      setCounter(cartData.cartItems?.length || 0);
      setAddressList(addressData.addresses || []);
      
      if (addressData.addresses.length > 0) {
        setSelectedAddress(addressData.addresses.find((addr : AddressSchema) => addr.Is_Default) || addressData.addresses[0]);
      }
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [status, router, setCounter, showAlert]);

  useEffect(() => {
    fetchCartAndAddresses();
  }, [fetchCartAndAddresses]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const priceToUse = (item.Discount_Price !== null && item.Discount_Price < item.Sale_Price)
        ? item.Discount_Price
        : item.Sale_Price;
      return sum + (item.Cart_Quantity * priceToUse);
    }, 0);
  }, [cartItems]);
    const removeItem = useCallback((productId: number, productName: string) => {
    showAlert(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${productName} ออกจากตะกร้า?`, 'warning', 'ยืนยันการลบ', async () => {
        try {
            const response = await fetch('/api/main/cart', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            });
            if (!response.ok) throw new Error('ไม่สามารถลบสินค้าได้');
            
            setCartItems(prev => prev.filter(item => item.Product_ID !== productId));
            decrement();
            showAlert(`ลบ ${productName} ออกจากตะกร้าแล้ว`, 'success');
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [decrement, showAlert]);

  const updateItemQuantity = useCallback(async (productId: number, newQuantity: number) => {
    const item = cartItems.find(i => i.Product_ID === productId);
    if (!item) return;

    const availableStock = calculateAvailableStock(item);

    if (newQuantity < 1) {
        removeItem(productId, item.Name);
        return;
    }
    if (newQuantity > availableStock) {
        showAlert(`สินค้ามีในสต็อกเพียง ${availableStock} ชิ้น`, 'warning');
        try {
        const response = await fetch('/api/main/cart', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, newQuantity :availableStock }),
        });
        if (!response.ok) throw new Error('ไม่สามารถอัปเดตจำนวนสินค้าได้');
        setCartItems(prevItems => prevItems.map(i => i.Product_ID === productId ? { ...i, Cart_Quantity: availableStock } : i));
      } catch (err: any) {
        showAlert(err.message, 'error');
    }

        return ;
    }

    try {
        const response = await fetch('/api/main/cart', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, newQuantity }),
        });
        if (!response.ok) throw new Error('ไม่สามารถอัปเดตจำนวนสินค้าได้');
        
        setCartItems(prevItems => prevItems.map(i => i.Product_ID === productId ? { ...i, Cart_Quantity: newQuantity } : i));
    } catch (err: any) {
        showAlert(err.message, 'error');
    }
  }, [cartItems, showAlert, removeItem]);

  
  const submitOrder = useCallback(async () => {
    if (!selectedAddress) {
        showAlert('กรุณาเลือกที่อยู่สำหรับจัดส่ง', 'warning');
        return;
    }
    if (cartItems.length === 0) {
        showAlert('ตะกร้าสินค้าของคุณว่างเปล่า', 'warning');
        return;
    }

    showAlert('คุณต้องการยืนยันคำสั่งซื้อใช่หรือไม่?', 'info', 'ยืนยันการสั่งซื้อ', async () => {
        const payload = {
            addressId: selectedAddress.Address_ID,
            paymentMethod: paymentMethod,
            cartItems: cartItems.map(item => ({ Product_ID: item.Product_ID, Cart_Quantity: item.Cart_Quantity })),
            totalPrice: totalPrice,
        };

        try {
            const response = await fetch('/api/main/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const { message, orderId } = await response.json();
            if (!response.ok) throw new Error(message || 'ไม่สามารถสร้างคำสั่งซื้อได้');
            
            setCartItems([]);
            setCounter(0);
            showAlert('สั่งซื้อสำเร็จ!\nกำลังนำคุณไปยังหน้ารายละเอียดคำสั่งซื้อ...', 'success', 'สำเร็จ', () => {
                router.push(`/orders-history/${orderId}`);
            });
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [selectedAddress, cartItems, paymentMethod, totalPrice, router, showAlert, setCounter]);

  return {
    loading,
    error,
    cartItems,
    addressList,
    selectedAddress,
    paymentMethod,
    totalPrice,
    setSelectedAddress,
    setPaymentMethod,
    updateItemQuantity,
    removeItem,
    submitOrder,
  };
}