// hooks/useOrderHistory.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Order, OrderStatus } from '../../types'; // Adjust path if your types are in a different location
import { useAlert } from '../context/AlertModalContext';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiFileText, FiInfo, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from 'react-icons/fi';
import { statusConfig, statusTypeLabels } from '../utils/client';
import { useWebsiteSettings } from '../providers/WebsiteSettingProvider';
import { boolean } from 'zod';


export function useOrderHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();

  const settings = useWebsiteSettings();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>()

  const getOrderStatusNote = useCallback((order: Order | null) => {
    if (!order) return null;
    
    const { Status, Payment_Type, Is_Payment_Checked, Transaction_Slip, Transaction_Status, Transaction_Date, Order_Date, Cancel_Reason } = order;

    const formatDateTime = (dateStr: string | Date) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const baseDate = Transaction_Date ? new Date(Transaction_Date) : new Date(Order_Date);
    const expireDate = new Date(baseDate.getTime() + (settings.paymentTimeoutHours * 60 * 60 * 1000));
    const formattedExpire = formatDateTime(expireDate);
    
    // Helper: ข้อความเหตุผล (ใช้ร่วมกันทุกสถานะที่มีการยกเลิก/คืนเงิน)
    const reasonText = Cancel_Reason ? `\nเหตุผล: ${Cancel_Reason}` : '';
    
    if (Status === 'waiting_payment' && Transaction_Status === 'rejected') {
        return {
            icon: FiAlertTriangle, color: 'text-error', bgColor: 'bg-error/10', borderColor: 'border-error/20', title: 'สลิปถูกปฏิเสธ',
            message: `เจ้าหน้าที่ปฏิเสธสลิป กรุณาตรวจสอบและอัพโหลดใหม่ภายใน ${formattedExpire} `
        };
    }
    if (Status === 'pending' && Payment_Type === 'bank_transfer' && Transaction_Slip) {
        if (!Is_Payment_Checked) {
            return { icon: FiClock, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20', title: 'มีการอัปโหลดสลิปแล้ว', message: 'ระบบได้รับสลิปแล้ว รอเจ้าหน้าที่ตรวจสอบความถูกต้อง' };
        } else {
            return { icon: FiCheckCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20', title: 'สลิปถูกต้อง', message: 'ข้อมูลการชำระเงินถูกต้อง ทางร้านจะดำเนินการต่อ' };
        }
    }
    if (Status === 'waiting_payment' && Payment_Type === 'bank_transfer') {
        return { icon: FiInfo, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/20', title: 'รอชำระเงิน', message: `กรุณาชำระเงินและแนบหลักฐานภายใน ${formattedExpire} มิฉะนั้นคำสั่งซื้อจะถูกยกเลิก` };
    }

    // --- สถานะที่ต้องแสดงเหตุผล ---
    if (Status === 'refunding') {
        return { 
            icon: FiRefreshCw, color: 'text-secondary', bgColor: 'bg-secondary/10', borderColor: 'border-secondary/20', title: 'กำลังคืนเงิน', 
            message: `เจ้าหน้าที่กำลังดำเนินการคืนเงิน${reasonText}` 
        };
    }
    if (Status === 'refunded') {
        return { 
            icon: FiCheckCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20', title: 'คืนเงินสำเร็จ', 
            message: `คืนเงินเรียบร้อยแล้ว${reasonText}` 
        };
    }
    if (Status === 'cancelled' || Status === 'req_cancel') {
        return { 
            icon: statusConfig[Status].icon, color: statusConfig[Status].textColor, bgColor: statusConfig[Status].bgColor, borderColor: 'border-error/20', title: statusConfig[Status].label, 
            message: Cancel_Reason ? `เหตุผล: ${Cancel_Reason}` : 'ไม่ระบุเหตุผล' 
        };       
    }
    // ----------------------------

    if (Status === 'shipped') {
        return { icon: FiTruck, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20', title: 'สินค้าอยู่ระหว่างจัดส่ง', message: 'เมื่อได้รับสินค้าแล้ว กรุณากดปุ่ม "ยืนยันรับสินค้า" ด้านล่าง' };
    }

    const config = statusConfig[Status] || statusConfig.pending;
    return { icon: config.icon, color: config.textColor, bgColor: config.bgColor, borderColor: 'border-base-200', title: config.label, message: `สถานะปัจจุบัน: ${config.label}` };
  }, []);
  const handleConfirmReceive = (e: React.MouseEvent<HTMLButtonElement>, orderId : number, fetchOrderDetails?: () => {}) => {
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
          await fetchOrders()
          if (fetchOrderDetails) await fetchOrderDetails();
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

  const getCancelTarget = useCallback((order: Order | null) => {
    if (!order) return null;
    const hasSlip = !!order.Transaction_Slip;
    const isChecked = order.Is_Payment_Checked;

    const refunding = statusTypeLabels['refunding']
    const req_cancel = statusTypeLabels['req_cancel']
    const cancelled = statusTypeLabels['cancelled']

    if (hasSlip && isChecked) {
        return { targetStatus: 'refunding' as OrderStatus, description: `เนื่องจากมีการยืนยันชำระเงินแล้ว ระบบจะเปลี่ยนสถานะเป็น "${refunding.label}" เพื่อให้เจ้าหน้าที่ตรวจสอบและดำเนินการคืนเงิน` };
    }
    if (hasSlip && !isChecked && order.Transaction_Status !== 'rejected') {
        return { targetStatus: 'req_cancel' as OrderStatus, description: `เนื่องจากมีการแนบสลิปแล้วแต่ยังไม่ได้รับการตรวจสอบ ระบบจะเปลี่ยนสถานะเป็น "${req_cancel.label}" เพื่อให้เจ้าหน้าที่รับทราบ` };
    }
    return { targetStatus: 'cancelled' as OrderStatus, description: `รายการจะถูกเปลี่ยนสถานะเป็น "${cancelled.label}" ทันที` };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // The dependency array ensures this runs when fetchOrders is stable

  return {
    loading,
    error,
    orders,
    sessionStatus: status,
    fetchOrders,
    handleConfirmReceive,
    getCancelTarget,
    getOrderStatusNote // Expose session status for initial loading check
  };
}