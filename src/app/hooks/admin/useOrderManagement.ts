'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { Order, OrderStatus, EditOrderFormData, TransferSlipStatusFilter, SimpleProductDetail } from '@/types';

/**
 * Hook สำหรับจัดการ State และ Logic ทั้งหมดของหน้า Order Management
 * - ดึงข้อมูล, จัดการ State, กรองข้อมูล, และเชื่อมต่อ API
 * - มี Logic สำหรับ Pre-fetching ข้อมูลสินค้าล่าสุดก่อนเปิด Modal
 */
export function useOrderManagement() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'all' as OrderStatus | 'all',
    transferSlipFilter: 'all' as TransferSlipStatusFilter,
  });

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [liveProductDetails, setLiveProductDetails] = useState<Map<number, SimpleProductDetail>>(new Map());
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // --- API Interactions ---
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
    } catch (err: any)      {
        showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const saveOrder = async (payload: Partial<Order>) => {
    try {
      const response = await fetch('/api/admin/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showAlert('อัปเดตคำสั่งซื้อสำเร็จ!', 'success');
      await fetchOrders();
      return true;
    } catch (err: any) {
      showAlert(err.message, 'error');
      return false;
    }
  };

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

// --- Filtering Logic ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const { searchTerm, statusFilter, transferSlipFilter } = filters;

      // 1. ตรวจสอบ Status Filter
      // ถ้า statusFilter ไม่ใช่ 'all' และไม่ตรงกับสถานะของ order ให้คัดออก (return false)
      if (statusFilter !== 'all' && order.Status !== statusFilter) {
        return false;
      }

      // 2. ตรวจสอบ Transfer Slip Filter
      // ถ้า transferSlipFilter ไม่ใช่ 'all' ให้ตรวจสอบเงื่อนไขของสลิป
      if (transferSlipFilter !== 'all') {
        const hasSlip = !!order.Transfer_Slip_Image_URL; // ใช้ !! เพื่อแปลงเป็น boolean (true/false)
        if (transferSlipFilter === 'has_slip' && !hasSlip) return false;
        console.log(hasSlip)
        if (transferSlipFilter === 'no_slip' && hasSlip) return false;
      }

      // 3. ตรวจสอบ Search Term Filter (ถ้าไม่มี searchTerm ก็ให้ผ่าน)
      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        // ตรวจสอบว่ามีอย่างน้อยหนึ่ง field ที่ตรงกับคำค้นหา
        const searchMatch = 
          order.Order_ID.toString().includes(lowerCaseSearchTerm) ||
          order.Customer_Name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (order.Tracking_ID && order.Tracking_ID.toLowerCase().includes(lowerCaseSearchTerm));
        
        if (!searchMatch) return false;
      }

      // 4. ถ้าผ่านทุกเงื่อนไข ให้เก็บ order นี้ไว้ (return true)
      return true;
    });
  }, [orders, filters]);

  // --- Modal handlers ---
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
            if (!response.ok) throw new Error('Failed to fetch real-time product details');
            
            const details: SimpleProductDetail[] = await response.json();
            const detailsMap = new Map(details.map(p => [p.Product_ID, p]));
            setLiveProductDetails(detailsMap);
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
    actions: { saveOrder, deleteOrder },
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