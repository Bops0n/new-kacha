'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiPrinter, FiArrowLeft, FiFilter, FiCheck, FiFileText, FiTruck, FiX, FiDollarSign } from 'react-icons/fi';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

interface ReportOrder {
    Order_ID: number;
    Order_Date: string;
    Customer_Name: string;
    Total_Amount: number;
    Payment_Type: string;
    Status: string;
    Item_Count: number;
    Transaction_Slip: string | null;
    Is_Payment_Checked: boolean;
}

const statusLabels: Record<string, string> = {
    waiting_payment: 'รอชำระเงิน',
    pending: 'รอดำเนินการ',
    preparing: 'กำลังจัดเตรียม',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งเรียบร้อย',
    req_cancel: 'ขอยกเลิก',
    refunding: 'กำลังคืนเงิน',
    refunded: 'คืนเงินสำเร็จ',
    cancelled: 'ยกเลิก',
};

const allStatuses = Object.keys(statusLabels);

export default function DailyReportPage() {
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState<ReportOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(allStatuses);

    const fetchReport = async (selectedDate: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/report/daily?date=${selectedDate}`);
            const data = await res.json();
            if (res.ok) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(date);
    }, [date]);

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const toggleAll = () => {
        setSelectedStatuses(selectedStatuses.length === allStatuses.length ? [] : allStatuses);
    };

    const filteredOrders = useMemo(() => orders.filter(o => selectedStatuses.includes(o.Status)), [orders, selectedStatuses]);

    const summary = useMemo(() => {
        const revenueOrders = filteredOrders.filter(o => !['cancelled', 'refunded', 'refunding', 'req_cancel'].includes(o.Status));
        return {
            totalCount: filteredOrders.length,
            revenueCount: revenueOrders.length,
            totalRevenue: revenueOrders.reduce((sum, o) => sum + Number(o.Total_Amount), 0)
        };
    }, [filteredOrders]);

    const groupedOrders = useMemo(() => {
        const groups: Record<string, ReportOrder[]> = {};
        allStatuses.forEach(status => {
            if (selectedStatuses.includes(status)) {
                const items = orders.filter(o => o.Status === status);
                if (items.length > 0) groups[status] = items;
            }
        });
        return groups;
    }, [orders, selectedStatuses]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* CSS สำหรับ Print Mode */}
            <style jsx global>{`
                @media print {
                    /* 1. ซ่อนทุกอย่างก่อน */
                    body * { visibility: hidden; }
                    
                    /* 2. ปิดส่วนหน้าจอคอม */
                    #screen-view { display: none !important; }

                    /* 3. เปิดส่วนพิมพ์ และบังคับให้แสดงผล (แก้ display: none จาก class hidden) */
                    #print-view, #print-view * { 
                        visibility: visible; 
                    }
                    #print-view {
                        display: block !important; /* <--- สำคัญมาก: บังคับให้แสดง */
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        background-color: white; 
                        padding: 0; 
                        margin: 0;
                    }

                    @page { size: A4; margin: 15mm; }
                    
                    /* ป้องกันตารางขาดครึ่ง */
                    tr { page-break-inside: avoid; }
                    .status-section { page-break-inside: avoid; }
                }
            `}</style>

            {/* ========================================== */}
            {/* ส่วนที่ 1: SCREEN VIEW (แสดงบนหน้าจอคอม) */}
            {/* ========================================== */}
            <div id="screen-view" className="min-h-screen bg-base-200 p-6 lg:p-8 font-sarabun print:hidden">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="btn btn-circle btn-ghost">
                                <FiArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-base-content">รายงานยอดขายรายวัน</h1>
                                <p className="text-base-content/70">จัดการและพิมพ์รายงานประจำวัน</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text font-semibold">เลือกวันที่</span></label>
                                <input type="date" className="input input-bordered shadow-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <button onClick={handlePrint} className="btn btn-primary shadow-md">
                                <FiPrinter className="mr-2" /> พิมพ์รายงาน PDF
                            </button>
                        </div>
                    </div>

                    {/* Summary Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card bg-base-100 shadow-md border-l-4 border-primary">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">รายการที่เลือก</h2>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-primary">{summary.totalCount}</span>
                                    <span className="text-sm mb-1">รายการ</span>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-md border-l-4 border-secondary">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">รายการนับยอดขาย</h2>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-secondary">{summary.revenueCount}</span>
                                    <span className="text-sm mb-1">รายการ</span>
                                </div>
                                <p className="text-xs text-base-content/40">(ไม่รวม ยกเลิก/คืนเงิน)</p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-md border-l-4 border-success">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">ยอดขายรวมสุทธิ</h2>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-success">{formatPrice(summary.totalRevenue)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Content Wrapper */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* Sidebar Filter */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="card bg-base-100 shadow-md compact">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold flex items-center gap-2"><FiFilter/> กรองสถานะ</h3>
                                        <button onClick={toggleAll} className="btn btn-xs btn-ghost text-primary">
                                            {selectedStatuses.length === allStatuses.length ? 'ล้าง' : 'เลือกหมด'}
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {allStatuses.map(status => (
                                            <label key={status} className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded-lg p-2 -mx-2 transition-colors">
                                                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={selectedStatuses.includes(status)} onChange={() => toggleStatus(status)} />
                                                <span className="label-text">{statusLabels[status]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-6">
                            {loading ? <LoadingSpinner /> : (
                                Object.keys(groupedOrders).length === 0 ? (
                                    <div className="alert">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>
                                ) : (
                                    Object.keys(groupedOrders).map(status => {
                                        const groupItems = groupedOrders[status];
                                        return (
                                            <div key={status} className="card bg-base-100 shadow-md overflow-hidden">
                                                <div className="bg-base-200/50 px-6 py-3 border-b border-base-200 flex justify-between items-center">
                                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                                        <span className={`badge badge-sm ${['cancelled', 'refunded'].includes(status) ? 'badge-error' : 'badge-primary'}`}></span>
                                                        {statusLabels[status]}
                                                    </h3>
                                                    <span className="badge badge-ghost">{groupItems.length} รายการ</span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="table table-zebra w-full">
                                                        <thead>
                                                            <tr>
                                                                <th>รหัส</th>
                                                                <th>เวลา</th>
                                                                <th>ลูกค้า</th>
                                                                <th className="text-center">สินค้า</th>
                                                                <th>ชำระเงิน</th>
                                                                <th>สลิป</th>
                                                                <th className="text-right">ยอดเงิน</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {groupItems.map((order) => (
                                                                <tr key={order.Order_ID}>
                                                                    <td className="font-bold">#{order.Order_ID}</td>
                                                                    <td>{new Date(order.Order_Date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                                                                    <td>{order.Customer_Name}</td>
                                                                    <td className="text-center">{order.Item_Count}</td>
                                                                    <td>{order.Payment_Type === 'bank_transfer' ? 'โอนเงิน' : 'ปลายทาง'}</td>
                                                                    <td>
                                                                        {order.Payment_Type === 'cash_on_delivery' ? '-' :
                                                                            order.Is_Payment_Checked ? <span className="text-success flex items-center gap-1"><FiCheck/> ตรวจแล้ว</span> :
                                                                            order.Transaction_Slip ? <span className="text-warning flex items-center gap-1"><FiFileText/> รอตรวจ</span> :
                                                                            <span className="text-error flex items-center gap-1"><FiX/> ยังไม่แนบ</span>
                                                                        }
                                                                    </td>
                                                                    <td className="text-right font-bold">{formatPrice(order.Total_Amount)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* ส่วนที่ 2: PRINT VIEW (แสดงตอนสั่งพิมพ์เท่านั้น) */}
            {/* ========================================== */}
            {/* class 'hidden' ตรงนี้จะถูก override ด้วย display: block !important ใน @media print */}
            <div id="print-view" className="hidden">
                {/* หัวรายงาน A4 */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-black">บริษัท คชาโฮม จำกัด</h1>
                            <p className="text-sm text-black">123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพฯ 10110</p>
                            <p className="text-sm text-black">โทร: 081-896-2687 | เลขประจำตัวผู้เสียภาษี: 010555XXXXXXX</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-semibold text-black">รายงานสรุปยอดขาย</h2>
                            <p className="text-sm text-black">วันที่: {new Date(date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
                        </div>
                    </div>
                </div>

                {/* สรุปยอด A4 */}
                <div className="flex gap-4 mb-6 border-b border-black pb-4">
                    <div className="flex-1 border border-black p-2">
                        <div className="text-xs font-bold">รายการที่เลือก</div>
                        <div className="text-xl font-bold">{summary.totalCount}</div>
                    </div>
                    <div className="flex-1 border border-black p-2">
                        <div className="text-xs font-bold">นับยอดขาย</div>
                        <div className="text-xl font-bold">{summary.revenueCount}</div>
                    </div>
                    <div className="flex-1 border border-black p-2 bg-gray-100">
                        <div className="text-xs font-bold">ยอดขายรวมสุทธิ</div>
                        <div className="text-xl font-bold">{formatPrice(summary.totalRevenue)}</div>
                    </div>
                </div>

                {/* ตารางข้อมูล A4 */}
                <div className="space-y-6">
                    {Object.keys(groupedOrders).map(status => {
                        const groupItems = groupedOrders[status];
                        const groupTotal = groupItems.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
                        return (
                            <div key={status} className="status-section">
                                <h3 className="font-bold text-lg mb-2 border-l-4 border-black pl-2 text-black">
                                    {statusLabels[status]} ({groupItems.length})
                                </h3>
                                <table className="w-full text-sm border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border border-black px-2 py-1 w-16">รหัส</th>
                                            <th className="border border-black px-2 py-1 w-20">เวลา</th>
                                            <th className="border border-black px-2 py-1">ลูกค้า</th>
                                            <th className="border border-black px-2 py-1 w-12 text-center">สินค้า</th>
                                            <th className="border border-black px-2 py-1 w-20">ชำระเงิน</th>
                                            <th className="border border-black px-2 py-1 w-20">สถานะสลิป</th>
                                            <th className="border border-black px-2 py-1 w-24 text-right">ยอดเงิน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupItems.map((order) => (
                                            <tr key={order.Order_ID}>
                                                <td className="border border-black px-2 py-1 text-center">#{order.Order_ID}</td>
                                                <td className="border border-black px-2 py-1 text-center">{new Date(order.Order_Date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="border border-black px-2 py-1 truncate max-w-[120px]">{order.Customer_Name}</td>
                                                <td className="border border-black px-2 py-1 text-center">{order.Item_Count}</td>
                                                <td className="border border-black px-2 py-1 text-center">{order.Payment_Type === 'bank_transfer' ? 'โอน' : 'COD'}</td>
                                                <td className="border border-black px-2 py-1 text-center text-xs">
                                                     {order.Payment_Type === 'cash_on_delivery' ? '-' : order.Is_Payment_Checked ? 'ตรวจแล้ว' : order.Transaction_Slip ? 'รอตรวจ' : 'ยังไม่แนบ'}
                                                </td>
                                                <td className="border border-black px-2 py-1 text-right">{formatPrice(order.Total_Amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                            <td colSpan={6} className="border border-black px-2 py-1 text-right">รวมกลุ่มนี้:</td>
                                            <td className="border border-black px-2 py-1 text-right">{formatPrice(groupTotal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        );
                    })}
                </div>

                {/* ท้ายกระดาษ */}
                <div className="mt-10 flex justify-between items-end break-inside-avoid">
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-6 mb-1"></div>
                        <p className="text-xs">ผู้จัดทำรายการ</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-6 mb-1"></div>
                        <p className="text-xs">ผู้ตรวจสอบ</p>
                    </div>
                </div>
                <div className="mt-2 text-center text-[10px] text-gray-500">
                     พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}
                </div>
            </div>
        </>
    );
}