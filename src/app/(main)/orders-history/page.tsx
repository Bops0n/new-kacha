// src/app/orders/history/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi'; // Added FiInfo
import { Order, OrderStatus } from '../../types'; // Adjust path as needed for your types.ts
import { useSession } from 'next-auth/react'; // To check user session for displaying history

// Assuming StatusConfig is either imported or defined directly in the page for convenience
// If you have it in types.ts, import it. If not, define it here.
export const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; } } = {
    pending: { label: 'รอดำเนินการ', color: 'text-yellow-700', icon: FiClock, bgColor: 'bg-yellow-100' },
    processing: { label: 'กำลังจัดเตรียม', color: 'text-blue-700', icon: FiPackage, bgColor: 'bg-blue-100' },
    shipped: { label: 'จัดส่งแล้ว', color: 'text-indigo-700', icon: FiTruck, bgColor: 'bg-indigo-100' },
    delivered: { label: 'จัดส่งสำเร็จ', color: 'text-green-700', icon: FiCheckCircle, bgColor: 'bg-green-100' },
    cancelled: { label: 'ยกเลิก', color: 'text-red-700', icon: FiXCircle, bgColor: 'bg-red-100' },
};

// Helper to format price
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(price);
};

const OrderHistoryPage: React.FC = () => {
    const { data: session, status } = useSession(); // Get session data
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (status === 'loading') return; // Do nothing while session is loading
            if (status === 'unauthenticated') {
                router.push('/login'); // Redirect to login if not authenticated
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // For a regular user, userId param is not strictly needed as API uses session.
                // For admin/staff viewing all orders, they would just call /api/orders
                // If admin wants a specific user's history, they would add ?userId=X
                const response = await fetch('/api/orders');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch order history');
                }
                const data = await response.json();
                setOrders(data.orders);
            } catch (err: any) {
                console.error('Error fetching order history:', err);
                setError(err.message || 'ไม่สามารถโหลดประวัติคำสั่งซื้อได้');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [status, router]); // Re-run when session status changes

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-xl text-gray-700">กำลังโหลดประวัติคำสั่งซื้อ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg mt-8 text-red-600">
                <h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    ลองอีกครั้ง
                </button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <FiInfo className="w-20 h-20 text-gray-400 mb-4" />
                <p className="text-xl text-gray-700 font-semibold mb-2">คุณยังไม่มีคำสั่งซื้อ</p>
                <p className="text-gray-500 mb-6 text-center">เริ่มต้นสำรวจสินค้าของเราเพื่อทำการสั่งซื้อครั้งแรก!</p>
                <Link href="/products" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-lg font-medium">
                    ดูสินค้าทั้งหมด
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center border-b-4 border-blue-600 pb-4">
                    ประวัติคำสั่งซื้อของคุณ
                </h1>

                <div className="space-y-6">
                    {orders.map((order) => {
                        const statusInfo = statusConfig[order.Status as OrderStatus];
                        const orderDate = new Date(order.Order_Date).toLocaleDateString('th-TH', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                        const deliveryDate = order.DeliveryDate
                            ? new Date(order.DeliveryDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                            : 'ยังไม่ระบุ';

                        return (
                            <div
                                key={order.Order_ID}
                                className="relative bg-gray-50 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                            >
                                <Link href={`/orders-history/${order.Order_ID}`} className="block p-5 sm:p-6 lg:p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                        <div className="mb-3 md:mb-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
                                                คำสั่งซื้อ #{order.Order_ID}
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                สั่งเมื่อ: <span className="font-medium">{orderDate}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo?.bgColor} ${statusInfo?.color} flex items-center justify-end whitespace-nowrap`}>
                                                {statusInfo?.icon && React.createElement(statusInfo.icon, { className: 'mr-1' })}
                                                {statusInfo?.label || order.Status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700 border-t border-b border-gray-200 py-4 mb-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">ยอดรวม:</p>
                                            <p className="text-lg font-bold text-green-600">{formatPrice(order.Total_Amount)}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">ประเภทชำระเงิน:</p>
                                            <p>{order.Payment_Type}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">วันที่จัดส่งโดยประมาณ:</p>
                                            <p>{deliveryDate}</p>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right mt-4">
                                        <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out">
                                            <FiEye className="mr-2 h-5 w-5" />
                                            ดูรายละเอียดคำสั่งซื้อ
                                        </button>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrderHistoryPage;