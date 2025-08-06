// app/(main)/orders-history/page.tsx (Refactored)
'use client';

import React from 'react';
import Link from 'next/link';
import { FiEye, FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import { useOrderHistory } from '../../hooks/useOrderHistory'; // << 1. Import hook
import { OrderStatus } from '../../../types';
import { formatPrice, formatDate } from '../../utils/formatters'; // << Import formatters
import LoadingSpinner from '../../components/LoadingSpinner';

// StatusConfig can be moved to a shared utils/config file if used elsewhere
export const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; } } = {
    pending: { label: 'รอดำเนินการ', color: 'text-yellow-700', icon: FiClock, bgColor: 'bg-yellow-100' },
    processing: { label: 'กำลังจัดเตรียม', color: 'text-blue-700', icon: FiPackage, bgColor: 'bg-blue-100' },
    shipped: { label: 'จัดส่งแล้ว', color: 'text-indigo-700', icon: FiTruck, bgColor: 'bg-indigo-100' },
    delivered: { label: 'จัดส่งสำเร็จ', color: 'text-green-700', icon: FiCheckCircle, bgColor: 'bg-green-100' },
    cancelled: { label: 'ยกเลิก', color: 'text-red-700', icon: FiXCircle, bgColor: 'bg-red-100' },
};

export default function OrderHistoryPage() {
    // 2. เรียกใช้ Hook เพื่อดึง State และ Logic
    const { loading, error, orders, sessionStatus } = useOrderHistory();

    // Show a spinner while session is loading, which is the initial state
    if (loading || sessionStatus === 'loading') {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 text-center text-red-600">
                <h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1>
                <p>{error}</p>
            </div>
        );
    }

    // 3. ส่วน JSX จะใช้ State จาก Hook เพื่อแสดงผล
    return (
        <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto bg-base-100 rounded-xl shadow-xl p-6 md:p-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-base-content mb-8 text-center border-b-2 border-primary pb-4">
                    ประวัติคำสั่งซื้อของคุณ
                </h1>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <FiInfo className="w-20 h-20 text-base-content/30 mx-auto mb-4" />
                        <p className="text-xl text-base-content/70 font-semibold mb-2">คุณยังไม่มีคำสั่งซื้อ</p>
                        <p className="text-base-content/60 mb-6">เริ่มสำรวจสินค้าของเราเพื่อทำการสั่งซื้อครั้งแรก!</p>
                        <Link href="/products" className="btn btn-primary">
                            ดูสินค้าทั้งหมด
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const statusInfo = statusConfig[order.Status as OrderStatus];
                            return (
                                <Link
                                    key={order.Order_ID}
                                    href={`/orders-history/${order.Order_ID}`}
                                    className="block bg-base-200 border border-transparent rounded-lg shadow-sm hover:shadow-lg hover:border-primary transition-all duration-300 p-6"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-primary">คำสั่งซื้อ #{order.Order_ID}</h2>
                                            <p className="text-sm text-base-content/70 mt-1">สั่งเมื่อ: {formatDate(order.Order_Date)}</p>
                                        </div>
                                        <div className={`mt-2 md:mt-0 badge ${statusInfo?.bgColor} ${statusInfo?.color} badge-lg`}>
                                            {statusInfo?.icon && React.createElement(statusInfo.icon, { className: 'mr-2' })}
                                            {statusInfo?.label || order.Status}
                                        </div>
                                    </div>

                                    <div className="border-t border-base-300 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-base-content">
                                        <div>
                                            <p className="font-semibold">ยอดรวม:</p>
                                            <p className="text-lg font-bold text-accent">{formatPrice(order.Total_Amount)}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold">ประเภทชำระเงิน:</p>
                                            <p>{order.Payment_Type}</p>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <p className="font-semibold">วันที่จัดส่ง (คาดการณ์):</p>
                                            <p>{order.DeliveryDate ? formatDate(order.DeliveryDate) : 'ยังไม่ระบุ'}</p>
                                        </div>
                                    </div>

                                    <div className="text-right mt-4">
                                        <button className="btn btn-sm btn-outline btn-primary">
                                            <FiEye className="mr-2" /> ดูรายละเอียด
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};