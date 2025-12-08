'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiPrinter, FiArrowLeft, FiFilter, FiCheck, FiFileText, FiAlertCircle } from 'react-icons/fi';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
// 1. นำเข้า statusTypeLabels จากไฟล์กลาง
import { statusTypeLabels } from '@/app/utils/client';
import { OrderStatus } from '@/types';
import { useWebsiteSettings } from '@/app/providers/WebsiteSettingProvider';

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
    Transaction_Status: string | null;
}

// 2. ใช้ Keys จาก Config กลาง แทนการ Hardcode
const allStatuses = Object.keys(statusTypeLabels);

export default function OrdersReportPage() {
    const router = useRouter();
    const today = new Date().toISOString().split('T')[0];

    const settings = useWebsiteSettings();
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [orders, setOrders] = useState<ReportOrder[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Default เลือกทุกสถานะ
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(allStatuses);
    
    // State สำหรับวันที่พิมพ์ (แก้ปัญหา Hydration Mismatch)
    const [printDate, setPrintDate] = useState<Date | null>(null);

    useEffect(() => {
        setPrintDate(new Date());
    }, []);

    const fetchReport = async (start: string, end: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/report/daily?startDate=${start}&endDate=${end}`);
            const data = await res.json();
            if (res.ok) {
                setOrders(data.orders || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(startDate, endDate);
    }, [startDate, endDate]);

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
        // เรียงลำดับตาม Config กลาง
        allStatuses.forEach(status => {
            if (selectedStatuses.includes(status)) {
                const items = orders.filter(o => o.Status === status);
                if (items.length > 0) groups[status] = items;
            }
        });
        return groups;
    }, [orders, selectedStatuses]);

    const handlePrint = () => {
        setPrintDate(new Date());
        setTimeout(() => window.print(), 100);
    };

    const formatDateThai = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    const formatDateTimeShort = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', { 
            year: '2-digit', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    const formatPrintTime = (dateObj: Date | null) => {
        if (!dateObj) return '';
        return dateObj.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' });
    };

    const renderSlipStatus = (order: ReportOrder) => {
        if (order.Payment_Type === 'cash_on_delivery') return <span className="text-gray-400">-</span>;
        if (order.Is_Payment_Checked) return <span className="text-success font-semibold flex items-center justify-center gap-1 print:text-green-700"><FiCheck className="print:hidden"/> ยืนยันแล้ว</span>;
        if (order.Transaction_Status === 'rejected') return <span className="text-error font-semibold flex items-center justify-center gap-1 print:text-red-600"><FiAlertCircle className="print:hidden"/> ถูกปฏิเสธ</span>;
        if (order.Status === 'pending' && order.Transaction_Slip) return <span className="text-warning font-semibold flex items-center justify-center gap-1 print:text-orange-500"><FiFileText className="print:hidden"/> แนบสลิป</span>;
        if (!order.Transaction_Slip) return <span className="text-gray-400 flex items-center justify-center gap-1">ยังไม่แนบ</span>;
        return <span className="text-gray-400">-</span>;
    };

    const renderOrderRows = (orders: ReportOrder[]) => {
        const confirmed = orders.filter(o => o.Is_Payment_Checked);
        const rejected = orders.filter(o => !o.Is_Payment_Checked && o.Transaction_Status === 'rejected');
        const pendingCheck = orders.filter(o => !o.Is_Payment_Checked && o.Transaction_Slip && o.Transaction_Status !== 'rejected');
        const noSlip = orders.filter(o => !o.Is_Payment_Checked && !o.Transaction_Slip && o.Transaction_Status !== 'rejected');

        const totalConfirmed = confirmed.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
        const totalRejected = rejected.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
        const totalPending = pendingCheck.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
        const totalNoSlip = noSlip.reduce((sum, o) => sum + Number(o.Total_Amount), 0);

        const renderRows = (items: ReportOrder[], label: string, total: number, showHeader: boolean) => (
            <>
                {showHeader && items.length > 0 && (
                    <tr className="bg-gray-50 print:bg-gray-100 border-b border-gray-300">
                        <td colSpan={7} className="py-2 px-2 font-bold text-xs text-gray-700">
                            --- {label} ({items.length} รายการ) ---
                        </td>
                    </tr>
                )}
                {items.map((order) => (
                    <tr key={order.Order_ID} className="border-b border-gray-200">
                        <td className="py-2 px-2 text-center">{order.Order_ID}</td>
                        <td className="py-2 px-2 text-center">{formatDateTimeShort(order.Order_Date)}</td>
                        <td className="py-2 px-2 truncate max-w-[120px]">{order.Customer_Name}</td>
                        <td className="py-2 px-2 text-center">{order.Item_Count}</td>
                        <td className="py-2 px-2 text-center">{order.Payment_Type === 'bank_transfer' ? 'โอน' : 'COD'}</td>
                        <td className="py-2 px-2 text-center text-xs">
                             {renderSlipStatus(order)}
                        </td>
                        <td className="py-2 px-2 text-right">{formatPrice(order.Total_Amount)}</td>
                    </tr>
                ))}
                {items.length > 0 && (
                    <tr className="bg-gray-50 print:bg-gray-50 border-b border-gray-300">
                        <td colSpan={6} className="py-2 px-2 text-right text-xs font-semibold">
                            รวม ({label}):
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-sm">
                            {formatPrice(total)}
                        </td>
                    </tr>
                )}
            </>
        );

        return (
            <>
                {renderRows(confirmed, "ตรวจสอบแล้ว/ชำระเงินแล้ว", totalConfirmed, true)}
                {renderRows(rejected, "แนบสลิปแล้ว (การชำระเงินถูกปฏิเสธ)", totalRejected, true)}
                {renderRows(pendingCheck, "แนบสลิปแล้ว (รอตรวจสอบ)", totalPending, true)}
                {renderRows(noSlip, "ยังไม่แนบสลิป / เก็บเงินปลายทาง", totalNoSlip, true)}
            </>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-view, #print-view * { visibility: visible; }
                    #print-view {
                        display: block !important;
                        position: absolute; left: 0; top: 0; width: 100%;
                        background-color: white; padding: 0; margin: 0;
                    }
                    #screen-view { display: none !important; }
                    @page { size: A4; margin: 15mm; }
                    tr { page-break-inside: avoid; }
                    .status-section { page-break-inside: avoid; margin-bottom: 20px; }
                    
                    table { font-size: 11px; }
                    h1 { font-size: 18px; }
                }
            `}</style>

            {/* ==================== SCREEN VIEW ==================== */}
            <div id="screen-view" className="min-h-screen bg-base-200 p-6 lg:p-8 font-sarabun print:hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="btn btn-circle btn-ghost">
                                <FiArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-base-content">รายงานสรุปคำสั่งซื้อ</h1>
                                <p className="text-base-content/70">จัดการและพิมพ์รายงานตามช่วงเวลา</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 items-end bg-base-100 p-3 rounded-xl shadow-sm">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text font-semibold">ตั้งแต่วันที่</span></label>
                                <input type="date" className="input input-bordered shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text font-semibold">ถึงวันที่</span></label>
                                <input type="date" className="input input-bordered shadow-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <button onClick={handlePrint} className="btn btn-primary shadow-md">
                                <FiPrinter className="mr-2" /> พิมพ์รายงาน PDF
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="card bg-base-100 shadow-md border-l-4 border-primary">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">รายการที่เลือก</h2>
                                <div className="flex items-end gap-2"><span className="text-4xl font-bold text-primary">{summary.totalCount}</span><span className="text-sm mb-1">รายการ</span></div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-md border-l-4 border-secondary">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">รายการนับยอดขาย</h2>
                                <div className="flex items-end gap-2"><span className="text-4xl font-bold text-secondary">{summary.revenueCount}</span><span className="text-sm mb-1">รายการ</span></div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-md border-l-4 border-success">
                            <div className="card-body">
                                <h2 className="card-title text-base text-base-content/60">ยอดขายรวมสุทธิ</h2>
                                <div className="flex items-end gap-2"><span className="text-4xl font-bold text-success">{formatPrice(summary.totalRevenue)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <div className="card bg-base-100 shadow-md compact">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold flex items-center gap-2"><FiFilter/> กรองสถานะ</h3>
                                        <button onClick={toggleAll} className="btn btn-xs btn-ghost text-primary">
                                            {selectedStatuses.length === allStatuses.length ? 'ล้างทั้งหมด' : 'เลือกทั้งหมด'}
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {allStatuses.map(status => (
                                            <label key={status} className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded-lg p-2 -mx-2 transition-colors">
                                                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={selectedStatuses.includes(status)} onChange={() => toggleStatus(status)} />
                                                {/* 3. ใช้ชื่อสถานะจาก Config กลาง */}
                                                <span className="label-text">{statusTypeLabels[status as OrderStatus]?.label || status}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            {Object.keys(groupedOrders).length === 0 ? (
                                <div className="alert">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>
                            ) : (
                                Object.keys(groupedOrders).map(status => (
                                    <div key={status} className="card bg-base-100 shadow-md overflow-hidden">
                                        <div className="bg-base-200/50 px-6 py-3 border-b border-base-200 flex justify-between items-center">
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                <span className={`badge badge-sm ${['cancelled', 'refunded'].includes(status) ? 'badge-error' : 'badge-primary'}`}></span>
                                                {/* 3. ใช้ชื่อสถานะจาก Config กลาง */}
                                                {statusTypeLabels[status as OrderStatus]?.label || status}
                                            </h3>
                                            <span className="badge badge-ghost">{groupedOrders[status].length} รายการ</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="table w-full">
                                                <thead>
                                                    <tr className="bg-base-100 text-base-content">
                                                        <th>หมายเลขคำสั่งซื้อ</th>
                                                        <th>วันที่และเวลา</th>
                                                        <th>ลูกค้า</th>
                                                        <th className="text-center">สินค้า</th>
                                                        <th>ชำระเงิน</th>
                                                        <th className="text-center">สถานะสลิป</th>
                                                        <th className="text-right">ยอดเงิน</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {renderOrderRows(groupedOrders[status])}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== PRINT VIEW ==================== */}
            <div id="print-view" className="hidden">
                <div className="text-right text-[10px] text-gray-500 mb-2">
                     พิมพ์เมื่อ: {formatPrintTime(printDate)}
                </div>

                <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-extrabold text-black mb-1">รายงานสรุปยอดคำสั่งซื้อ</h1>
                        <p className="text-sm text-black font-medium">
                            ข้อมูลระหว่างวันที่: <b>{formatDateThai(startDate)}</b> ถึง <b>{formatDateThai(endDate)}</b>
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end text-xs text-gray-600">
                         <div>
                            <p className="font-bold text-gray-800 text-sm">{settings.companyName}</p>
                            <p>{settings.companyAddress}</p>
                         </div>
                         <div className="text-right">
                            <p>โทร: {settings.contactPhone}</p>
                            <p>เลขประจำตัวผู้เสียภาษี: {settings.companyTaxId}</p>
                         </div>
                    </div>
                </div>

                {/* <div className="flex gap-4 mb-6 border border-black p-3 bg-gray-50">
                    <div className="flex-1 text-center border-r border-black">
                        <div className="text-xs font-bold">รายการที่เลือก</div>
                        <div className="text-xl font-bold">{summary.totalCount}</div>
                    </div>
                    <div className="flex-1 text-center border-r border-black">
                        <div className="text-xs font-bold">นับยอดขาย</div>
                        <div className="text-xl font-bold">{summary.revenueCount}</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-xs font-bold">ยอดขายรวมสุทธิ</div>
                        <div className="text-xl font-bold">{formatPrice(summary.totalRevenue)}</div>
                    </div>
                </div> */}

                <div className="space-y-6">
                    {Object.keys(groupedOrders).map(status => {
                         const groupItems = groupedOrders[status];
                         const groupTotal = groupItems.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
                         return (
                            <div key={status} className="status-section">
                                <h3 className="font-bold text-lg mb-2 border-l-4 border-black pl-3 text-black">
                                    {/* 3. ใช้ชื่อสถานะจาก Config กลาง */}
                                    {statusTypeLabels[status as OrderStatus]?.label || status} ({groupItems.length})
                                </h3>
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-black">
                                            <th className="py-1 px-2 text-left w-16 font-bold">หมายเลขคำสั่งซื้อ</th>
                                            <th className="py-1 px-2 text-left w-20 font-bold">วันที่และเวลา</th>
                                            <th className="py-1 px-2 text-left font-bold">ลูกค้า</th>
                                            <th className="py-1 px-2 text-center w-12 font-bold">สินค้า</th>
                                            <th className="py-1 px-2 text-left w-20 font-bold">ชำระเงิน</th>
                                            <th className="py-1 px-2 text-center w-24 font-bold">สถานะสลิป</th>
                                            <th className="py-1 px-2 text-right w-24 font-bold">ยอดเงิน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderOrderRows(groupItems)}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold border-t border-black">
                                            <td colSpan={6} className="py-2 px-2 text-right">รวมกลุ่มนี้ ({statusTypeLabels[status as OrderStatus]?.label || status}):</td>
                                            <td className="py-2 px-2 text-right">{formatPrice(groupTotal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                         );
                    })}
                </div>

                <div className="mt-12 flex justify-between items-end break-inside-avoid pt-4 border-t border-dashed border-gray-300">
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-4 mb-1"></div>
                        <p className="text-[10px]">ผู้อนุมัติ</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-4 mb-1"></div>
                        <p className="text-[10px]">บัญชี/การเงิน</p>
                    </div>
                </div>
            </div>
        </>
    );
}