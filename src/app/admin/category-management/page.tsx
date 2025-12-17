'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiPlus, FiTag, FiEdit, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { useCategoryManagement } from '@/app/hooks/admin/useCategoryManagement';
import { CategoryDisplayItem, CategoryFormData, Category, SubCategory, ModalMode } from '@/types';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Pagination from '@/app/components/Pagination';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';

// --- Reusable UI Components ---

const CategoryRow: React.FC<{ item: CategoryDisplayItem; openModal: (item: CategoryDisplayItem, mode: ModalMode) => void; deleteCategory: (item: CategoryDisplayItem) => void; }> = ({ item, openModal, deleteCategory }) => (
    <tr className="hover">
        <td className="font-bold text-primary">{item.ID}</td>
        <td>{item.Name}</td>
        <td>{item.Type === 'main' ? 'หมวดหมู่หลัก' : item.Type === 'sub' ? 'หมวดหมู่รอง' : 'หมวดหมู่ย่อย'}</td>
        <td>{item.ParentName || '-'}</td>
        <td>
            <button onClick={() => openModal(item, 'edit')} className="btn btn-ghost btn-xs" title="แก้ไข"><FiEdit className="w-4 h-4"/></button>
            <button onClick={() => deleteCategory(item)} className="btn btn-ghost btn-xs text-error" title="ลบ"><FiTrash2 className="w-4 h-4"/></button>
        </td>
    </tr>
);

const CategoryCard: React.FC<{ item: CategoryDisplayItem; openModal: (item: CategoryDisplayItem, mode: ModalMode) => void; deleteCategory: (item: CategoryDisplayItem) => void; }> = ({ item, openModal, deleteCategory }) => (
    <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
            <h2 className="card-title text-base">{item.Name}</h2>
            <p className="text-sm">ID: {item.ID} | ระดับ: {item.Type === 'main' ? 'หลัก' : item.Type === 'sub' ? 'รอง' : 'ย่อย'}</p>
            <p className="text-sm text-base-content/70">อยู่ภายใต้: {item.ParentName || '-'}</p>
            <div className="card-actions justify-end">
                <button onClick={() => openModal(item, 'edit')} className="btn btn-ghost btn-xs"><FiEdit className="w-4 h-4"/> แก้ไข</button>
                <button onClick={() => deleteCategory(item)} className="btn btn-ghost btn-xs text-error"><FiTrash2 className="w-4 h-4"/> ลบ</button>
            </div>
        </div>
    </div>
);

