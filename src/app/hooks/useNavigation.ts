'use client';

import { useState, useEffect } from 'react';
import { Category, SubCategory, ChildSubCategory } from '@/types';

interface NavigationData {
  categories: Category[];
  subCategories: SubCategory[];
  childSubCategories: ChildSubCategory[];
}

export function useNavigation() {
  const [navData, setNavData] = useState<NavigationData>({
    categories: [],
    subCategories: [],
    childSubCategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const response = await fetch('/api/main/navigation');
        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลเมนูได้');
        }
        const data = await response.json();
        setNavData(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchNavData();
  }, []); // ดึงข้อมูลแค่ครั้งเดียวเมื่อ component โหลด

  return { ...navData, loading, error };
}