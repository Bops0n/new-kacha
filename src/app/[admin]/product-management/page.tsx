'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEye, FiEdit, FiTrash2, FiBox, FiSave, FiX, 
  FiDownload, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiPackage 
} from 'react-icons/fi';

import { useProductManagement } from '@/app/hooks/admin/useProductManagement';
import { useProductModal } from '@/app/hooks/admin/useProductModal';
import { ProductFormData, ProductInventory, StockStatus } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { formatPrice } from '@/app/utils/formatters';
import { calculateAvailableStock } from '@/app/utils/calculations'; // <-- IMPORT
import ProductRow from './ProductRow';
import ProductCard from './ProductCard';
import Pagination from '@/app/components/Pagination';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { useSession } from 'next-auth/react';

// --- Presentational Modal Component ---
const ProductModal = ({ 
    isOpen, onClose, handleSubmit, product, isEditing, onToggleEditMode, formData, handleFormChange, 
    handleImageChange, isUploading, imagePreviewUrl, categories, subCategories, childSubCategories, 
    allCategoriesMap, getProductStockStatus, addStock
} : {
    isOpen: boolean;
    onClose: () => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    product: ProductInventory | null;
    isEditing: boolean;
    onToggleEditMode: () => void;
    formData: ProductFormData;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    imagePreviewUrl: string;
    categories: any[];
    subCategories: any[];
    childSubCategories: any[];
    allCategoriesMap: Map<number, any>;
    getProductStockStatus: (product: ProductInventory | null) => StockStatus;
    addStock: (productId: number, amountToAdd: number) => Promise<boolean>; // <-- PROP FOR ADDING STOCK
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

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
                <h3 className="font-bold text-lg">{product?.Product_ID ? (isEditing ? `แก้ไขสินค้า ID: ${product.Product_ID}` : `รายละเอียดสินค้า ID: ${product.Product_ID}`) : 'เพิ่มสินค้าใหม่'}</h3>
                
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                  {isEditing ? (
                      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                          {/* EDIT FORM - REMAINS UNCHANGED */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                  <div className="text-center">
                                      <img src={imagePreviewUrl} alt="Product Preview" className="w-full h-48 object-contain rounded-lg mx-auto border bg-base-200" />
                                  </div>
                                  <div>
                                      <label className="label"><span className="label-text">อัปโหลดรูปภาพใหม่</span></label>
                                      <input type="file" name="imageFile" className="file-input file-input-bordered w-full" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                                  </div>
                                  <div><label className="label"><span className="label-text">ชื่อสินค้า</span></label><input name="Name" value={formData.Name || ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">แบรนด์</span></label><input name="Brand" value={formData.Brand || ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">รายละเอียด</span></label><textarea name="Description" value={formData.Description || ''} onChange={handleFormChange} className="textarea textarea-bordered w-full h-24"></textarea></div>
                              </div>
                              <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label"><span className="label-text">หน่วย</span></label><input name="Unit" value={formData.Unit || ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                    <div><label className="label"><span className="label-text">ขนาด</span></label><input name="Dimensions" value={formData.Dimensions || ''} onChange={handleFormChange} className="input input-bordered w-full" /></div>
                                  </div>
                                  <div><label className="label"><span className="label-text">วัสดุ</span></label><input name="Material" value={formData.Material || ''} onChange={handleFormChange} className="input input-bordered w-full" /></div>
                                  <div><label className="label"><span className="label-text">จำนวน (สต็อกตั้งต้น)</span></label><input name="Quantity" type="number" value={formData.Quantity ?? ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">ต้นทุน</span></label><input name="Sale_Cost" type="number" step="0.01" value={formData.Sale_Cost ?? ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">ราคาขายปกติ</span></label><input name="Sale_Price" type="number" step="0.01" value={formData.Sale_Price ?? ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">ราคาลด (ถ้ามี)</span></label><input name="Discount_Price" type="number" step="0.01" value={formData.Discount_Price ?? ''} onChange={handleFormChange} className="input input-bordered w-full" /></div>
                                  <div><label className="label"><span className="label-text">จุดสั่งซื้อซ้ำ</span></label><input name="Reorder_Point" type="number" value={formData.Reorder_Point ?? ''} onChange={handleFormChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่หลัก</span></label><select name="Selected_Category_ID" value={formData.Selected_Category_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" required><option value="">เลือกหมวดหมู่</option>{categories.map(c => <option key={c.Category_ID} value={Number(c.Category_ID)}>{c.Name}</option>)}</select></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่รอง</span></label><select name="Selected_Sub_Category_ID" value={formData.Selected_Sub_Category_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" disabled={!formData.Selected_Category_ID} required><option value="">เลือกหมวดหมู่รอง</option>{filteredSubCategories.map(s => <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>)}</select></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่ย่อย</span></label><select name="Child_ID" value={formData.Child_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" disabled={!formData.Selected_Sub_Category_ID} required><option value="">เลือกหมวดหมู่ย่อย</option>{filteredChildSubCategories.map(c => <option key={c.Child_ID} value={c.Child_ID}>{c.Name}</option>)}</select></div>
                                  <label className="label cursor-pointer"><span className="label-text">แสดงผลบนเว็บ</span><input type="checkbox" name="Visibility" checked={!!formData.Visibility} onChange={handleFormChange} className="checkbox checkbox-primary" /></label>
                              </div>
                          </div>
                      </form>
                  ) : (
                    // --- NEW VIEW MODE --- 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold mb-2">ข้อมูลสินค้า</h4>
                            <div className="text-center mb-4"><img src={product?.Image_URL || 'https://placehold.co/300x200?text=Image'} alt={product?.Name} className="w-full h-48 object-contain rounded-lg mx-auto border bg-base-200" /></div>
                            <p><strong>ชื่อสินค้า:</strong> {product?.Name}</p>
                            <p><strong>แบรนด์:</strong> {product?.Brand}</p>
                            <p><strong>หมวดหมู่:</strong> {getFullCategoryName(product?.Child_ID || null)}</p>
                            <p><strong>ราคาขาย:</strong> {formatPrice(product?.Sale_Price || 0)}</p>
                            <p><strong>สถานะการแสดงผล:</strong> {product?.Visibility ? 'แสดงผล' : 'ซ่อน'}</p>
                            <p><strong>รายละเอียด:</strong> {product?.Description || '-'}</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">สรุปข้อมูลสต็อก</h4>
                                <div className="stats stats-vertical shadow w-full bg-base-200">
                                    <div className="stat">
                                        <div className="stat-title">สต็อกตั้งต้น</div>
                                        <div className="stat-value">{product?.Quantity ?? 0}</div>
                                        <div className="stat-desc">จำนวนที่รับเข้าทั้งหมด</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">ยอดขายสะสม</div>
                                        <div className="stat-value text-error">-{product?.Total_Sales ?? 0}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">ยอดคืน/ยกเลิก</div>
                                        <div className="stat-value text-success">+{product?.Cancellation_Count ?? 0}</div>
                                    </div>
                                    <div className="stat border-t-2 border-base-300">
                                        <div className="stat-title">คงเหลือขายได้</div>
                                        <div className="stat-value text-primary">{product ? calculateAvailableStock(product) : 0}</div>
                                        <div className={`stat-desc font-bold ${stockStatus === 'in_stock' ? 'text-success' : stockStatus === 'low_stock' ? 'text-warning' : 'text-error'}`}>
                                            {stockStatus === 'in_stock' ? 'ในสต็อก' : stockStatus === 'low_stock' ? 'ใกล้หมด' : 'สินค้าหมด'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 mt-4">เพิ่มสต็อกสินค้า</h4>
                                <div className="form-control space-y-2 p-4 border rounded-lg bg-base-200">
                                    <label className="input-group">
                                        <input 
                                            type="number" 
                                            placeholder="กรอกจำนวน" 
                                            className="input input-bordered w-full" 
                                            value={amountToAdd || ''}
                                            onChange={(e) => setAmountToAdd(Number(e.target.value))}
                                            min="1"
                                        />
                                        <span>{product?.Unit}</span>
                                    </label>
                                    <button 
                                        className="btn btn-secondary w-full"
                                        onClick={handleAddStockClick}
                                        disabled={!amountToAdd || amountToAdd <= 0 || isUploading}
                                    >
                                        <FiPlus /> เพิ่มสต็อก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
                <div className="modal-action">
                    {isEditing ? (
                        <div>
                            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isUploading}>
                                <FiX/> ยกเลิก
                            </button>
                            <button form='product-form' type="submit" className="btn btn-primary" disabled={isUploading}>
                                {isUploading && <span className="loading loading-spinner"></span>}
                                {isUploading ? 'กำลังบันทึก...' : <><FiSave/> บันทึก</>}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} className="btn">ปิด</button>
                            <button type="button" onClick={onToggleEditMode} className="btn btn-primary"><FiEdit/> แก้ไข</button>
                        </>
                    )}
                </div>
            </div>
        </dialog>
    );
};

// --- Main Page Component ---
export default function ProductManagementPage() {
    const { data: session, status, update } = useSession();
    const { loading, error, data, filteredProducts, allCategoriesMap, filters, setFilters, actions } = useProductManagement();
    const { openModal, modalProps } = useProductModal({ onSave: actions.saveProduct });

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

    const stats = useMemo(() => ({
        total: data.products.length,
        inStock: data.products.filter(p => actions.getProductStockStatus(p) === 'in_stock').length,
        lowStock: data.products.filter(p => actions.getProductStockStatus(p) === 'low_stock').length,
        outOfStock: data.products.filter(p => actions.getProductStockStatus(p) === 'out_of_stock').length,
        visible: data.products.filter(p => p.Visibility).length
    }), [data.products, actions.getProductStockStatus]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 text-error">Error: {error}</div>;
    if (!session || !session.user.Stock_Mgr) return <AccessDeniedPage url="/admin"/>;
  
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
                    <button className="btn btn-outline"><FiDownload /> ส่งออกข้อมูล</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'all')}><div className="flex items-center gap-3" ><div className="p-2 bg-neutral/10 rounded-lg"><FiBox className="w-5 h-5 text-neutral"/></div><div><p className="text-sm text-base-content/70">สินค้าทั้งหมด</p><p className="text-2xl font-bold">{stats.total}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'in_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-success/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-success"/></div><div><p className="text-sm text-base-content/70">ในสต็อก</p><p className="text-2xl font-bold">{stats.inStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'low_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-warning/10 rounded-lg"><FiAlertTriangle className="w-5 h-5 text-warning"/></div><div><p className="text-sm text-base-content/70">สินค้าใกล้หมด</p><p className="text-2xl font-bold">{stats.lowStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4 cursor-pointer"onClick={() => handleFilterChange('stockStatusFilter', 'out_of_stock')}><div className="flex items-center gap-3" ><div className="p-2 bg-error/10 rounded-lg"><FiAlertCircle className="w-5 h-5 text-error"/></div><div><p className="text-sm text-base-content/70">สินค้าหมด</p><p className="text-2xl font-bold">{stats.outOfStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-info/10 rounded-lg"><FiEye className="w-5 h-5 text-info"/></div><div><p className="text-sm text-base-content/70">สินค้าที่แสดง</p><p className="text-2xl font-bold">{stats.visible}</p></div></div></div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 items-center">
                    <div className="col-span-full xl:col-span-2"><input type="text" placeholder="ค้นหา..." value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} className="input input-bordered w-full" /></div>
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
                
            />
        </div>
    </div>
  );
}