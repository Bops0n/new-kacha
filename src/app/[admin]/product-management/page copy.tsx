'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiPlus, FiEye, FiEdit, FiTrash2, FiBox, FiSave, FiX, FiDownload, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { useProductManagement } from '@/app/hooks/admin/useProductManagement';
import { ProductInventory, Category, SubCategory, ChildSubCategory, FullCategoryPath } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { formatPrice } from '@/app/utils/formatters';

// --- Product Modal Component (Co-located with the page) ---
const ProductModal = ({ isOpen, onClose, onSave, product, isEditing: initialIsEditing, categories, subCategories, childSubCategories, allCategoriesMap, getFullCategoryName, getProductStockStatus }) => {
    const [formData, setFormData] = useState<Partial<ProductInventory> & { Selected_Category_ID?: number | null, Selected_Sub_Category_ID?: number | null }>({});
    const [isEditing, setIsEditing] = useState(initialIsEditing);

    useEffect(() => {
        const initialFormState = product || { Visibility: true, Unit: 'ชิ้น', Quantity: 0, Sale_Cost: 0, Sale_Price: 0, Reorder_Point: 0 };
        const catPath = product?.Child_ID ? allCategoriesMap.get(product.Child_ID) : null;
        setFormData({ ...initialFormState, Selected_Category_ID: catPath?.Category_ID || null, Selected_Sub_Category_ID: catPath?.Sub_Category_ID || null });
        setIsEditing(initialIsEditing);
    }, [product, initialIsEditing, allCategoriesMap]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target;
        let val: any = value;
        if (type === 'checkbox') val = checked;
        else if (e.target.type === 'number' && value !== '') val = Number(value);
        
        const newFormData = { ...formData, [name]: val };
        if (name === 'Selected_Category_ID') { newFormData.Selected_Sub_Category_ID = null; newFormData.Child_ID = null; }
        else if (name === 'Selected_Sub_Category_ID') { newFormData.Child_ID = null; }
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    const filteredSubCategories = useMemo(() => formData.Selected_Category_ID ? subCategories.filter(s => s.Category_ID === formData.Selected_Category_ID) : [], [formData.Selected_Category_ID, subCategories]);
    const filteredChildSubCategories = useMemo(() => formData.Selected_Sub_Category_ID ? childSubCategories.filter(c => c.Sub_Category_ID === formData.Selected_Sub_Category_ID) : [], [formData.Selected_Sub_Category_ID, childSubCategories]);

    if (!isOpen) return null;

    const stockStatus = getProductStockStatus(product || {});
    
    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                <h3 className="font-bold text-lg">{product?.Product_ID ? (isEditing ? `แก้ไขสินค้า ID: ${product.Product_ID}` : `รายละเอียดสินค้า ID: ${product.Product_ID}`) : 'เพิ่มสินค้าใหม่'}</h3>
                
                <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                  {isEditing ? (
                      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                  <div className="text-center"><img src={formData.Image_URL || 'https://placehold.co/300x200?text=Image'} alt="Product" className="w-full h-48 object-contain rounded-lg mx-auto border bg-base-200" /></div>
                                  <div><label className="label"><span className="label-text">URL รูปภาพ</span></label><input name="Image_URL" value={formData.Image_URL || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" className="input input-bordered w-full" /></div>
                                  <div><label className="label"><span className="label-text">ชื่อสินค้า</span></label><input name="Name" value={formData.Name || ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">แบรนด์</span></label><input name="Brand" value={formData.Brand || ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">รายละเอียด</span></label><textarea name="Description" value={formData.Description || ''} onChange={handleChange} className="textarea textarea-bordered w-full h-24"></textarea></div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label"><span className="label-text">หน่วย</span></label><input name="Unit" value={formData.Unit || ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                    <div><label className="label"><span className="label-text">ขนาด</span></label><input name="Dimensions" value={formData.Dimensions || ''} onChange={handleChange} className="input input-bordered w-full" /></div>
                                  </div>
                                  <div><label className="label"><span className="label-text">วัสดุ</span></label><input name="Material" value={formData.Material || ''} onChange={handleChange} className="input input-bordered w-full" /></div>
                              </div>
                              <div className="space-y-4">
                                  <div><label className="label"><span className="label-text">จำนวน</span></label><input name="Quantity" type="number" value={formData.Quantity ?? ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">ต้นทุน</span></label><input name="Sale_Cost" type="number" step="0.01" value={formData.Sale_Cost ?? ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">ราคาขาย</span></label><input name="Sale_Price" type="number" step="0.01" value={formData.Sale_Price ?? ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">จุดสั่งซื้อซ้ำ</span></label><input name="Reorder_Point" type="number" value={formData.Reorder_Point ?? ''} onChange={handleChange} className="input input-bordered w-full" required /></div>
                                  <div><label className="label"><span className="label-text">คะแนนรีวิว (1-5)</span></label><input name="Review_Rating" type="number" step="0.1" value={formData.Review_Rating || ''} onChange={handleChange} className="input input-bordered w-full" min="0" max="5" /></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่หลัก</span></label><select name="Selected_Category_ID" value={formData.Selected_Category_ID || ''} onChange={handleChange} className="select select-bordered w-full" required><option disabled value="">เลือกหมวดหมู่</option>{categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>)}</select></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่ย่อย</span></label><select name="Selected_Sub_Category_ID" value={formData.Selected_Sub_Category_ID || ''} onChange={handleChange} className="select select-bordered w-full" disabled={!formData.Selected_Category_ID} required><option disabled value="">เลือกหมวดหมู่ย่อย</option>{filteredSubCategories.map(s => <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>)}</select></div>
                                  <div><label className="label"><span className="label-text">หมวดหมู่ย่อยย่อย</span></label><select name="Child_ID" value={formData.Child_ID || ''} onChange={handleChange} className="select select-bordered w-full" disabled={!formData.Selected_Sub_Category_ID} required><option disabled value="">เลือกหมวดหมู่ย่อยย่อย</option>{filteredChildSubCategories.map(c => <option key={c.Child_ID} value={c.Child_ID}>{c.Name}</option>)}</select></div>
                                  <label className="label cursor-pointer"><span className="label-text">แสดงผลบนเว็บ</span><input type="checkbox" name="Visibility" checked={!!formData.Visibility} onChange={handleChange} className="checkbox checkbox-primary" /></label>
                              </div>
                          </div>
                      </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold mb-2">ข้อมูลสินค้า</h4>
                            <div className="text-center mb-4"><img src={product?.Image_URL || 'https://placehold.co/300x200?text=Image'} alt="Product" className="w-full h-48 object-contain rounded-lg mx-auto border bg-base-200" /></div>
                            <p><strong>ชื่อสินค้า:</strong> {product?.Name}</p>
                            <p><strong>แบรนด์:</strong> {product?.Brand}</p>
                            <p><strong>รายละเอียด:</strong> {product?.Description || '-'}</p>
                            <p><strong>หน่วย:</strong> {product?.Unit}</p>
                            <p><strong>ขนาด:</strong> {product?.Dimensions || '-'}</p>
                            <p><strong>วัสดุ:</strong> {product?.Material || '-'}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold mb-2">ข้อมูลคลังและหมวดหมู่</h4>
                            <p><strong>จำนวน:</strong> {product?.Quantity} {product?.Unit}</p>
                            <p><strong>ต้นทุน:</strong> {formatPrice(product?.Sale_Cost || 0)}</p>
                            <p><strong>ราคาขาย:</strong> {formatPrice(product?.Sale_Price || 0)}</p>
                            <p><strong>จุดสั่งซื้อซ้ำ:</strong> {product?.Reorder_Point}</p>
                            <p><strong>คะแนนรีวิว:</strong> {product?.Review_Rating || '-'}</p>
                            <p><strong>สถานะการแสดงผล:</strong> {product?.Visibility ? 'แสดงผล' : 'ซ่อน'}</p>
                            <p><strong>หมวดหมู่:</strong> {getFullCategoryName(product?.Child_ID || null)}</p>
                            <div className="mt-4"><p className="font-semibold">สถานะสต็อก:</p>
                                <span className={`badge ${stockStatus === 'in_stock' ? 'badge-success' : stockStatus === 'low_stock' ? 'badge-warning' : 'badge-error'}`}>
                                    {stockStatus === 'in_stock' ? 'ในสต็อก' : stockStatus === 'low_stock' ? 'ใกล้หมด' : 'สินค้าหมด'}
                                </span>
                            </div>
                        </div>
                    </div>
                  )}
                </div>

                <div className="modal-action">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={onClose} className="btn btn-ghost"><FiX/> ยกเลิก</button>
                            <button type="submit" form="product-form" className="btn btn-primary"><FiSave/> บันทึก</button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} className="btn">ปิด</button>
                            <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary"><FiEdit/> แก้ไข</button>
                        </>
                    )}
                </div>
            </div>
        </dialog>
    );
};


