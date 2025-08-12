'use client';

import React, { useMemo, useState } from 'react';
import { FiSearch, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

import { useOrderManagement } from '@/app/hooks/admin/useOrderManagement';
import { Order, OrderStatus, StatusConfig } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import OrderDetailModal from './OrderDetailModal';
import OrderRow from './OrderRow';
import OrderCard from './OrderCard';
// --- START: อัปเดต statusConfig ให้ครบทุกสถานะ ---
const statusConfig: StatusConfig = {
  pending: { label: 'รอดำเนินการ', color: 'badge-warning', icon: FiClock, bgColor: 'bg-warning/10' },
  processing: { label: 'กำลังเตรียม', color: 'badge-info', icon: FiPackage, bgColor: 'bg-info/10' },
  shipped: { label: 'จัดส่งแล้ว', color: 'badge-primary', icon: FiTruck, bgColor: 'bg-primary/10' },
  delivered: { label: 'ส่งเรียบร้อย', color: 'badge-success', icon: FiCheckCircle, bgColor: 'bg-success/10' },
  refunding: { label: 'ยกเลิก: กำลังรอคืนเงิน', color: 'badge-accent', icon: FiRefreshCw, bgColor: 'bg-accent/10' },
  refunded: { label: 'ยกเลิก: คืนเงินสำเร็จ', color: 'badge-neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10' },
  cancelled: { label: 'ยกเลิก', color: 'badge-error', icon: FiXCircle, bgColor: 'bg-error/10' },
};
// --- END: อัปเดต statusConfig ---

export default function OrderManagementPage() {
  const { 
    loading, error, orders, filteredOrders, filters, setFilters, 
    actions, modalState, modalActions 
  } = useOrderManagement();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // --- START: อัปเดต stats ให้นับสถานะใหม่ ---
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.Status === 'pending').length,
    processing: orders.filter(o => o.Status === 'processing').length,
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

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-3xl font-bold text-base-content">จัดการคำสั่งซื้อ</h1>
            <p className="text-base-content/70 mt-1">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
        </div>

        {/* --- START: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('all')}><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiPackage className="w-5 h-5 text-neutral"/></div><div><p className="text-sm">ทั้งหมด</p><p className="font-bold text-xl">{stats.total}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('pending')}><div className="flex items-center gap-3"><div className="p-2 bg-warning/10 rounded-lg"><FiClock className="w-5 h-5 text-warning"/></div><div><p className="text-sm">รอดำเนินการ</p><p className="font-bold text-xl">{stats.pending}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('processing')}><div className="flex items-center gap-3"><div className="p-2 bg-info/10 rounded-lg"><FiPackage className="w-5 h-5 text-info"/></div><div><p className="text-sm">กำลังเตรียม</p><p className="font-bold text-xl">{stats.processing}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('shipped')}><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FiTruck className="w-5 h-5 text-primary"/></div><div><p className="text-sm">จัดส่งแล้ว</p><p className="font-bold text-xl">{stats.shipped}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('delivered')}><div className="flex items-center gap-3"><div className="p-2 bg-success/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-success"/></div><div><p className="text-sm">ส่งเรียบร้อย</p><p className="font-bold text-xl">{stats.delivered}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('refunding')}><div className="flex items-center gap-3"><div className="p-2 bg-accent/10 rounded-lg"><FiRefreshCw className="w-5 h-5 text-accent"/></div><div><p className="text-sm">รอคืนเงิน</p><p className="font-bold text-xl">{stats.refunding}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('refunded')}><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-neutral"/></div><div><p className="text-sm">คืนเงินแล้ว</p><p className="font-bold text-xl">{stats.refunded}</p></div></div></div>
            <div className="card bg-base-100 shadow-sm p-4 cursor-pointer hover:bg-base-200 transition-colors" onClick={() => handleStatCardClick('cancelled')}><div className="flex items-center gap-3"><div className="p-2 bg-error/10 rounded-lg"><FiXCircle className="w-5 h-5 text-error"/></div><div><p className="text-sm">ยกเลิก</p><p className="font-bold text-xl">{stats.cancelled}</p></div></div></div>
        </div>
        {/* --- END: เพิ่ม Card สถิติใหม่ และปรับ Grid --- */}
        
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row flex-wrap gap-4">
                <input type="text" placeholder="ค้นหาด้วยรหัส, ชื่อลูกค้า, Tracking ID..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} className="input input-bordered w-full flex-1" />
                <select value={filters.statusFilter} onChange={e => { setFilters(f => ({...f, statusFilter: e.target.value as any})); setCurrentPage(1); }} className="select select-bordered w-full md:w-auto">
                    <option value="all">สถานะทั้งหมด</option>
                    {Object.keys(statusConfig).map(key => <option key={key} value={key}>{statusConfig[key as OrderStatus].label}</option>)}
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
                    <thead><tr><th>รหัส</th><th>ลูกค้า</th><th>สินค้า</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่สั่ง</th><th>Tracking ID</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {paginatedOrders.map(order => <OrderRow key={order.Order_ID} order={order} statusConfig={statusConfig} viewOrderDetails={modalActions.open} deleteOrder={actions.deleteOrder} />)}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div className="block md:hidden space-y-4">
            {paginatedOrders.map(order => <OrderCard key={order.Order_ID} order={order} statusConfig={statusConfig} viewOrderDetails={modalActions.open} />)}
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

        <OrderDetailModal 
            isOpen={modalState.isOpen}
            onClose={modalActions.close}
            order={modalState.order}
            isEditing={modalState.isEditing}
            toggleEditMode={modalActions.toggleEdit}
            onSave={actions.saveOrder}
            onCancelOrder={actions.cancelOrderWithoutSlip}
            onInitiateRefund={actions.initiateRefund}
            onConfirmRefund={actions.confirmRefund}
            statusConfig={statusConfig}
            liveProductDetails={modalState.liveProductDetails}
            isFetchingDetails={modalState.isFetchingDetails}
        />
      </div>
    </div>
  );
}