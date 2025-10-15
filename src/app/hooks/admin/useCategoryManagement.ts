'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCategoryData } from '@/app/hooks/useCategoryData';
import { CategoryDisplayItem, CategoryFormData, ModalMode, Category, SubCategory, ChildSubCategory } from '@/types';

/**
 * Hook สำหรับจัดการ State และ Logic ทั้งหมดของหน้า Category Management
 * - ใช้ useCategoryData เพื่อดึงข้อมูลหมวดหมู่ทั้งหมด
 * - จัดการ State ของ Modal (เปิด/ปิด, โหมด, ข้อมูลที่ถูกเลือก)
 * - จัดการ Logic การกรองและค้นหาข้อมูล
 * - มีฟังก์ชันสำหรับเรียก API (เพิ่ม, แก้ไข, ลบ)
 */
export function useCategoryManagement() {
  const { showAlert } = useAlert();
  // 1. ดึงข้อมูลดิบและฟังก์ชัน refetch จาก Hook ส่วนกลาง
  const { 
    categories, subCategories, childSubCategories, 
    loading: dataLoading, error: dataError, refetch 
  } = useCategoryData();
  
  // State สำหรับเก็บข้อมูลที่ผสมกันแล้วเพื่อแสดงผล
  const [combinedList, setCombinedList] = useState<CategoryDisplayItem[]>([]);
  // State สำหรับการกรอง
  const [filters, setFilters] = useState({ searchTerm: '', typeFilter: 'all' });
  
  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [selectedItem, setSelectedItem] = useState<CategoryDisplayItem | null>(null);

  // 2. Effect สำหรับรวมข้อมูลดิบเป็น List ที่จะแสดงผลเมื่อข้อมูลมีการเปลี่ยนแปลง
  useEffect(() => {
    const allItems: CategoryDisplayItem[] = [
      ...categories.map(c => ({ 
          ID: c.Category_ID, Name: c.Name, Type: 'main' as const, 
          ParentId: null, ParentName: '-' 
      })),
      ...subCategories.map(c => ({ 
          ID: c.Sub_Category_ID, Name: c.Name, Type: 'sub' as const, 
          ParentId: c.Category_ID, ParentName: categories.find(m => m.Category_ID === c.Category_ID)?.Name || 'N/A' 
      })),
      ...childSubCategories.map(c => ({ 
          ID: c.Child_ID, Name: c.Name, Type: 'child' as const, 
          ParentId: c.Sub_Category_ID, ParentName: subCategories.find(s => s.Sub_Category_ID === c.Sub_Category_ID)?.Name || 'N/A' 
      })),
    ];
    setCombinedList(allItems);
  }, [categories, subCategories, childSubCategories]);

  // 3. Memoized Logic สำหรับกรองข้อมูล
  const filteredItems = useMemo(() => {
    return combinedList.filter(item => {
        const { searchTerm, typeFilter } = filters;
        if (typeFilter !== 'all' && item.Type !== typeFilter) return false;
        if (searchTerm && !item.Name.toLowerCase().includes(searchTerm.toLowerCase()) && !item.ID.toString().includes(searchTerm)) return false;
        return true;
    });
  }, [combinedList, filters]);

  // 4. ฟังก์ชันสำหรับจัดการ Modal และ CRUD
  const openModal = useCallback((item: CategoryDisplayItem | null, mode: ModalMode) => {
    setSelectedItem(item);
    setModalMode(mode);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const saveCategory = useCallback(async (formData: CategoryFormData) => {
    const isEditing = !!formData.ID;
    const method = isEditing ? 'PATCH' : 'POST';

    console.log(formData);

    try {
        const response = await fetch('/api/admin/categories', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
        
        showAlert(result.message, 'success');
        closeModal();
        refetch(); // สั่งให้ useCategoryData ดึงข้อมูลใหม่ทั้งหมด
    } catch (err: any) {
        showAlert(err.message, 'error');
    }
  }, [showAlert, closeModal, refetch]);

  const deleteCategory = useCallback((item: CategoryDisplayItem) => {
    showAlert(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ \n"${item.Name}" ?\nหากลบหมวดหมู่นี้ \n* หมวดหมู่ที่เกี่ยวข้องทั้งหมดจะถูกลบ\n* สินค้าที่เกี่ยวข้องจะไม่มีหมวดหมู่`, 'warning', `ยืนยันการลบ`, async () => {
        try {
            const response = await fetch(`/api/admin/categories?type=${item.Type}&id=${item.ID}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'เกิดข้อผิดพลาดในการลบ');

            showAlert(result.message, 'success');
            refetch(); // สั่งให้ useCategoryData ดึงข้อมูลใหม่ทั้งหมด
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [showAlert, refetch]);
  
  // 5. ค่าที่ Hook นี้จะส่งออกไปให้ Page Component ใช้งาน
  return {
    loading: dataLoading,
    error: dataError,
    data: { 
      main: categories, 
      sub: subCategories, 
      child: childSubCategories 
    },
    filteredItems,
    filters,
    setFilters,
    actions: { 
      saveCategory, 
      deleteCategory 
    },
    modalState: { 
      isOpen: isModalOpen, 
      mode: modalMode, 
      item: selectedItem 
    },
    modalActions: { 
      open: openModal, 
      close: closeModal 
    }
  };
}