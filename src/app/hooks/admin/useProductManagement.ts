'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { ProductInventory, Category, SubCategory, ChildSubCategory, FullCategoryPath } from '@/types';

interface ManagementPageData {
  products: ProductInventory[];
  categories: Category[];
  subCategories: SubCategory[];
  childSubCategories: ChildSubCategory[];
}

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
const getProductStockStatus = (product: ProductInventory): StockStatus => {
  if (product.Quantity === 0) return 'out_of_stock';
  if (product.Quantity <= product.Reorder_Point) return 'low_stock';
  return 'in_stock';
};

export function useProductManagement() {
  const { showAlert } = useAlert();
  const [data, setData] = useState<ManagementPageData>({ products: [], categories: [], subCategories: [], childSubCategories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    brandFilter: 'all',
    categoryFilter: 'all',
    subCategoryFilter: 'all',
    childCategoryFilter: 'all',
    visibilityFilter: 'all',
    stockStatusFilter: 'all',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, navRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/main/navigation')
      ]);
      if (!productsRes.ok || !navRes.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
      const productsData = await productsRes.json();
      const navData = await navRes.json();
      setData({
        products: productsData.products || [],
        categories: navData.categories || [],
        subCategories: navData.subCategories || [],
        childSubCategories: navData.childSubCategories || [],
      });
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allCategoriesMap = useMemo(() => {
    const map = new Map<number, FullCategoryPath>();
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
    return map;
  }, [data]);

  const filteredProducts = useMemo(() => {
    return data.products.filter(product => {
        if (filters.searchTerm && !(product.Name.toLowerCase().includes(filters.searchTerm.toLowerCase()) || product.Product_ID.toString().includes(filters.searchTerm) || product.Brand?.toLowerCase().includes(filters.searchTerm.toLowerCase()))) return false;
        if (filters.brandFilter !== 'all' && product.Brand !== filters.brandFilter) return false;
        if (filters.visibilityFilter !== 'all' && product.Visibility !== (filters.visibilityFilter === 'true')) return false;
        if (filters.stockStatusFilter !== 'all' && getProductStockStatus(product) !== filters.stockStatusFilter) return false;
        
        const catPath = product.Child_ID ? allCategoriesMap.get(product.Child_ID) : null;
        if (filters.categoryFilter !== 'all' && catPath?.Category_ID !== Number(filters.categoryFilter)) return false;
        if (filters.subCategoryFilter !== 'all' && catPath?.Sub_Category_ID !== Number(filters.subCategoryFilter)) return false;
        if (filters.childCategoryFilter !== 'all' && catPath?.Child_ID !== Number(filters.childCategoryFilter)) return false;

        return true;
    });
  }, [data.products, filters, allCategoriesMap]);
  
  const saveProduct = useCallback(async (productData: Partial<ProductInventory>) => {
    const isEditing = !!productData.Product_ID;
    const method = isEditing ? 'PATCH' : 'POST';
    // delete productData[''] 
    try {
      const response = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showAlert(result.message, 'success');
      await fetchData();
      return true;
    } catch (err: any) {
      showAlert(err.message, 'error');
      return false;
    }
  }, [fetchData, showAlert]);

  const deleteProduct = useCallback(async (productId: number) => {
    showAlert('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?', 'warning', 'ยืนยันการลบ', async () => {
        try {
            const response = await fetch(`/api/admin/products?id=${productId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showAlert(result.message, 'success');
            await fetchData();
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [fetchData, showAlert]);

  return {
    loading, error, data, filteredProducts, allCategoriesMap,
    filters, setFilters,
    actions: { saveProduct, deleteProduct, getProductStockStatus }
  };
}