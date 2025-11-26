// hooks/useOrderHistory.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Order, OrderStatus } from '../../types'; // Adjust path if your types are in a different location
import { useAlert } from '../context/AlertModalContext';
import { FiCheckCircle, FiClock, FiFileText, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi';


export function useOrderHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>()


  const handleConfirmReceive = (e: React.MouseEvent<HTMLButtonElement>, orderId : number) => {
    e.preventDefault(); // ป้องกันการทำงาน Default ของปุ่ม (เช่น การ Submit Form)
      showAlert(
        'คุณได้รับสินค้าและตรวจสอบความถูกต้องเรียบร้อยแล้วใช่หรือไม่?', // Message
        'info', // Type
        'ยืนยันการรับสินค้า', // Title
        async () => { // onConfirm Callback
          setIsConfirming(true);
          try {
            // เรียก API ยืนยันรับของ
            const response = await fetch(`/api/main/orders/${orderId}/receive`, {
              method: 'PATCH',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะเป็น Delivered
            fetchOrders()
            showAlert('ยืนยันการรับสินค้าเรียบร้อยแล้ว ขอบคุณที่ใช้บริการครับ', 'success');
          } catch (err: any) {
            showAlert(err.message, 'error');
          } finally {
            setIsConfirming(false);
          }
        }
      );
    };
  const fetchOrders = useCallback(async () => {
    // Wait until session is loaded
    // if (status === 'loading') {
    //   return;
    // }
    // // Redirect if unauthenticated
    // if (status === 'unauthenticated') {
    //   router.push('/login');
    //   return;
    // }

    setLoading(true);
    setError(null);
    try {
      // The API endpoint for the currently logged-in user's orders
      const response = await fetch('/api/main/orders'); // Use the new API route
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลประวัติคำสั่งซื้อได้');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [status, router, showAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // The dependency array ensures this runs when fetchOrders is stable

  return {
    loading,
    error,
    orders,
    sessionStatus: status,
    fetchOrders,
    handleConfirmReceive, // Expose session status for initial loading check
  };
}