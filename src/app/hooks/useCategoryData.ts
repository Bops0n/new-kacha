'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Category, SubCategory, ChildSubCategory, FullCategoryPath } from '@/types';

// Data structure for the hook's return value
interface CategoryData {
  categories: Category[];
  subCategories: SubCategory[];
  childSubCategories: ChildSubCategory[];
}

/**
 * Hook ส่วนกลางสำหรับดึงและจัดการข้อมูลหมวดหมู่ทั้งหมด
 * - เป็น Single Source of Truth สำหรับ Categories, SubCategories, และ ChildSubCategories
 * - ดึงข้อมูลจาก API แค่ครั้งเดียวและจัดการ state loading/error
 * - มี Memoized map และ helper functions สำหรับการใช้งานที่สะดวกและมีประสิทธิภาพ
 */
export function useCategoryData() {
  const [data, setData] = useState<CategoryData>({
    categories: [],
    subCategories: [],
    childSubCategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await fetch('/api/main/navigation');
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []); // ดึงข้อมูลแค่ครั้งเดียวเมื่อ hook ถูกใช้งาน

  // Memoized map เพื่อการค้นหา Category Path เต็มๆ ที่รวดเร็ว
  const allCategoriesMap = useMemo(() => {
    const map = new Map<number, FullCategoryPath>();
    if (data.categories.length > 0) {
        data.categories.forEach(cat => {
            data.subCategories.filter(sub => sub.Category_ID === cat.Category_ID).forEach(sub => {
                data.childSubCategories.filter(child => child.Sub_Category_ID === sub.Sub_Category_ID).forEach(child => {
                    map.set(child.Child_ID, {
                        Category_ID: cat.Category_ID, Category_Name: cat.Name,
                        Sub_Category_ID: sub.Sub_Category_ID, Sub_Category_Name: sub.Name,
                        Child_ID: child.Child_ID, Child_Name: child.Name,
                    });
                });
            });
        });
    }
    return map;
  }, [data]);
  
  // Helper function เพื่อดึงชื่อ Path เต็มๆ
  const getFullCategoryName = useCallback((childId: number | null) => {
    if (childId === null || !allCategoriesMap.has(childId)) return 'N/A';
    const path = allCategoriesMap.get(childId);
    return `${path?.Category_Name} > ${path?.Sub_Category_Name} > ${path?.Child_Name}`;
  }, [allCategoriesMap]);

  return { ...data, loading, error, allCategoriesMap, getFullCategoryName };
}