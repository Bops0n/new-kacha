'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiPrinter, FiArrowLeft, FiFilter, FiBox, FiAlertTriangle, FiXCircle, FiCheckCircle, FiSearch, FiDollarSign } from 'react-icons/fi';
import { formatDateTimeThai, formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { ProductInventory } from '@/types';
import { useCategoryData } from '@/app/hooks/useCategoryData';
import { calculateAvailableStock } from '@/app/utils/calculations';

export default function InventoryReportPage() {
    const router = useRouter();
    
    const { allCategoriesMap, categories, loading: catLoading } = useCategoryData();

    const [products, setProducts] = useState<ProductInventory[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/report/inventory`);
            const data = await res.json();
            if (res.ok) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const getFullCategoryName = (childId: number | null) => {
        if (!childId || !allCategoriesMap.has(childId)) return '-';
        const path = allCategoriesMap.get(childId);
        return `${path?.Sub_Category_Name}`; 
    };

    // Helper: ดึงชื่อหมวดหมู่หลักสำหรับแสดงในรายงาน
    const getCategoryNameById = (id: string) => {
        if (id === 'all') return 'ทั้งหมด';
        const cat = categories.find(c => c.Category_ID.toString() === id);
        return cat ? cat.Name : '-';
    };

    const getStockStatus = (product: ProductInventory, available: number) => {
        if (available <= 0) return 'out_of_stock';
        if (available <= product.Reorder_Point) return 'low_stock';
        return 'in_stock';
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const available = calculateAvailableStock(p);
            const status = getStockStatus(p, available);

            if (stockFilter !== 'all' && status !== stockFilter) return false;

            if (searchTerm && !p.Name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !p.Product_ID.toString().includes(searchTerm) &&
                !p.Brand?.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            if (categoryFilter !== 'all') {
                const productCatInfo = p.Child_ID ? allCategoriesMap.get(p.Child_ID) : null;
                const productMainCatId = productCatInfo?.Category_ID;
                if (!productMainCatId || productMainCatId.toString() !== categoryFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [products, stockFilter, searchTerm, categoryFilter, allCategoriesMap]);

    const summary = useMemo(() => {
        let totalQty = 0;
        let totalValue = 0;
        let lowStockCount = 0; 

        filteredProducts.forEach(p => {
            const available = calculateAvailableStock(p);
            const status = getStockStatus(p, available);

            if (available > 0) {
                totalQty += available;
                totalValue += available * Number(p.Sale_Price);
            }

            if (status === 'low_stock' || status === 'out_of_stock') {
                lowStockCount++;
            }
        });

        return {
            totalItems: filteredProducts.length,
            totalQty,
            totalValue,
            lowStockCount 
        };
    }, [filteredProducts]);

    const handlePrint = () => {
        window.print();
    };


    if (loading || catLoading) return <LoadingSpinner />;

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
                    
                    .row-low-stock { background-color: #fffbeb !important; } 
                    .row-out-stock { background-color: #fef2f2 !important; }
                    
                    table { font-size: 11px; }
                    h1 { font-size: 18px; }
                }
            `}</style>

            {/* === SCREEN VIEW === */}
            <div id="screen-view" className="min-h-screen bg-base-200 p-6 lg:p-8 font-sarabun print:hidden">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="btn btn-circle btn-ghost">
                                <FiArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-base-content">รายงานสินค้าคงคลัง</h1>
                                <p className="text-base-content/70">ตรวจสอบสถานะสต็อกและจุดสั่งซื้อซ้ำ</p>
                            </div>
                        </div>
                        <button onClick={handlePrint} className="btn btn-primary shadow-md">
                            <FiPrinter className="mr-2" /> พิมพ์รายงาน
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200 col-span-2">
                            <div className="stat-figure text-primary"><FiBox className="w-8 h-8" /></div>
                            <div className="stat-title">รายการทั้งหมด</div>
                            <div className="stat-value text-primary">{summary.totalItems}</div>
                            <div className="stat-desc">รายการ (SKU)</div>
                        </div>
                        <div className={`stat rounded-xl shadow-sm border border-base-200 ${summary.lowStockCount > 0 ? 'bg-warning/10 border-warning/30' : 'bg-base-100'}`}>
                            <div className={`stat-figure ${summary.lowStockCount > 0 ? 'text-warning' : 'text-base-content/20'}`}><FiAlertTriangle className="w-8 h-8" /></div>
                            <div className="stat-title font-bold text-base-content/70">สินค้าที่ต้องเติมสต็อก</div>
                            <div className={`stat-value ${summary.lowStockCount > 0 ? 'text-warning' : ''}`}>{summary.lowStockCount}</div>
                            <div className="stat-desc text-base-content/60">ต่ำกว่าจุดสั่งซื้อ หรือ หมด</div>
                        </div>
                        {/* <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
                            <div className="stat-figure text-success"><FiDollarSign className="w-8 h-8" /></div>
                            <div className="stat-title">มูลค่าขายรวม</div>
                            <div className="stat-value text-success text-2xl">{formatPrice(summary.totalValue)}</div>
                        </div> */}
                    </div>

                    {/* Filters */}
                    <div className="bg-base-100 p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end">
                        <div className="form-control w-full max-w-xs">
                            <label className="label py-1"><span className="label-text">ค้นหา</span></label>
                            <div className="relative">
                                <input type="text" placeholder="ชื่อสินค้า, รหัส, แบรนด์..." className="input input-bordered w-full pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>
                        
                        {/* Category Filter */}
                        <div className="form-control w-full max-w-xs">
                            <label className="label py-1"><span className="label-text">หมวดหมู่หลัก</span></label>
                            <select className="select select-bordered" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="all">ทั้งหมด</option>
                                {categories.map(c => (
                                    <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control w-full max-w-xs">
                            <label className="label py-1"><span className="label-text">สถานะสต็อก</span></label>
                            <select className="select select-bordered" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}>
                                <option value="all">ทั้งหมด</option>
                                <option value="in_stock">ปกติ (In Stock)</option>
                                <option value="low_stock">ใกล้หมด (Low Stock)</option>
                                <option value="out_of_stock">สินค้าหมด (Out of Stock)</option>
                            </select>
                        </div>
                    </div>

                    {/* Table (Screen) */}
                    <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="bg-base-200 text-base-content font-bold">
                                        <th className="w-16">หมายเลขสินค้า</th>
                                        <th>ชื่อสินค้า</th>
                                        <th>หมวดหมู่ (รอง)</th>
                                        <th className="text-right w-20">จุดสั่งซื้อ</th>
                                        <th className="text-right w-20">คงเหลือ</th>
                                        <th className="text-center w-20">หน่วย</th>
                                        <th className="text-right w-24">ต้นทุน</th>
                                        <th className="text-right w-24">ราคาขาย</th>
                                        <th className="text-center w-28">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((p) => {
                                        const available = calculateAvailableStock(p);
                                        const status = getStockStatus(p, available);
                                        
                                        let rowClass = "";
                                        if (status === 'out_of_stock') rowClass = "bg-error/10 hover:bg-error/20 text-error-content";
                                        else if (status === 'low_stock') rowClass = "bg-warning/10 hover:bg-warning/20 text-warning-content";

                                        return (
                                            <tr key={p.Product_ID} className={rowClass}>
                                                <td className="font-mono font-bold opacity-70">{p.Product_ID}</td>
                                                <td>
                                                    <div className="font-bold">{p.Name}</div>
                                                    <div className="text-xs opacity-60">{p.Brand}</div>
                                                </td>
                                                <td className="text-xs opacity-70 max-w-[150px] truncate">
                                                    {getFullCategoryName(p.Child_ID)}
                                                </td>
                                                <td className="text-right font-mono text-xs opacity-70">
                                                    {p.Reorder_Point}
                                                </td>
                                                <td className="text-right font-bold text-lg">
                                                    {available}
                                                </td>
                                                <td className="text-center text-sm opacity-80">
                                                    {p.Unit}
                                                </td>
                                                <td className="text-right text-sm">
                                                    {formatPrice(p.Sale_Cost)}
                                                </td>
                                                <td className="text-right text-sm">
                                                    {formatPrice(p.Sale_Price)}
                                                </td>
                                                <td className="text-center">
                                                    {status === 'out_of_stock' && <span className="badge badge-error gap-1 font-bold">หมด</span>}
                                                    {status === 'low_stock' && <span className="badge badge-warning gap-1 font-bold">ใกล้หมด</span>}
                                                    {status === 'in_stock' && <span className="badge badge-success gap-1">ปกติ</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* === PRINT VIEW (Header Style แบบใหม่) === */}
            <div id="print-view" className="hidden">
                
                {/* 1. วันที่พิมพ์ (ขวาบนสุด) */}
                <div className="text-right text-[10px] text-gray-500 mb-2">
                     พิมพ์เมื่อ: {formatDateTimeThai(new Date())}
                </div>

                {/* 2. ส่วนหัวกระดาษ (Header) */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-extrabold text-black mb-1">รายงานสินค้าคงคลัง</h1>
                        <p className="text-sm text-black font-medium">
                            {/* แสดงเงื่อนไข และ หมวดหมู่ที่เลือกตรงนี้ */}
                            สถานะ: <b>{stockFilter === 'all' ? 'ทุกสถานะ' : stockFilter}</b> | 
                            หมวดหมู่: <b>{getCategoryNameById(categoryFilter)}</b>
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end text-xs text-gray-600">
                         <div>
                            <p className="font-bold text-gray-800 text-sm">บริษัท คชาโฮม จำกัด</p>
                            <p>123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพฯ 10110</p>
                         </div>
                         <div className="text-right">
                            <p>โทร: 081-896-2687</p>
                            <p>เลขประจำตัวผู้เสียภาษี: 010555XXXXXXX</p>
                         </div>
                    </div>
                </div>

                {/* Print Summary */}

                {/* Table with No Vertical Borders (Clean Look) */}
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-black">
                            <th className="py-1 text-left w-12 font-bold">หมายเลขสินค้า</th>
                            <th className="py-1 text-left font-bold">ชื่อสินค้า</th>
                            <th className="py-1 text-left w-20 font-bold">หมวดหมู่</th>
                            <th className="py-1 text-right w-12 font-bold">จุดสั่งซื้อ</th>
                            <th className="py-1 text-right w-12 font-bold">คงเหลือ</th>
                            <th className="py-1 text-center w-12 font-bold">หน่วย</th>
                            <th className="py-1 text-right w-16 font-bold">ต้นทุน</th>
                            <th className="py-1 text-right w-16 font-bold">ราคาขาย</th>
                            <th className="py-1 text-center w-16 font-bold">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((p) => {
                            const available = calculateAvailableStock(p);
                            const status = getStockStatus(p, available);
                            
                            let rowClass = "border-b border-gray-300"; 
                            if (status === 'out_of_stock') rowClass += " row-out-stock font-bold";
                            else if (status === 'low_stock') rowClass += "row-low-stock font-bold";
                            
                            return (
                                <tr key={p.Product_ID} className={rowClass}>
                                    <td className="py-1 text-left">{status !== 'in_stock' && '*'}{p.Product_ID}</td>
                                    <td className="py-1 text-left">
                                        {p.Name}
                                        <div className="text-[9px] text-gray-500">{p.Brand}</div>
                                    </td>
                                    <td className="py-1 text-left text-[9px] truncate max-w-[80px]">{getFullCategoryName(p.Child_ID)}</td>
                                    <td className="py-1 text-right">{p.Reorder_Point}</td>
                                    <td className="py-1 text-right">{available}</td>
                                    <td className="py-1 text-center">{p.Unit}</td>
                                    <td className="py-1 text-right">{formatPrice(p.Sale_Cost)}</td>
                                    <td className="py-1 text-right">{formatPrice(p.Sale_Price)}</td>
                                    <td className="py-1 text-center text-xs">
                                        {status === 'out_of_stock' ? 'หมด' : status === 'low_stock' ? 'ใกล้หมด' : 'ปกติ'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-6 flex justify-between items-end break-inside-avoid pt-2 border-t border-dashed border-gray-300">
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-4 mb-1"></div>
                        <p className="text-[10px]">เจ้าหน้าที่คลังสินค้า</p>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black w-full h-4 mb-1"></div>
                        <p className="text-[10px]">ผู้ตรวจสอบ</p>
                    </div>
                </div>
            </div>
        </>
    );
}