'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { Order, OrderStatus, EditOrderFormData, TransferSlipStatusFilter, SimpleProductDetail } from '@/types';

/**
 * Hook สำหรับจัดการ State และ Logic ทั้งหมดของหน้า Order Management
 */
export function useOrderManagement() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'all' as OrderStatus | 'all',
    transferSlipFilter: 'all' as TransferSlipStatusFilter,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [liveProductDetails, setLiveProductDetails] = useState<Map<number, SimpleProductDetail>>(new Map());
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/order');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);
      if(selectedOrder){
        setSelectedOrder(data.orders.find((o : Order) => o.Order_ID === selectedOrder.Order_ID) || null)
      }
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const saveOrder = async (payload: Partial<Order>) => {
    console.log(payload)
    try {
      const response = await fetch('/api/admin/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await fetchOrders();
      return true;
    } catch (err: any) {
      console.log('cheese')
      showAlert(err.message, 'error');
      return false;
    }
  };
  
  const cancelOrderWithoutSlip = useCallback(async (orderId: number, reason: string) => {
    if (!reason || reason.trim() === '') {
      showAlert('กรุณาระบุเหตุผลในการยกเลิก', 'warning');
      return false;
    }
    const success = await saveOrder({
      Order_ID: orderId,
      Status: 'cancelled',
      Cancellation_Reason: reason.trim(),
    });
    if (success) showAlert('ยกเลิกคำสั่งซื้อสำเร็จ!', 'success');
    return success;
  }, [saveOrder, showAlert]);

  const initiateRefund = useCallback((order: Order) => {
    showAlert(
      `คำสั่งซื้อนี้มีการแนบสลิปแล้ว\nระบบจะเปลี่ยนสถานะเป็น "กำลังรอคืนเงิน"`,
      'info',
      'ดำเนินการคืนเงิน',
      async () => {
        const success = await saveOrder({ Order_ID: order.Order_ID, Status: 'refunding' });
        if (success) {
          showAlert('เปลี่ยนสถานะเป็น "กำลังรอคืนเงิน" สำเร็จ', 'success');
        }
      }
    );
  }, [saveOrder, showAlert]);
  
  const confirmRefund = useCallback((order: Order) => {
    showAlert(
      'ยืนยันว่าคุณได้ทำการโอนเงินคืนให้ลูกค้าสำหรับออเดอร์นี้เรียบร้อยแล้ว?',
      'warning',
      'ยืนยันการคืนเงิน',
      async () => {
        const success = await saveOrder({ Order_ID: order.Order_ID, Status: 'refunded' });
        if (success) {
          showAlert('ยืนยันการคืนเงินสำเร็จ!', 'success');
        }
      }
    );
  }, [saveOrder, showAlert]);

  const deleteOrder = (orderId: number) => {
    showAlert(`คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อ #${orderId}?`, 'warning', 'ยืนยันการลบ', async () => {
      try {
        const response = await fetch(`/api/admin/order?id=${orderId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showAlert('ลบคำสั่งซื้อสำเร็จ!', 'success');
        await fetchOrders();
        closeModal();
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
        const hasSlip = !!order.Transfer_Slip_Image_URL;
        if (transferSlipFilter === 'has_slip' && !hasSlip) return false;
        if (transferSlipFilter === 'no_slip' && hasSlip) return false;
      }
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return order.Order_ID.toString().includes(lowerCaseSearchTerm) ||
               order.Customer_Name.toLowerCase().includes(lowerCaseSearchTerm) ||
               (order.Tracking_ID && order.Tracking_ID.toLowerCase().includes(lowerCaseSearchTerm));
      }
      return true;
    });
  }, [orders, filters]);

  const openModal = async (order: Order) => {
    setSelectedOrder(order);
    setIsEditing(false);
    if (order.Products.length > 0) {
        setIsFetchingDetails(true);
        setIsModalOpen(true);
        try {
            const productIds = order.Products.map(p => p.Product_ID!);
            const response = await fetch('/api/admin/products/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productIds }),
            });
            if (!response.ok) throw new Error('Failed to fetch product details');
            const details: SimpleProductDetail[] = await response.json();
            setLiveProductDetails(new Map(details.map(p => [p.Product_ID, p])));
        } catch (err: any) {
            showAlert(err.message, 'error');
        } finally {
            setIsFetchingDetails(false);
        }
    } else {
        setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setLiveProductDetails(new Map());
  };
  
  const toggleEditMode = () => setIsEditing(prev => !prev);

  return {
    loading,
    error,
    orders,
    filteredOrders,
    filters,
    setFilters,
    actions: { saveOrder, deleteOrder, cancelOrderWithoutSlip, initiateRefund, confirmRefund },
    modalState: {
      isOpen: isModalOpen,
      isEditing,
      order: selectedOrder,
      liveProductDetails,
      isFetchingDetails,
    },
    modalActions: {
      open: openModal,
      close: closeModal,
      toggleEdit: toggleEditMode,
    },
  };
}