const CategoryModal: React.FC<{
    isOpen: boolean;
    mode: ModalMode;
    item: CategoryDisplayItem | null;
    actions: { save: (formData: CategoryFormData) => void; close: () => void; };
    data: { main: Category[]; sub: SubCategory[]; };
}> = ({ isOpen, mode, item, actions, data }) => {
    const [formData, setFormData] = useState<CategoryFormData>({ 
        ID: null, 
        Name: '', 
        Type: 'main', 
        Category_ID: null, 
        Sub_Category_ID: null 
    });

    useEffect(() => {
        if (isOpen) {
            if (item && mode === 'edit') {
                let mainParentId = null;
                let subParentId = null;
                if (item.Type === 'sub') {
                    mainParentId = item.ParentId;
                } else if (item.Type === 'child') {
                    const subParent = data.sub.find(s => s.Sub_Category_ID === item.ParentId);
                    if (subParent) {
                        mainParentId = subParent.Category_ID;
                        subParentId = subParent.Sub_Category_ID;
                    }
                }
                setFormData({
                    ID: item.ID,
                    Name: item.Name,
                    Type: item.Type,
                    Category_ID: mainParentId,
                    Sub_Category_ID: subParentId,
                });
            } else {
                setFormData({ ID: null, Name: '', Type: 'main', Category_ID: null, Sub_Category_ID: null });
            }
        }
    }, [isOpen, mode, item, data]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState: CategoryFormData = { ...prev, [name]: value };
            if (name === 'Type') {
                newState.Category_ID = null;
                newState.Sub_Category_ID = null;
            }
            if (name === 'Category_ID') {
                newState.Sub_Category_ID = null;
            }
            return newState;
        });
    };
    
    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={actions.close}>✕</button>
                <h3 className="font-bold text-lg">{mode === 'add' ? 'เพิ่มหมวดหมู่ใหม่' : `แก้ไขหมวดหมู่ #${item?.ID}`}</h3>
                <form id="category-form" onSubmit={(e) => { e.preventDefault(); actions.save(formData); }} className="space-y-4 py-4">
                    <div>
                        <label className="label"><span className="label-text">ระดับหมวดหมู่</span></label>
                        <select name="Type" disabled={mode === 'edit'} value={formData.Type} onChange={handleFormChange} className="select select-bordered w-full">
                            <option value="main">หมวดหมู่หลัก</option>
                            <option value="sub">หมวดหมู่รอง</option>
                            <option value="child">หมวดหมู่ย่อย</option>
                        </select>
                    </div>
                    {formData.Type === 'sub' && (
                        <div>
                            <label className="label"><span className="label-text">เลือกหมวดหมู่หลัก</span></label>
                            <select name="Category_ID" value={formData.Category_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" required>
                                <option disabled value="">-- เลือก --</option>
                                {data.main.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>)}
                            </select>
                        </div>
                    )}
                    {formData.Type === 'child' && (
                         <>
                            <div>
                                <label className="label"><span className="label-text">เลือกหมวดหมู่หลัก</span></label>
                                <select name="Category_ID" value={formData.Category_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" required>
                                    <option disabled value="">-- เลือก --</option>
                                    {data.main.map(c => <option key={c.Category_ID} value={c.Category_ID}>{c.Name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label"><span className="label-text">เลือกหมวดหมู่รอง</span></label>
                                <select name="Sub_Category_ID" value={formData.Sub_Category_ID || ''} onChange={handleFormChange} className="select select-bordered w-full" disabled={!formData.Category_ID} required>
                                    <option disabled value="">-- เลือก --</option>
                                    {data.sub.filter(s => s.Category_ID === Number(formData.Category_ID)).map(s => <option key={s.Sub_Category_ID} value={s.Sub_Category_ID}>{s.Name}</option>)}
                                </select>
                            </div>
                         </>
                    )}
                     <div>
                        <label className="label"><span className="label-text">ชื่อหมวดหมู่</span></label>
                        <input type="text" name="Name" value={formData.Name} onChange={handleFormChange} className="input input-bordered w-full" required />
                    </div>
                </form>
                <div className="modal-action">
                    <button type="button" className="btn btn-ghost" onClick={actions.close}><FiX /> ยกเลิก</button>
                    <button type="submit" form="category-form" className="btn btn-primary"><FiSave /> บันทึก</button>
                </div>
            </div>
        </dialog>
    );
};


// --- Main Page Component ---
export default function CategoryManagementPage() {
    const { data: session } = useSession();
    const { loading, error, data, filteredItems, filters, setFilters, actions, modalState, modalActions } = useCategoryManagement();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const paginatedItems = useMemo(() => filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredItems, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const stats = useMemo(() => ({
    total: data.main.length + data.sub.length + data.child.length,
    main: data.main.length,
    sub: data.sub.length,
    child: data.child.length,
    }), [data]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 text-error"><h3>เกิดข้อผิดพลาด:</h3><p>{error}</p></div>;

    if (!session || !session.user?.Stock_Mgr) return <AccessDeniedPage url="/admin"/>;

    return (
        <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto">
            <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold">จัดการหมวดหมู่สินค้า</h1>
                    <p className="text-base-content/70 mt-1">จัดการหมวดหมู่ (หลัก, รอง, ย่อย)</p>
                </div>
                <button className="btn btn-primary" onClick={() => modalActions.open(null, 'add')}>
                    <FiPlus /> เพิ่มหมวดหมู่ใหม่
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><FiTag className="w-5 h-5 text-neutral"/><div><p className="text-sm">หมวดหมู่ทั้งหมด</p><p className="font-bold text-xl">{stats.total}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><FiTag className="w-5 h-5 text-primary"/><div><p className="text-sm">หมวดหมู่หลัก</p><p className="font-bold text-xl">{stats.main}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><FiTag className="w-5 h-5 text-info"/><div><p className="text-sm">หมวดหมู่รอง</p><p className="font-bold text-xl">{stats.sub}</p></div></div></div>
                <div className="card bg-base-100 shadow-sm p-4"><div className="flex items-center gap-3"><FiTag className="w-5 h-5 text-green-600"/><div><p className="text-sm">หมวดหมู่ย่อย</p><p className="font-bold text-xl">{stats.child}</p></div></div></div>
            </div>
            
            <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4 z-10" />
                        <input type="text" placeholder="ค้นหาด้วยชื่อหรือ ID..." value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} className="input input-bordered w-full pl-10" />
                    </div>
                </div>
                <select value={filters.typeFilter} onChange={e => setFilters({...filters, typeFilter: e.target.value as string})} className="select select-bordered w-full">
                    <option value="all">ทุกระดับ</option>
                    <option value="main">หมวดหมู่หลัก</option>
                    <option value="sub">หมวดหมู่รอง</option>
                    <option value="child">หมวดหมู่ย่อย</option>
                </select>
                <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="select select-bordered w-full">
                    <option value={10}>10 รายการ/หน้า</option>
                    <option value={20}>20 รายการ/หน้า</option>
                    <option value={50}>50 รายการ/หน้า</option>
                </select>
            </div>
            </div>
            
            <div className="hidden md:block overflow-x-auto bg-base-100 rounded-lg shadow-sm">
            <table className="table w-full">
                <thead><tr><th>ID</th><th>ชื่อ</th><th>ระดับ</th><th>หมวดหมู่</th><th>จัดการ</th></tr></thead>
                <tbody>
                {paginatedItems.map(item => <CategoryRow key={`${item.Type}-${item.ID}`} item={item} openModal={modalActions.open} deleteCategory={actions.deleteCategory} />)}
                </tbody>
            </table>
            </div>

            <div className="grid md:hidden grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {paginatedItems.map(item => <CategoryCard key={`${item.Type}-${item.ID}`} item={item} openModal={modalActions.open} deleteCategory={actions.deleteCategory} />)}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItemsCount={filteredItems.length} itemsPerPage={itemsPerPage} />
            
            <CategoryModal isOpen={modalState.isOpen} mode={modalState.mode} item={modalState.item} actions={{ save: actions.saveCategory, close: modalActions.close }} data={data} />
        </div>
        </div>
    );
}