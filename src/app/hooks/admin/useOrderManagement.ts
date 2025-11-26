'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { Order, OrderStatus, TransferSlipStatusFilter } from '@/types';

export function useOrderManagement() {
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkSteps, setBulkSteps] = useState<Record<number, any>>({});

  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'all' as OrderStatus | 'all',
    transferSlipFilter: 'all' as TransferSlipStatusFilter,
  });

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
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  async function loadBulk() {
    if (orders.length === 0) return;

    const list = orders.map(o => o.Order_ID).join(",");
    const res = await fetch(`/api/admin/order/next-step/bulk?list=${list}`);
    const data = await res.json();

    const map: Record<number, any> = {};
    data.forEach((item: any) => {
      map[item.Order_ID] = item;
    });

    setBulkSteps(map);
  }

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    loadBulk();
  }, [orders]);

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
    bulkSteps
  };
}