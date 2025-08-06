// hooks/useCart.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { AddressSchema, CartDetailSchema as CartProduct } from '../../types';

export function useCart() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { setCounter, decrement } = useCounter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [addressList, setAddressList] = useState<AddressSchema[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressSchema | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'COD'>('Bank Transfer');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchCartAndAddresses = useCallback(async () => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') router.push('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // API routes are now grouped under /main to match the new structure
      const [cartRes, addressRes] = await Promise.all([
        fetch('/api/main/cart'),
        fetch('/api/main/address'),
      ]);

      if (!cartRes.ok) throw new Error('ไม่สามารถดึงข้อมูลตะกร้าสินค้าได้');
      if (!addressRes.ok) throw new Error('ไม่สามารถดึงข้อมูลที่อยู่ได้');

      const cartData = await cartRes.json();
      const addressData = await addressRes.json();

      const fetchedCartItems: CartProduct[] = cartData.cartItems || [];
      const fetchedAddresses: AddressSchema[] = addressData.addresses || [];

      setCartItems(fetchedCartItems);
      setCounter(fetchedCartItems.length);
      setAddressList(fetchedAddresses);

      // Set default address after fetching
      if (fetchedAddresses.length > 0) {
        setSelectedAddress(fetchedAddresses.find(addr => addr.Is_Default) || fetchedAddresses[0]);
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

  // --- Calculations ---
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.Quantity * item.Sale_Price), 0);
  }, [cartItems]);

  // --- Cart Actions ---
  const updateItemQuantity = useCallback(async (productId: number, newQuantity: number) => {
    const item = cartItems.find(i => i.Product_ID === productId);
    if (!item) return;

    if (newQuantity < 1) {
        showAlert('จำนวนสินค้าต้องไม่น้อยกว่า 1 ชิ้น', 'warning');
        return;
    }
     if (newQuantity > item.AvailableStock) {
        showAlert(`สินค้ามีในสต็อกเพียง ${item.AvailableStock} ชิ้น`, 'warning');
        return;
    }

    try {
        const response = await fetch('/api/main/cart', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, newQuantity }),
        });
        if (!response.ok) throw new Error('ไม่สามารถอัปเดตจำนวนสินค้าได้');
        
        // Update state locally for immediate UI feedback
        setCartItems(prevItems => prevItems.map(i => i.Product_ID === productId ? { ...i, Quantity: newQuantity } : i));
    } catch (err: any) {
        showAlert(err.message, 'error');
    }
  }, [cartItems, showAlert]);

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
            decrement(); // Update cart counter
            showAlert(`ลบ ${productName} ออกจากตะกร้าแล้ว`, 'success');
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [decrement, showAlert]);

  // --- Order Submission ---
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
            cartItems: cartItems.map(item => ({ Product_ID: item.Product_ID, CartQuantity: item.Quantity })),
            totalPrice: totalPrice,
        };

        try {
            const response = await fetch('/api/main/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'ไม่สามารถสร้างคำสั่งซื้อได้');

            setCartItems([]);
            setCounter(0);
            router.push('/orders-history');
            showAlert('สั่งซื้อสำเร็จ!', 'success', 'สำเร็จ', () => {
            });
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [selectedAddress, cartItems, paymentMethod, totalPrice, router, showAlert, setCounter]);

  return {
    // State
    loading,
    error,
    cartItems,
    addressList,
    selectedAddress,
    paymentMethod,
    totalPrice,

    // Actions
    setSelectedAddress,
    setPaymentMethod,
    updateItemQuantity,
    removeItem,
    submitOrder,
  };
}