'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

import { useOrderManagement } from '@/app/hooks/admin/useOrderManagement';
import { OrderStatus } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import OrderRow from './OrderRow';
import OrderCard from './OrderCard';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { statusTypeLabels } from '@/app/utils/client';
// --- END: อัปเดต statusConfig ---

export default function OrderManagementPage() {
  const { data: session } = useSession();
  const { 
    loading, 
    error, 
    orders, 
    filteredOrders, 
    filters, 
    setFilters, 
    actions
  } = useOrderManagement();

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    cancelled: orders.filter(o => o.Status === 'cancelled').length,
  }), [orders]);
  // --- END: อัปเดต stats ---

  const handleStatCardClick = (status: OrderStatus | 'all') => {
    setFilters(prev => ({ ...prev, searchTerm: '', statusFilter: status }));
    setCurrentPage(1);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center p-8 text-error"><h3>เกิดข้อผิดพลาด:</h3><p>{error}</p></div>;

  if (!session || !session.user.Order_Mgr) return <AccessDeniedPage url="/admin"/>;

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-base-content">จัดการคำสั่งซื้อ</h1>
            <p className="text-base-content/70 mt-1">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
        </div>

        {/* --- START: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-6">
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('all')}><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiPackage className="w-5 h-5 text-neutral"/></div><div><p className="text-sm">ทั้งหมด</p><p className="font-bold text-xl">{stats.total}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('waiting_payment')}><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FiClock className="w-5 h-5 text-purple-700"/></div><div><p className="text-sm">รอชำระเงิน</p><p className="font-bold text-xl">{stats.waiting_payment}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('pending')}><div className="flex items-center gap-3"><div className="p-2 bg-warning/10 rounded-lg"><FiClock className="w-5 h-5 text-warning"/></div><div><p className="text-sm">รอดำเนินการ</p><p className="font-bold text-xl">{stats.pending}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('preparing')}><div className="flex items-center gap-3"><div className="p-2 bg-info/10 rounded-lg"><FiPackage className="w-5 h-5 text-info"/></div><div><p className="text-sm">กำลังจัดเตรียม</p><p className="font-bold text-xl">{stats.preparing}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('shipped')}><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FiTruck className="w-5 h-5 text-primary"/></div><div><p className="text-sm">จัดส่งแล้ว</p><p className="font-bold text-xl">{stats.shipped}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('delivered')}><div className="flex items-center gap-3"><div className="p-2 bg-success/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-success"/></div><div><p className="text-sm">เสร็จสิ้น</p><p className="font-bold text-xl">{stats.delivered}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('refunding')}><div className="flex items-center gap-3"><div className="p-2 bg-accent/10 rounded-lg"><FiRefreshCw className="w-5 h-5 text-accent"/></div><div><p className="text-sm">รอคืนเงิน</p><p className="font-bold text-xl">{stats.refunding}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('refunded')}><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-neutral"/></div><div><p className="text-sm">คืนเงินแล้ว</p><p className="font-bold text-xl">{stats.refunded}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('cancelled')}><div className="flex items-center gap-3"><div className="p-2 bg-error/10 rounded-lg"><FiXCircle className="w-5 h-5 text-error"/></div><div><p className="text-sm">ยกเลิก</p><p className="font-bold text-xl">{stats.cancelled}</p></div></div></div>
        </div>
        {/* --- END: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
                <input type="text" placeholder="ค้นหาด้วยรหัส, ชื่อลูกค้า, Tracking Number..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} className="input input-bordered w-full flex-1" />
                <select value={filters.statusFilter} onChange={e => { setFilters(f => ({...f, statusFilter: e.target.value as any})); setCurrentPage(1); }} className="select select-bordered w-full md:w-auto">
                    <option value="all">สถานะทั้งหมด</option>
                    {Object.keys(statusTypeLabels).map(key => <option key={key} value={key}>{statusTypeLabels[key as OrderStatus].label}</option>)}
                </select>
                <select value={filters.transferSlipFilter} onChange={e => { setFilters(f => ({...f, transferSlipFilter: e.target.value as any})); setCurrentPage(1); }} className="select select-bordered w-full md:w-auto">
                    <option value="all">สถานะสลิปทั้งหมด</option>
                    <option value="has_slip">แนบสลิปแล้ว</option>
                    <option value="no_slip">ยังไม่แนบสลิป</option>
                </select>
            </div>
        </div>
        
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead><tr><th>รหัส</th><th>ลูกค้า</th><th>สินค้า</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่สั่ง</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {paginatedOrders.map(order => <OrderRow key={order.Order_ID} order={order} statusConfig={statusTypeLabels} deleteOrder={actions.deleteOrder} />)}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="block md:hidden space-y-4">
            {paginatedOrders.map(order => <OrderCard key={order.Order_ID} order={order} statusTypeLabels={statusTypeLabels} />)}
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