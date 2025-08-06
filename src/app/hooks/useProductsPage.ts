'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductInventory, Category, SubCategory, ChildSubCategory, FullCategoryPath, ProductsPageData } from '../../types';

// Data structure for the entire page's data

export function useProductsPage() {
  const searchParams = useSearchParams();
  const [pageData, setPageData] = useState<ProductsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all data for the page from our new API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/main/products');
        if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
        const data: ProductsPageData = await response.json();
        setPageData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Memoize the category map for performance
  const allCategoriesMap = useMemo(() => {
    if (!pageData) return new Map<number, FullCategoryPath>();
    
    const map = new Map<number, FullCategoryPath>();
    pageData.categories.forEach(cat => {
      pageData.subCategories.filter(sub => sub.Category_ID === cat.Category_ID).forEach(sub => {
        pageData.childSubCategories.filter(child => child.Sub_Category_ID === sub.Sub_Category_ID).forEach(child => {
          map.set(child.Child_ID, {
            Category_ID: cat.Category_ID, Category_Name: cat.Name,
            Sub_Category_ID: sub.Sub_Category_ID, Sub_Category_Name: sub.Name,
            Child_ID: child.Child_ID, Child_Name: child.Name,
          });
        });
      });
    });
    return map;
  }, [pageData]);

  // 3. Filter products based on URL params
  const filteredProducts = useMemo(() => {
    if (!pageData) return [];

    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const childCategoryId = searchParams.get('childCategoryId');
    const discount = searchParams.get('discount');
    const searchTerm = searchParams.get('search');

    let products = pageData.products;

    if (searchTerm) {
      return products.filter(p => 
        p.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.Brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (discount === 'true') {
      return products.filter(p => p.Sale_Price < p.Sale_Cost);
    }
    if (childCategoryId) {
      return products.filter(p => p.Child_ID === Number(childCategoryId));
    }
    if (subCategoryId) {
      return products.filter(p => allCategoriesMap.get(p.Child_ID!)?.Sub_Category_ID === Number(subCategoryId));
    }
    if (categoryId) {
      return products.filter(p => allCategoriesMap.get(p.Child_ID!)?.Category_ID === Number(categoryId));
    }

    return products;
  }, [pageData, searchParams, allCategoriesMap]);

  return {
    loading,
    error,
    pageData,
    filteredProducts,
    allCategoriesMap,
  };
}