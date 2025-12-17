'use client';

import React, { useMemo, useState } from 'react';
import { 
  FiPlus, FiEye, FiEdit, FiBox, FiSave, FiX, 
  FiCheckCircle, FiAlertTriangle, FiAlertCircle, 
  FiSearch,
  FiZoomIn,
  FiImage,
  FiPackage,
  FiBarChart2,
  FiPlusCircle,
  FiFolder,
  FiLayers,
  FiInfo
} from 'react-icons/fi';

import { useProductManagement } from '@/app/hooks/admin/useProductManagement';
import { useProductModal } from '@/app/hooks/admin/useProductModal';
import { Category, ChildSubCategory, FullCategoryPath, ProductFormData, ProductInventory, StockStatus, SubCategory } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { formatPrice } from '@/app/utils/formatters';
import { calculateAvailableStock } from '@/app/utils/calculations';
import ProductRow from './ProductRow';
import ProductCard from './ProductCard';
import Pagination from '@/app/components/Pagination';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { useSession } from 'next-auth/react';
import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';
import Image from 'next/image';

// --- Presentational Modal Component ---
const ProductModal = ({ 
    isOpen, onClose, handleSubmit, product, isEditing, onToggleEditMode, formData, handleFormChange, 
    handleImageChange, isUploading, imagePreviewUrl, categories, subCategories, childSubCategories, 
    allCategoriesMap, getProductStockStatus, addStock, setPreviewImage
} : {
    isOpen: boolean;
    onClose: () => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    product: ProductInventory | ProductFormData  | null;
    isEditing: boolean;
    onToggleEditMode: () => void;
    formData: ProductFormData;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    imagePreviewUrl: string;
    categories: Category[];
    subCategories: SubCategory[];
    childSubCategories: ChildSubCategory[];
    allCategoriesMap: Map<number, FullCategoryPath>;
    getProductStockStatus: (product: ProductInventory | ProductFormData | null) => StockStatus;
    addStock: (productId: number, amountToAdd: number) => Promise<boolean>;
    setPreviewImage: (image: string) => void;
}) => {
    const filteredSubCategories = useMemo(() => formData.Selected_Category_ID ? subCategories.filter(s => s.Category_ID === Number(formData.Selected_Category_ID)) : [], [formData.Selected_Category_ID, subCategories]);
    const filteredChildSubCategories = useMemo(() => formData.Selected_Sub_Category_ID ? childSubCategories.filter(c => c.Sub_Category_ID === Number(formData.Selected_Sub_Category_ID)) : [], [formData.Selected_Sub_Category_ID, childSubCategories]);
    
    const [amountToAdd, setAmountToAdd] = useState<number>(0);

    if (!isOpen) return null;
    
    const stockStatus = product ? getProductStockStatus(product) : 'in_stock';
    const getFullCategoryName = (childId : number | null) => childId ? `${allCategoriesMap.get(childId)?.Category_Name} > ${allCategoriesMap.get(childId)?.Sub_Category_Name} > ${allCategoriesMap.get(childId)?.Child_Name}` : 'N/A';

    const handleAddStockClick = async () => {
        if (product?.Product_ID && amountToAdd > 0) {
            const success = await addStock(product.Product_ID, amountToAdd);
            if (success) {
                setAmountToAdd(0); // Reset input
                onClose(); // Close modal on success
            }
        }
    };

    const InfoRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
        <div>
            <p className="font-medium opacity-70">{label}</p>
            <p className="mt-1">{value ?? "-"}</p>
        </div>
    );

    const StatCard = ({
        title,
        value,
        desc,
        className = ""
    }: {
        title: string;
        value: string | number;
        desc?: string;
        className?: string;
    }) => (
        <div className="bg-base-200 border border-base-300 rounded-xl p-4 text-center shadow-sm">
            <p className="stat-title text-sm opacity-70">{title}</p>
            <p className={`stat-value text-2xl font-bold ${className}`}>{value}</p>
            {desc && <p className="stat-desc text-xs mt-1 opacity-70">{desc}</p>}
        </div>
    );

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
                <h3 className="font-bold text-lg">{product?.Product_ID ? (isEditing ? `แก้ไขรหัสสินค้า: ${product.Product_ID}` : `รายละเอียดรหัสสินค้า: ${product.Product_ID}`) : 'เพิ่มสินค้าใหม่'}</h3>
                
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {isEditing ? (
                        <form id="product-form" onSubmit={handleSubmit} className="space-y-10">
                            {/* ----------------------------- */}
                            {/* SECTION 1: IMAGE + VISIBILITY */}
                            {/* ----------------------------- */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiImage className="text-primary text-xl" />
                                    <h3 className="text-lg font-bold">รูปภาพสินค้า & การแสดงผล</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* IMAGE */}
                                    <div className="space-y-4">

                                        <div className='relative group w-full rounded-xl overflow-hidden border border-base-300 cursor-zoom-in hover:shadow-xl transition'>
                                            <Image
                                                src={imagePreviewUrl}
                                                alt={product?.Name || 'Product Name'}
                                                width={512}
                                                height={512}
                                                className="w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-105"
                                                onClick={() => setPreviewImage(imagePreviewUrl)}
                                            />

                                            {/* Zoom Icon */}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                                                </span>
                                            </div>
                                        </div>

                                        <input
                                            type="file"
                                            name="imageFile"
                                            className="file-input file-input-bordered w-full"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={handleImageChange}
                                        />
                                    </div>

                                    {/* VISIBILITY */}
                                    <div className="space-y-4">
                                        <label className="flex items-center justify-between p-4 bg-base-200 rounded-xl border">
                                        <div className="flex items-center gap-3">
                                            <FiEye className="text-primary text-xl" />
                                            <span className="font-semibold">แสดงผลบนเว็บไซต์</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            name="Visibility"
                                            checked={!!formData.Visibility}
                                            onChange={handleFormChange}
                                            className="toggle toggle-primary"
                                        />
                                        </label>

                                        {/* NAME */}
                                        <div>
                                            <label className="label"><span className="label-text font-semibold">ชื่อสินค้า</span></label>
                                            <input name="Name" className="input input-bordered w-full" value={formData.Name || ''} onChange={handleFormChange} required />
                                        </div>

                                        {/* BRAND */}
                                        <div>
                                            <label className="label"><span className="label-text font-semibold">แบรนด์</span></label>
                                            <input name="Brand" className="input input-bordered w-full" value={formData.Brand || ''} onChange={handleFormChange} />
                                        </div>

                                        {/* DESCRIPTION */}
                                        <div>
                                            <label className="label"><span className="label-text font-semibold">รายละเอียดสินค้า</span></label>
                                            <textarea name="Description" className="textarea textarea-bordered w-full h-24" value={formData.Description || ''} onChange={handleFormChange}></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ------------------------- */}
                            {/* SECTION 2: PRODUCT DETAIL */}
                            {/* ------------------------- */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiInfo className="text-primary text-xl" />
                                    <h3 className="text-lg font-bold">ข้อมูลสินค้า</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label"><span className="label-text font-semibold">หน่วย</span></label>
                                            <input name="Unit" className="input input-bordered w-full" value={formData.Unit || ''} onChange={handleFormChange} required />
                                        </div>

                                        <div>
                                            <label className="label"><span className="label-text font-semibold">ขนาด</span></label>
                                            <input name="Dimensions" className="input input-bordered w-full" value={formData.Dimensions || ''} onChange={handleFormChange} />
                                        </div>

                                        <div>
                                            <label className="label"><span className="label-text font-semibold">วัสดุ</span></label>
                                            <input name="Material" className="input input-bordered w-full" value={formData.Material || ''} onChange={handleFormChange} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label"><span className="label-text font-semibold">ราคาทุน</span></label>
                                            <input name="Sale_Cost" type="number" step="0.01" className="input input-bordered w-full" value={formData.Sale_Cost ?? ''} onChange={handleFormChange} required />
                                        </div>

                                        <div>
                                            <label className="label"><span className="label-text font-semibold">ราคาขาย</span></label>
                                            <input name="Sale_Price" type="number" step="0.01" className="input input-bordered w-full" value={formData.Sale_Price ?? ''} onChange={handleFormChange} required />
                                        </div>

                                        <div>
                                            <label className="label"><span className="label-text font-semibold">ราคาโปรโมชั่น (กำหนดหากมีการลดราคา)</span></label>
                                            <input name="Discount_Price" type="number" step="0.01" className="input input-bordered w-full" value={formData.Discount_Price ?? ''} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ----------------------- */}
                            {/* SECTION 3: STOCK INFO   */}
                            {/* ----------------------- */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiLayers className="text-primary text-xl" />
                                    <h3 className="text-lg font-bold">ข้อมูลสต็อกสินค้า</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="label"><span className="label-text font-semibold">จำนวนเริ่มต้น</span></label>
                                        <input name="Quantity" type="number" className="input input-bordered w-full" value={formData.Quantity ?? ''} onChange={handleFormChange} required />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="label"><span className="label-text font-semibold">จุดสั่งซื้อ</span></label>
                                        <input name="Reorder_Point" type="number" className="input input-bordered w-full" value={formData.Reorder_Point ?? ''} onChange={handleFormChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* ---------------------------- */}
                            {/* SECTION 4: CATEGORY SETTINGS */}
                            {/* ---------------------------- */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FiFolder className="text-primary text-xl" />
                                    <h3 className="text-lg font-bold">หมวดหมู่สินค้า</h3>
                                </div>

                                <div className="space-y-4">

                                    <div>
                                        <label className="label"><span className="label-text font-semibold">หมวดหมู่หลัก</span></label>
                                        <select name="Selected_Category_ID" className="select select-bordered w-full" value={formData.Selected_Category_ID || ''} onChange={handleFormChange}>
                                        <option value="">เลือกหมวดหมู่</option>
                                        {categories.map(c => (
                                            <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>
                                        ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="label"><span className="label-text font-semibold">หมวดหมู่รอง</span></label>
                                        <select
                                            name="Selected_Sub_Category_ID"
                                            className="select select-bordered w-full"
                                            disabled={!formData.Selected_Category_ID}
                                            value={formData.Selected_Sub_Category_ID || ''}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">เลือกหมวดหมู่รอง</option>
                                            {filteredSubCategories.map(s => (
                                                <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="label"><span className="label-text font-semibold">หมวดหมู่ย่อย</span></label>
                                        <select
                                            name="Child_ID"
                                            className="select select-bordered w-full"
                                            disabled={!formData.Selected_Sub_Category_ID}
                                            value={formData.Child_ID || ''}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">เลือกหมวดหมู่ย่อย</option>
                                            {filteredChildSubCategories.map(c => (
                                                <option key={c.Child_ID} value={c.Child_ID}>{c.Name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                {/* Cancel */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-ghost w-28 flex items-center justify-center gap-2"
                                    disabled={isUploading}
                                >
                                    <FiX className="text-lg" />
                                    ยกเลิก
                                </button>

                                {/* Save */}
                                <button
                                    form="product-form"
                                    type="submit"
                                    className="btn btn-primary w-28 flex items-center justify-center gap-2"
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        กำลังบันทึก...
                                    </>
                                    ) : (
                                    <>
                                        <FiSave className="text-lg" />
                                        บันทึก
                                    </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                                {/* LEFT COLUMN — PRODUCT OVERVIEW */}
                                <div className="flex flex-col gap-8">

                                    {/* PRODUCT IMAGE */}
                                    <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6 h-full flex flex-col gap-4">
                                        <h3 className="font-bold text-xl flex items-center gap-2">
                                            <FiImage className="text-primary" /> รูปสินค้า
                                        </h3>

                                        <div className='relative group w-full rounded-xl overflow-hidden border border-base-300 cursor-zoom-in hover:shadow-xl transition'>
                                            <Image
                                                src={product?.Image_URL || 'https://placehold.co/500x350?text=NO+IMAGE'}
                                                alt={product?.Name || 'Product Name'}
                                                width={512}
                                                height={512}
                                                className="w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-105"
                                                onClick={() => setPreviewImage(product?.Image_URL || 'https://placehold.co/500x350?text=NO+IMAGE')}
                                            />

                                            {/* Zoom Icon */}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PRODUCT INFORMATION */}
                                    <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6 space-y-4 h-full">
                                        <h3 className="font-bold text-xl flex items-center gap-2">
                                            <FiPackage className="text-primary" /> ข้อมูลสินค้า
                                        </h3>

                                        <InfoRow label="ชื่อสินค้า" value={product?.Name} />
                                        <InfoRow label="แบรนด์" value={product?.Brand} />
                                        <InfoRow label="หมวดหมู่" value={getFullCategoryName(product?.Child_ID || null)} />
                                        <InfoRow label="ราคาขาย" value={formatPrice(product?.Sale_Price || 0)} />
                                        <InfoRow label="สถานะบนเว็บไซต์" value={product?.Visibility ? 'แสดงผล' : 'ซ่อน'} />

                                        <div>
                                            <p className="font-semibold opacity-70 mb-1">รายละเอียดสินค้า</p>
                                            <p className="whitespace-pre-wrap">{product?.Description || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN — STOCK PANEL */}
                                <div className="flex flex-col gap-8">

                                    {/* STOCK SUMMARY */}
                                    <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm p-6 space-y-6">
                                        <h3 className="font-bold text-xl flex items-center gap-2">
                                            <FiBarChart2 className="text-primary" /> สรุปสต็อกสินค้า
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <StatCard title="สต็อกตั้งต้น" value={product?.Quantity ?? 0} desc="จำนวนรับเข้าทั้งหมด" />
                                            <StatCard title="ยอดขายสะสม" value={`${product?.Total_Sales ?? 0}`} className="" />
                                            <StatCard title="ยอดคืน / ยกเลิก" value={`${product?.Cancellation_Count ?? 0}`} className="" />
                                            <StatCard
                                                title="คงเหลือขายได้"
                                                value={product ? calculateAvailableStock(product) : 0}
                                                className="text-primary"
                                                desc={
                                                    stockStatus === 'in_stock'
                                                        ? 'ในสต็อก'
                                                        : stockStatus === 'low_stock'
                                                        ? 'ใกล้หมด'
                                                        : 'สินค้าหมด'
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* ADD STOCK */}
                                    <div className="bg-base-200 border border-base-300 rounded-xl shadow-inner p-6 flex flex-col gap-4 h-full">
                                        <h3 className="font-bold text-xl flex items-center gap-2">
                                            <FiPlusCircle className="text-primary" /> เพิ่มสต็อกสินค้า
                                        </h3>

                                        <label className="input-group">
                                            <input
                                                type="number"
                                                className="input input-bordered w-full"
                                                placeholder="จำนวนที่ต้องการเพิ่ม"
                                                min={1}
                                                value={amountToAdd || ""}
                                                onChange={(e) => setAmountToAdd(Number(e.target.value))}
                                            />
                                        </label>

                                        <button
                                            className="btn btn-primary w-full mt-auto"
                                            disabled={!amountToAdd || amountToAdd <= 0}
                                            onClick={handleAddStockClick}
                                        >
                                            <FiPlus /> เพิ่มสต็อก
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-action flex justify-end">
                                <button type="button" onClick={onClose} className="btn w-28">ปิด</button>
                                <button type="button" onClick={onToggleEditMode} className="btn btn-primary w-28">
                                    <FiEdit /> แก้ไข
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </dialog>
    );
};

// --- Main Page Component ---
export default function ProductManagementPage() {
    const { data: session } = useSession();
    const { loading, error, data, filteredProducts, allCategoriesMap, filters, setFilters, actions } = useProductManagement();
    const { openModal, modalProps } = useProductModal({ onSave: actions.saveProduct });

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredProducts, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handleFilterChange = (filterName: string, value: string | number) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'categoryFilter') { 
                newFilters.subCategoryFilter = 'all'; 
                newFilters.childCategoryFilter = 'all'; }
            if (filterName === 'subCategoryFilter') { newFilters.childCategoryFilter = 'all'; }
            return newFilters;
        });
        setCurrentPage(1);
    };

    const getFullCategoryName = (childId: number | null) => allCategoriesMap.get(childId as number) 
        ? `${allCategoriesMap.get(childId as number)?.Category_Name} > ${allCategoriesMap.get(childId as number)?.Sub_Category_Name} > ${allCategoriesMap.get(childId as number)?.Child_Name}` 
        : 'N/A';

    const { getProductStockStatus } = actions;

    const stats = useMemo(() => ({
        total: data.products.length,
        inStock: data.products.filter(p => getProductStockStatus(p) === 'in_stock').length,
        lowStock: data.products.filter(p => getProductStockStatus(p) === 'low_stock').length,
        outOfStock: data.products.filter(p => getProductStockStatus(p) === 'out_of_stock').length,
        visible: data.products.filter(p => p.Visibility).length
    }), [data.products, getProductStockStatus]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    if (!session || !session.user?.Stock_Mgr) return <AccessDeniedPage url="/admin"/>;
  
    return (
    <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto">
            <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold">จัดการสินค้า</h1>
                    <p className="text-base-content/70 mt-1">จัดการและติดตามสินค้าทั้งหมดในคลัง</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openModal(null, 'add')} className="btn btn-primary"><FiPlus /> เพิ่มสินค้าใหม่</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'all')}><div className="flex items-center gap-3" ><div className="p-2 bg-neutral/10 rounded-lg"><FiBox className="w-5 h-5 text-neutral"/></div><div><p className="text-sm text-base-content/70">สินค้าทั้งหมด</p><p className="text-2xl font-bold">{stats.total}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'in_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-success/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-green-600"/></div><div><p className="text-sm text-base-content/70">ในสต็อก</p><p className="text-2xl font-bold">{stats.inStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'low_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-warning/10 rounded-lg"><FiAlertTriangle className="w-5 h-5 text-warning"/></div><div><p className="text-sm text-base-content/70">สินค้าใกล้หมด</p><p className="text-2xl font-bold">{stats.lowStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'out_of_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-error/10 rounded-lg"><FiAlertCircle className="w-5 h-5 text-error"/></div><div><p className="text-sm text-base-content/70">สินค้าหมด</p><p className="text-2xl font-bold">{stats.outOfStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-info/10 rounded-lg"><FiEye className="w-5 h-5 text-info"/></div><div><p className="text-sm text-base-content/70">สินค้าที่แสดง</p><p className="text-2xl font-bold">{stats.visible}</p></div></div></div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 items-center">
                    <div className="col-span-full xl:col-span-2 relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4 z-10" />
                            <input type="text" placeholder="ค้นหา..." value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} className="input input-bordered w-full pl-10" />
                        </div>
                    <select value={filters.categoryFilter} onChange={(e) => handleFilterChange('categoryFilter', e.target.value)} className="select select-bordered w-full"><option value="all">หมวดหมู่หลัก</option>{data.categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>)}</select>
                    <select value={filters.subCategoryFilter} onChange={(e) => handleFilterChange('subCategoryFilter', e.target.value)} className="select select-bordered w-full" disabled={filters.categoryFilter === 'all'}><option value="all">หมวดหมู่รอง</option>{data.subCategories.filter(s=>s.Category_ID === Number(filters.categoryFilter)).map(s => <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>)}</select>
                    <select value={filters.childCategoryFilter} onChange={(e) => handleFilterChange('childCategoryFilter', e.target.value)} className="select select-bordered w-full" disabled={filters.subCategoryFilter === 'all'}><option value="all">หมวดหมู่ย่อย</option>{data.childSubCategories.filter(c=>c.Sub_Category_ID === Number(filters.subCategoryFilter)).map(c => <option key={c.Child_ID} value={c.Child_ID}>{c.Name}</option>)}</select>
                    <select value={filters.stockStatusFilter} onChange={(e) => handleFilterChange('stockStatusFilter', e.target.value)} className="select select-bordered w-full"><option value="all">สถานะสต็อก</option><option value="in_stock">ในสต็อก</option><option value="low_stock">ใกล้หมด</option><option value="out_of_stock">สินค้าหมด</option></select>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="select select-bordered w-full"><option value={10}>10 รายการ</option><option value={20}>20 รายการ</option><option value={50}>50 รายการ</option></select>
                </div>
            </div>

            <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>รหัส</th>
                            <th>รูปภาพ</th>
                            <th>สินค้า</th>
                            <th>แบรนด์</th>
                            <th>หมวดหมู่</th>
                            <th>คงเหลือขายได้</th>
                            <th>ราคาขาย</th>
                            <th>สถานะ</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map(product => (
                            <ProductRow key={product.Product_ID} product={product} getFullCategoryName={getFullCategoryName} formatPrice={formatPrice} openProductModal={openModal} deleteProduct={actions.deleteProduct} availableStock={calculateAvailableStock(product)} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid md:hidden grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                 {paginatedProducts.map(product => (
                    <ProductCard key={product.Product_ID} product={product} getFullCategoryName={getFullCategoryName} formatPrice={formatPrice} openProductModal={openModal} deleteProduct={actions.deleteProduct} availableStock={calculateAvailableStock(product)} />
                ))}
            </div>
            
            <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItemsCount={filteredProducts.length}
                onPageChange={page => setCurrentPage(page)}
                totalPages={totalPages}
            />

            <ProductModal 
                {...modalProps}
                categories={data.categories}
                subCategories={data.subCategories}
                childSubCategories={data.childSubCategories}
                allCategoriesMap={allCategoriesMap}
                getProductStockStatus={actions.getProductStockStatus}
                addStock={actions.addStock}
                setPreviewImage={setPreviewImage}
            />
        </div>

        <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}