'use client';

import React from 'react';
import Link from 'next/link';
import {
  FiEye,
  FiClock,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiRefreshCw,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';
import { useOrderHistory } from '../../hooks/useOrderHistory';
import { OrderStatus } from '../../../types';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { statusConfig } from '@/app/utils/client';
// import { useAlert } from '@/app/context/AlertModalContext'; // ไม่ได้ใช้ในหน้านี้โดยตรง แต่ใช้ผ่าน hook

// Status Config พร้อมสีและไอคอนที่สวยงาม

export default function OrderHistoryPage() {
  // เรียกใช้ Hook เพื่อดึง State และ Logic
  const { loading, error, orders, sessionStatus, handleConfirmReceive} = useOrderHistory();

  // Loading State
  if (loading || sessionStatus === 'loading') {
    return <LoadingSpinner />;
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-base-200">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <FiAlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary w-full">ลองใหม่อีกครั้ง</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-end border-b border-base-300 pb-4">
            <div>
                <h1 className="text-3xl font-extrabold text-base-content tracking-tight">ประวัติคำสั่งซื้อ</h1>
                <p className="text-base-content/60 mt-1">รายการสั่งซื้อและสถานะพัสดุของคุณ</p>
            </div>
            {/* อาจเพิ่มปุ่มติดต่อเจ้าหน้าที่ตรงนี้ในอนาคต */}
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-2xl shadow-sm border border-base-200 text-center">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <FiPackage className="w-10 h-10 text-base-content/30" />
            </div>
            <h2 className="text-xl font-bold text-base-content mb-2">คุณยังไม่มีคำสั่งซื้อ</h2>
            <p className="text-base-content/60 max-w-md mb-8">เริ่มเลือกซื้อสินค้าคุณภาพจากเรา เพื่อสร้างบ้านในฝันของคุณได้เลย</p>
            <Link href="/products" className="btn btn-primary px-8">
              เลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          // Orders List
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.Status as OrderStatus] || statusConfig.pending;
              const isRejected = order.Transaction_Status === 'rejected';
              const isShipped = order.Status === 'shipped';

              return (
                <div key={order.Order_ID} className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-200 overflow-hidden group">
                    <Link href={`/orders-history/${order.Order_ID}`} className="block h-full w-full">
                        <div className="card-body p-6">
                            
                            {/* Card Header: Order ID & Status */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-primary group-hover:underline decoration-2 underline-offset-2">
                                            คำสั่งซื้อ #{order.Order_ID}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-base-content/60 mt-1 flex items-center gap-1">
                                        <FiClock className="w-3 h-3" /> สั่งเมื่อ: {new Date(order.Order_Date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className={`badge border-none px-3 py-4 rounded-lg font-medium flex items-center gap-2 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                    {statusInfo.icon && <statusInfo.icon className="w-4 h-4" />}
                                    {statusInfo.label}
                                </div>
                            </div>

                            <div className="divider my-0"></div>

                            {/* Card Content: Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
                                <div>
                                    <p className="text-xs text-base-content/50 font-bold uppercase tracking-wider mb-1">ยอดรวมสุทธิ</p>
                                    <p className="text-xl font-bold text-primary/90">{formatPrice(order.Total_Amount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-base-content/50 font-bold uppercase tracking-wider mb-1">ช่องทางชำระเงิน</p>
                                    <p className="text-base font-medium text-base-content/80">
                                        {order.Payment_Type === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 'เก็บเงินปลายทาง (COD)'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-base-content/50 font-bold uppercase tracking-wider mb-1">วันที่ถูกจัดส่ง</p>
                                    <p className={`text-base font-medium ${order.Shipping_Date ? 'text-base-content/80' : 'text-base-content/40 italic'}`}>
                                        {order.Shipping_Date 
                                            ? new Date(order.Shipping_Date).toLocaleDateString('th-TH') 
                                            : 'รออัปเดต'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Alerts & Actions Section */}
                            {(isRejected || isShipped) && (
                                <div className={`mt-4 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn ${isRejected ? 'bg-error/10 border border-error/20' : 'bg-success/10 border border-success/20'}`}>
                                    {/* Alert Message */}
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        {isRejected && (
                                            <>
                                                <div className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center flex-shrink-0">
                                                    <FiXCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-error">การชำระเงินถูกปฏิเสธ กรุณาตรวจสอบหลักฐานแล้วอัปโหลดใหม่อีกครั้ง</span>
                                            </>
                                        )}
                                        {isShipped && (
                                            <>
                                                <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center flex-shrink-0">
                                                    <FiTruck className="w-5 h-5" />
                                                </div>
                                                <span className="text-success">สินค้าอยู่ระหว่างการจัดส่ง หากได้รับแล้วกรุณากดยืนยัน</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Confirm Button (Specific Action) */}
                                    {isShipped && (
                                        <button 
                                            className="btn btn-sm btn-success text-white shadow-sm hover:shadow-md border-none px-4 flex-shrink-0 w-full sm:w-auto"
                                            onClick={(e) => handleConfirmReceive(e, order.Order_ID)}
                                        >
                                            <FiCheckCircle className="w-4 h-4 mr-1" /> ยืนยันรับสินค้า
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            {/* Footer Action */}
                            <div className="mt-4 flex justify-end">
                                <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    ดูรายละเอียดคำสั่งซื้อ <FiEye />
                                </span>
                            </div>

                        </div>
                    </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}