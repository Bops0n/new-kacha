'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { Order, OrderStatus, TransferSlipStatusFilter } from '@/types';

export function useOrderManagement() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true); // Loading สำหรับการโหลดครั้งแรกเท่านั้น
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'all' as OrderStatus | 'all',
    transferSlipFilter: 'all' as TransferSlipStatusFilter,
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ✅ ปรับปรุง fetchOrders ให้รองรับการโหลดแบบ Background (ไม่แสดง Spinner เต็มจอ)
  const fetchOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true); // โหลดครั้งแรกให้หมุน
    setError(null);
    try {
      const response = await fetch('/api/admin/order');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);
      
      // ถ้ามีการเปิด Modal ค้างไว้ ให้ update ข้อมูลใน Modal ด้วย
      if(selectedOrder){
        setSelectedOrder(prev => {
             if(!prev) return null;
             return data.orders.find((o : Order) => o.Order_ID === prev.Order_ID) || prev;
        })
      }
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [showAlert, selectedOrder]); // เพิ่ม dependency selectedOrder เพื่อให้รู้ว่าต้องอัปเดตตัวไหน

  useEffect(() => {
    fetchOrders();
  }, []); // เรียกแค่ครั้งแรก

  const deleteOrder = (orderId: number) => {
    showAlert(`ยืนยันที่จะลบคำสั่งซื้อ #${orderId} หรือไม่?`, 'warning', 'ยืนยันการลบ', async () => {
      try {
        const response = await fetch(`/api/admin/order?id=${orderId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showAlert('ลบคำสั่งซื้อสำเร็จ!', 'success');
        await fetchOrders();
      } catch (err: any) {
        showAlert(err.message, 'error');
      }
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const { searchTerm, statusFilter, transferSlipFilter } = filters;
      if (statusFilter !== 'all' && order.Status !== statusFilter) return false;
      if (transferSlipFilter !== 'all') {
        const hasSlip = !!order.Transaction_Slip;
        if (transferSlipFilter === 'has_slip' && !hasSlip) return false;
        if (transferSlipFilter === 'no_slip' && hasSlip) return false;
      }
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return order.Order_ID.toString().includes(lowerCaseSearchTerm) ||
               order.Customer_Name.toLowerCase().includes(lowerCaseSearchTerm) ||
               (order.Tracking_Number && order.Tracking_Number.toLowerCase().includes(lowerCaseSearchTerm));
      }
      return true;
    });
  }, [orders, filters]);

  return {
    loading,
    error,
    orders,
    filteredOrders,
    filters,
    setFilters,
    actions: { deleteOrder }
  };
}