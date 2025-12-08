'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductInventory, Category, SubCategory, ChildSubCategory, FullCategoryPath, ProductsPageData } from '../../types';

export function useProductsPage() {
  const searchParams = useSearchParams();
  
  // State
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [childSubCategories, setChildSubCategories] = useState<ChildSubCategory[]>([]);
  const [total,setTotal] = useState(0);
  
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref สำหรับกันการเรียกซ้ำ
  const isFetchingRef = useRef(false);
  const limit = 20; // กำหนดจำนวนต่อหน้าให้ชัดเจนตรงนี้

  // ฟังก์ชันโหลดข้อมูล (ปรับปรุงใหม่: คำนวณ Page จากสินค้าที่มี)
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (isFetchingRef.current) return;
    if(total <= products.length && isLoadMore) {
      setHasMore(false);
      return
    };
    // if(products.length > total) return;
    
    setLoading(true);
    isFetchingRef.current = true;
    setError(null);

    try {
      // Logic คำนวณหน้าถัดไป:
      // ถ้าโหลดเพิ่ม -> หน้าถัดไป = (จำนวนสินค้าปัจจุบัน / จำนวนต่อหน้า) + 1
      // ถ้าโหลดใหม่ -> หน้า 1
      const nextPage = isLoadMore ? Math.floor(products.length / limit) + 1 : 1;

      // สร้าง Params
      const currentParams = new URLSearchParams(searchParams.toString());
      currentParams.set('page', nextPage.toString());
      currentParams.set('limit', limit.toString());

      // เรียก API
      const response = await fetch(`/api/main/products?${currentParams.toString()}`);
      
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      const data = await response.json();

      // อัปเดต Categories (ทำเฉพาะครั้งแรกหรือทุกครั้งก็ได้)
      if (data.categories) {
          setCategories(data.categories);
          setSubCategories(data.subCategories);
          setChildSubCategories(data.childSubCategories);
      }
      
      
      // อัปเดตสินค้า
      if (isLoadMore) {
        // ตรวจสอบสินค้าซ้ำก่อน Merge (เพื่อความชัวร์)

        setProducts(prev => {
          const newProducts = data.products.filter((p: ProductInventory) => 
            !prev.some(existing => existing.Product_ID === p.Product_ID)
        );
        return [...prev, ...newProducts];
      });
      } else {
      data.total? setTotal(data.total): setTotal(0);
        setProducts(data.products);
        window.scrollTo(0, 0); // เลื่อนขึ้นบนสุดเฉพาะตอนโหลดใหม่ (Filter/Search)
      }

      // เช็คว่ามีหน้าต่อไปไหมจาก API
      setHasMore(data.hasMore);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchParams, products.length]); // Dependency ที่สำคัญคือ products.length

  // Effect: เมื่อ URL Params เปลี่ยน (เช่น ค้นหา, เปลี่ยนหมวด) -> ให้โหลดใหม่ (Reset)
  useEffect(() => {
    fetchProducts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ฟังก์ชัน Load More ที่ UI จะเรียกใช้
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !isFetchingRef.current) {
        fetchProducts(true);
    }
  }, [hasMore, loading, fetchProducts]);

  // สร้าง Map Categories (เหมือนเดิม)
  const allCategoriesMap = useMemo(() => {
    const map = new Map<number, FullCategoryPath>();
    if (categories.length > 0 && subCategories.length > 0 && childSubCategories.length > 0) {
        childSubCategories.forEach(child => {
            const sub = subCategories.find(s => s.Sub_Category_ID === child.Sub_Category_ID);
            const main = categories.find(c => c.Category_ID === sub?.Category_ID);
            if (sub && main) {
                map.set(child.Child_ID, {
                    Category_ID: main.Category_ID,
                    Category_Name: main.Name,
                    Sub_Category_ID: sub.Sub_Category_ID,
                    Sub_Category_Name: sub.Name,
                    Child_ID: child.Child_ID,
                    Child_Name: child.Name
                });
            }
        });
    }
    return map;
  }, [categories, subCategories, childSubCategories]);

  return {
    loading,
    error,
    pageData: { products, categories, subCategories, childSubCategories, total},
    filteredProducts: products,
    allCategoriesMap,
    loadMore,
    hasMore
  };
}