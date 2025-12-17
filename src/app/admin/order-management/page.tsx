'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiPackage, FiSearch } from 'react-icons/fi';

import { useOrderManagement } from '@/app/hooks/admin/useOrderManagement';
import { OrderStatus, TransferSlipStatusFilter } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import OrderRow from './OrderRow';
import OrderCard from './OrderCard';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { ORDER_STATUS_CONFIG } from '@/app/utils/client';

export default function OrderManagementPage() {
  const { data: session } = useSession();
  const { 
    loading, 
    error, 
    orders, 
    filteredOrders, 
    filters, 
    setFilters,
    fetchOrders
  } = useOrderManagement();

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchOrders]);

  const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage, setItemsPerPage] = useState(10);

  const itemsPerPage = 10;

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // --- START: อัปเดต stats ให้นับสถานะใหม่ ---
  const stats = useMemo(() => ({
    total: orders.length,
    waiting_payment: orders.filter(o => o.Status === 'waiting_payment').length,
    pending: orders.filter(o => o.Status === 'pending').length,
    preparing: orders.filter(o => o.Status === 'preparing').length,
    shipped: orders.filter(o => o.Status === 'shipped').length,
    delivered: orders.filter(o => o.Status === 'delivered').length,
    refunding: orders.filter(o => o.Status === 'refunding').length,
    refunded: orders.filter(o => o.Status === 'refunded').length,
    req_cancel: orders.filter(o => o.Status === 'req_cancel').length,
    cancelled: orders.filter(o => o.Status === 'cancelled').length,
  }), [orders]);
  // --- END: อัปเดต stats ---

  const handleStatCardClick = (status: OrderStatus | 'all') => {
    setFilters(prev => ({ ...prev, searchTerm: '', statusFilter: status }));
    setCurrentPage(1);
  };

  const STATUS_ORDER: OrderStatus[] = [
    'waiting_payment',
    'pending',
    'preparing',
    'shipped',
    'delivered',
    'refunding',
    'refunded',
    'req_cancel',
    'cancelled',
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center p-8 text-error"><h3>เกิดข้อผิดพลาด:</h3><p>{error}</p></div>;

  if (!session || !session.user?.Order_Mgr) return <AccessDeniedPage url="/admin"/>;

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-base-content">จัดการคำสั่งซื้อ</h1>
            <p className="text-base-content/70 mt-1">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
        </div>

        {/* --- START: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-5 mb-6">
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('all')}><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiPackage className="w-5 h-5 text-neutral"/></div><div><p className="text-sm">ทั้งหมด</p><p className="font-bold text-xl">{stats.total}</p></div></div></div>
            
            {STATUS_ORDER.map((status) => {
              const config = ORDER_STATUS_CONFIG[status];
              const Icon = config.icon;

              return (
                <div
                  key={status}
                  className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" 
                  onClick={() => handleStatCardClick(status)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.textColor}`}/>
                    </div>
                    <div>
                      <p className="text-sm">{config.label}</p>
                      <p className="font-bold text-xl">{stats[status as keyof typeof stats] ?? 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {/* --- END: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4 z-10" />
                        <input type="text" placeholder="ค้นหาด้วยรหัส, ชื่อลูกค้า, Tracking Number..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} className="input input-bordered w-full flex-1 pl-10" />
                    </div>
                </div>
                <select value={filters.statusFilter} onChange={e => { setFilters(f => ({...f, statusFilter: e.target.value as OrderStatus | 'all'})); setCurrentPage(1); }} className="select select-bordered w-full md:w-auto">
                    <option value="all">สถานะทั้งหมด</option>
                    {STATUS_ORDER.map((status) => {
                      const config = ORDER_STATUS_CONFIG[status];
                      return (
                        <option key={status} value={status}>{config.label}</option>
                      )
                    })}
                </select>
                <select value={filters.transferSlipFilter} onChange={e => { setFilters(f => ({...f, transferSlipFilter: e.target.value as TransferSlipStatusFilter})); setCurrentPage(1); }} className="select select-bordered w-full md:w-auto">
                    <option value="all">สถานะสลิปทั้งหมด</option>
                    <option value="has_slip">แนบสลิปแล้ว</option>
                    <option value="no_slip">ยังไม่แนบสลิป</option>
                </select>
            </div>
        </div>
        
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead><tr><th>หมายเลขคำสั่งซื้อ</th><th>ลูกค้า</th><th>สินค้า</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่สั่งซื้อ​ล่าสุด</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {paginatedOrders.map(order => <OrderRow key={order.Order_ID} order={order} statusConfig={ORDER_STATUS_CONFIG} fetchOrders={fetchOrders} />)}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="block md:hidden space-y-4">
            {paginatedOrders.map(order => <OrderCard key={order.Order_ID} order={order} statusConfig={ORDER_STATUS_CONFIG} />)}
        </div>
        
        {totalPages > 0 && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItemsCount={filteredOrders.length}
                itemsPerPage={itemsPerPage}
            />
        )}
      </div>
    </div>
  );
}