export default function ProductManagementPage() {
  const { loading, error, data, filteredProducts, allCategoriesMap, filters, setFilters, actions } = useProductManagement();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredProducts, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
        const newFilters = { ...prev, [filterName]: value };
        if (filterName === 'categoryFilter') { newFilters.subCategoryFilter = 'all'; newFilters.childCategoryFilter = 'all'; }
        if (filterName === 'subCategoryFilter') { newFilters.childCategoryFilter = 'all'; }
        return newFilters;
    });
    setCurrentPage(1);
  };
  
  const openModal = (product, mode) => { setSelectedProduct(product); setModalMode(mode); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const handleSave = async (formData) => { if (await actions.saveProduct(formData)) closeModal(); };

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const uniqueBrands = useMemo(() => ['all', ...Array.from(new Set(data.products.map(p => p.Brand).filter(Boolean)))], [data.products]);
  const getFullCategoryName = (childId) => allCategoriesMap.get(childId) ? `${allCategoriesMap.get(childId)?.Category_Name} > ${allCategoriesMap.get(childId)?.Sub_Category_Name} > ${allCategoriesMap.get(childId)?.Child_Name}` : 'N/A';

  const stats = useMemo(() => ({
    total: data.products.length,
    inStock: data.products.filter(p => actions.getProductStockStatus(p) === 'in_stock').length,
    lowStock: data.products.filter(p => actions.getProductStockStatus(p) === 'low_stock').length,
    outOfStock: data.products.filter(p => actions.getProductStockStatus(p) === 'out_of_stock').length,
    visible: data.products.filter(p => p.Visibility).length
  }), [data.products, actions.getProductStockStatus]);
  
  const filteredSubCategoriesForFilter = useMemo(() => filters.categoryFilter !== 'all' ? data.subCategories.filter(s => s.Category_ID === Number(filters.categoryFilter)) : [], [filters.categoryFilter, data.subCategories]);
  const filteredChildSubCategoriesForFilter = useMemo(() => filters.subCategoryFilter !== 'all' ? data.childSubCategories.filter(c => c.Sub_Category_ID === Number(filters.subCategoryFilter)) : [], [filters.subCategoryFilter, data.childSubCategories]);
  
  return (
    <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto">
            <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center">
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
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-neutral/10 rounded-lg"><FiBox className="w-5 h-5 text-neutral"/></div><div><p className="text-sm text-base-content/70">สินค้าทั้งหมด</p><p className="text-2xl font-bold">{stats.total}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-success/10 rounded-lg"><FiCheckCircle className="w-5 h-5 text-success"/></div><div><p className="text-sm text-base-content/70">ในสต็อก</p><p className="text-2xl font-bold">{stats.inStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-warning/10 rounded-lg"><FiAlertTriangle className="w-5 h-5 text-warning"/></div><div><p className="text-sm text-base-content/70">สินค้าใกล้หมด</p><p className="text-2xl font-bold">{stats.lowStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-error/10 rounded-lg"><FiAlertCircle className="w-5 h-5 text-error"/></div><div><p className="text-sm text-base-content/70">สินค้าหมด</p><p className="text-2xl font-bold">{stats.outOfStock}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><div className="p-2 bg-info/10 rounded-lg"><FiEye className="w-5 h-5 text-info"/></div><div><p className="text-sm text-base-content/70">สินค้าที่แสดง</p><p className="text-2xl font-bold">{stats.visible}</p></div></div></div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
                    <input type="text" placeholder="ค้นหา..." value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} className="input input-bordered w-full col-span-2 lg:col-span-2" />
                    <select value={filters.brandFilter} onChange={(e) => handleFilterChange('brandFilter', e.target.value)} className="select select-bordered w-full"><option value="all">ทุกแบรนด์</option>{uniqueBrands.map(b => b !== 'all' && <option key={b} value={b}>{b}</option>)}</select>
                    <select value={filters.categoryFilter} onChange={(e) => handleFilterChange('categoryFilter', e.target.value)} className="select select-bordered w-full"><option value="all">หมวดหมู่หลัก</option>{data.categories.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>)}</select>
                    <select value={filters.subCategoryFilter} onChange={(e) => handleFilterChange('subCategoryFilter', e.target.value)} className="select select-bordered w-full" disabled={filters.categoryFilter === 'all'}><option value="all">หมวดหมู่ย่อย</option>{filteredSubCategoriesForFilter.map(s => <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>)}</select>
                    <select value={filters.childCategoryFilter} onChange={(e) => handleFilterChange('childCategoryFilter', e.target.value)} className="select select-bordered w-full" disabled={filters.subCategoryFilter === 'all'}><option value="all">หมวดหมู่ย่อยย่อย</option>{filteredChildSubCategoriesForFilter.map(c => <option key={c.Child_ID} value={c.Child_ID}>{c.Name}</option>)}</select>
                    <select value={filters.stockStatusFilter} onChange={(e) => handleFilterChange('stockStatusFilter', e.target.value)} className="select select-bordered w-full"><option value="all">สถานะสต็อก</option><option value="in_stock">ในสต็อก</option><option value="low_stock">ใกล้หมด</option><option value="out_of_stock">สินค้าหมด</option></select>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="select select-bordered w-full"><option value={10}>10 รายการ</option><option value={20}>20 รายการ</option><option value={50}>50 รายการ</option></select>
                </div>
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-lg shadow-sm">
                <table className="table">
                    <thead><tr><th>รหัส</th><th>สินค้า</th><th>หมวดหมู่</th><th>จำนวน</th><th>ราคาขาย</th><th>สถานะการแสดงผล</th><th>จัดการ</th></tr></thead>
                    <tbody>
                        {paginatedProducts.map(product => (
                            <tr key={product.Product_ID} className="hover">
                                <td>{product.Product_ID}</td>
                                <td><div className="flex items-center gap-3"><div className="avatar"><div className="mask mask-squircle w-12 h-12"><img src={product.Image_URL || 'https://placehold.co/100x100'} alt={product.Name} /></div></div><div><div className="font-bold">{product.Name}</div><div className="text-sm opacity-50">{product.Brand}</div></div></div></td>
                                <td className="text-xs">{getFullCategoryName(product.Child_ID)}</td>
                                <td>{product.Quantity} {product.Unit}</td>
                                <td>{formatPrice(product.Sale_Price)}</td>
                                <td><span className={`badge ${product.Visibility ? 'badge-success' : 'badge-ghost'}`}>{product.Visibility ? 'แสดงผล' : 'ซ่อน'}</span></td>
                                <td>
                                    <button onClick={() => openModal(product, 'view')} className="btn btn-ghost btn-xs"><FiEye/></button>
                                    <button onClick={() => openModal(product, 'edit')} className="btn btn-ghost btn-xs"><FiEdit/></button>
                                    <button onClick={() => actions.deleteProduct(product.Product_ID)} className="btn btn-ghost btn-xs text-error"><FiTrash2/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="join mt-4 flex justify-center">
                {[...Array(totalPages).keys()].map(page => (<button key={page} onClick={() => setCurrentPage(page + 1)} className={`join-item btn ${currentPage === page + 1 ? 'btn-active' : ''}`}>{page + 1}</button>))}
            </div>

            <ProductModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} product={selectedProduct} isEditing={modalMode !== 'view'}
                categories={data.categories} subCategories={data.subCategories} childSubCategories={data.childSubCategories}
                allCategoriesMap={allCategoriesMap} getFullCategoryName={getFullCategoryName} getProductStockStatus={actions.getProductStockStatus} />
        </div>
    </div>
  );
}