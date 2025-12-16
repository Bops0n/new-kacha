'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';
import { formatDateThai, formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useWebsiteSettings } from '@/app/providers/WebsiteSettingProvider';
import { useAlert } from '@/app/context/AlertModalContext';

interface ReportOrder {
    Order_ID: number;
    Order_Date: string;
    Customer_Name: string;
    Total_Amount: number;
    Payment_Type: string;
    Status: string;
    Current_Vat: number;
}

const statusLabels: Record<string, string> = {
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งเรียบร้อย',
};

export default function SummarySalesReportPage() {
    const router = useRouter();
    const settings = useWebsiteSettings();
    const today = new Date().toLocaleDateString('sv').replaceAll('/', '-')

    const { showAlert } = useAlert();

    const getCurDate = ()=>{
        const date = new Date().toLocaleString('th-TH',{dateStyle: 'long', timeStyle: 'medium'})
        return date
    };

    const [printDate,setPrintDate] = useState('');

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    
    const [orders, setOrders] = useState<ReportOrder[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect( ()=>{
        setPrintDate(getCurDate)
    },[])

    const fetchReport = async (start: string, end: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/report/summary-sales?startDate=${start}&endDate=${end}`);
            const data = await res.json();
            if (res.ok) {
     
                setOrders(data.orders || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!startDate || !endDate) return;
        if (endDate < startDate) return;
        fetchReport(startDate, endDate);
    }, [startDate, endDate]);

    const salesOrders = useMemo(() => {
        return orders.filter(o => ['shipped', 'delivered'].includes(o.Status));
    }, [orders]);

    const summary = useMemo(() => {
        const totalGross = salesOrders.reduce((sum, o) => sum + Number(o.Total_Amount), 0);
        const totalVat = salesOrders.reduce((sum, o) => sum + Number(o.Total_Amount) /100 * (o.Current_Vat), 0); 
        const totalNet = totalGross - totalVat;

        return {
            totalOrders: salesOrders.length,
            totalGross,
            totalNet,
            totalVat
        };
    }, [salesOrders]);

    const handlePrint = () => {
        setPrintDate(getCurDate)
        window.print();
    };


    if (loading) return <LoadingSpinner />;

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    
                    body * { visibility: hidden; }
                    #print-view, #print-view * { visibility: visible; }
                    #print-view {
                        display: block !important;
                        position: absolute; left: 0; top: 0; width: 100%;
                        background-color: white;
                    }
                    #screen-view { display: none !important; }
                    tr { page-break-inside: avoid; }
                    
                    table { font-size: 11px; }
                    h1 { font-size: 18px; }
                }
            `}</style>

            {/* ==================== SCREEN VIEW ==================== */}
            <div id="screen-view" className="min-h-screen bg-base-200 p-6 lg:p-8 font-sarabun print:hidden">
                <div className="max-w-7xl mx-auto">
                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="btn btn-circle btn-ghost">
                                <FiArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-base-content">รายงานสรุปยอดขาย</h1>
                                <p className="text-base-content/70">แสดงยอดขายแบบแยกภาษีมูลค่าเพิ่ม</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 items-end bg-base-100 p-3 rounded-xl shadow-sm">
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text font-semibold">ตั้งแต่วันที่</span></label>
                                <input 
                                    type="date" 
                                    className="input input-bordered" 
                                    value={startDate} 
                                    onChange={(e) => {
                                        const newStart = e.target.value;

                                        if (!newStart) return;

                                        setStartDate(newStart);

                                        if (newStart > endDate) {
                                            setEndDate(newStart);
                                        }
                                    }} 
                                />
                            </div>
                            <div className="form-control">
                                <label className="label py-1"><span className="label-text font-semibold">ถึงวันที่</span></label>
                                <input 
                                    type="date" 
                                    className="input input-bordered" 
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => {
                                        const newEnd = e.target.value;

                                        if (!newEnd) return;

                                        if (newEnd < startDate) {
                                            showAlert("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น", 'warning');
                                            return;
                                        }

                                        setEndDate(newEnd);
                                    }} 
                                />
                            </div>
                            <button 
                                className="btn btn-primary"
                                disabled={endDate < startDate}
                                onClick={handlePrint} 
                            >
                                <FiPrinter className="mr-2" /> พิมพ์รายงาน
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
                            <div className="stat-figure text-base-content/40"></div>
                            <div className="stat-title">จำนวนรายการ</div>
                            <div className="stat-value text-base-content">{summary.totalOrders}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
                            <div className="stat-figure text-primary"></div>
                            <div className="stat-title">มูลค่าสินค้า (ก่อนภาษี)</div>
                            <div className="stat-value text-primary text-2xl">{formatPrice(summary.totalNet)}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
                            <div className="stat-title">ภาษีมูลค่าเพิ่ม</div>
                            <div className="stat-value text-secondary text-2xl">{formatPrice(summary.totalVat)}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200 bg-primary/5">
                            <div className="stat-title font-bold">ยอดรวมสุทธิ</div>
                            <div className="stat-value text-green-600">{formatPrice(summary.totalGross)}</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                        {loading ? <LoadingSpinner /> : (
                            <div className="overflow-x-auto">
                                <table className="table w-full table-zebra">
                                    <thead className="bg-base-200/50 text-base-content">
                                        <tr>
                                            <th>วันที่</th>
                                            <th>หมายเลขคำสั่งซื้อ</th>
                                            <th>ลูกค้า</th>
                                            <th className="text-center">สถานะ</th>
                                            <th className="text-right text-base-content/70">มูลค่าสินค้า</th>
                                            <th className="text-right text-base-content/70">VAT</th>
                                            <th className="text-right font-bold">ยอดรวมสุทธิ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesOrders.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-8 text-gray-500">ไม่พบรายการขายในช่วงเวลานี้</td></tr>
                                        ) : (
                                            salesOrders.map((order) => {
                                                const gross = Number(order.Total_Amount);
                                                const vat = (gross/100)* order.Current_Vat;
                                                const net = gross-vat;
                                                return (
                                                    <tr key={order.Order_ID} className="hover:bg-base-50">
                                                        <td className="font-mono text-xs">{formatDateThai(order.Order_Date)}</td>
                                                        <td className="font-bold text-primary">{order.Order_ID}</td>
                                                        <td>{order.Customer_Name}</td>
                                                        <td className="text-center">
                                                            <span className={`badge badge-sm ${order.Status === 'delivered' ? 'badge-success' : 'badge-primary'}`}>
                                                                {statusLabels[order.Status] || order.Status}
                                                            </span>
                                                        </td>
                                                        <td className="text-right">{formatPrice(net)}</td>
                                                        <td className="text-right">{formatPrice(vat)} ({order.Current_Vat}%)</td>
                                                        <td className="text-right font-bold">{formatPrice(gross)}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== PRINT VIEW ==================== */}
            <div id="print-view" className="hidden">
                
                {/* 1. วันที่พิมพ์ (ขวาบนสุด) */}
                <div className="text-right text-[10px] text-gray-500 mb-2">
                     พิมพ์เมื่อ: {printDate}
                </div>

                {/* 2. Header Report (แบบฟอร์มทางการ) */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-extrabold text-black mb-1">รายงานสรุปยอดขาย</h1>
                        <p className="text-sm text-black font-medium">
                            ข้อมูลระหว่างวันที่: <b>{formatDateThai(startDate,'long')}</b> ถึง <b>{formatDateThai(endDate, 'long')}</b>
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

                {/* Summary Box */}
                {/* <div className="flex gap-4 mb-6 border border-black p-3 bg-gray-50">
                    <div className="flex-1 text-center border-r border-black">
                        <div className="text-xs font-bold">จำนวนรายการ</div>
                        <div className="text-lg font-bold">{summary.totalOrders}</div>
                    </div>
                    <div className="flex-1 text-center border-r border-black">
                        <div className="text-xs font-bold">มูลค่าสินค้า (Net)</div>
                        <div className="text-lg font-bold">{formatPrice(summary.totalNet)}</div>
                    </div>
                    <div className="flex-1 text-center border-r border-black">
                        <div className="text-xs font-bold">ภาษีมูลค่าเพิ่ม (VAT {settings.vatRate}%)</div>
                        <div className="text-lg font-bold">{formatPrice(summary.totalVat)}</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-xs font-bold">ยอดรวมสุทธิ (Gross)</div>
                        <div className="text-lg font-bold">{formatPrice(summary.totalGross)}</div>
                    </div>
                </div> */}

                {/* Detail Table */}
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1 text-left w-24 font-bold">วันที่</th>
                            <th className="py-1 text-left w-24 font-bold">หมายเลขคำสั่งซื้อ</th>
                            <th className="py-1 text-left font-bold">ลูกค้า</th>
                            <th className="py-1 text-right w-24 font-bold">มูลค่าสินค้า</th>
                            <th className="py-1 text-right w-24 font-bold">VAT</th>
                            <th className="py-1 text-right w-28 font-bold">ยอดรวมสุทธิ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesOrders.map((order) => {
                            const gross = Number(order.Total_Amount);
                            const vat = gross / 100 * (order.Current_Vat);
                            const net = gross - vat;
                            return (
                                <tr key={order.Order_ID} className="border-b border-gray-300">
                                    <td className="py-1 text-left">{formatDateThai(order.Order_Date)}</td>
                                    <td className="py-1 text-left">{order.Order_ID}</td>
                                    <td className="py-1 text-left truncate max-w-[150px]">{order.Customer_Name}</td>
                                    <td className="py-1 text-right">{formatPrice(net)}</td>
                                    <td className="py-1 text-right">{formatPrice(vat)}({order.Current_Vat}%)</td>
                                    <td className="py-1 text-right font-bold">{formatPrice(gross)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold border-t border-black bg-gray-100">
                            <td colSpan={3} className="py-2 px-2 text-right">รวมทั้งสิ้น:</td>
                            <td className="py-2 text-right">{formatPrice(summary.totalNet)}</td>
                            <td className="py-2 text-right">{formatPrice(summary.totalVat)}</td>
                            <td className="py-2 text-right">{formatPrice(summary.totalGross)}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Signature */}
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