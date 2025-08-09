'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCategoryData } from '@/app/hooks/useCategoryData'; // << 1. Import hook ใหม่
import { ProductFormData, ProductInventory, StockStatus } from '@/types';

const getProductStockStatus = (product: ProductFormData | null): StockStatus => {
  if (!product || product.Quantity === undefined || product.Reorder_Point === undefined) return 'out_of_stock';
  if (product.Quantity === 0) return 'out_of_stock'; // Ensure Quantity is not undefined
  if (product.Quantity <= product.Reorder_Point) return 'low_stock'; // Ensure Reorder_Point is not undefined
  return 'in_stock';
};

export function useProductManagement() {
  const { showAlert } = useAlert();
  const { categories, subCategories, childSubCategories, allCategoriesMap, loading: categoriesLoading, error: categoriesError } = useCategoryData(); // << 2. เรียกใช้ hook ใหม่

  const [products, setProducts] = useState<ProductInventory[]>([]);
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // << 3. ลบการ fetch '/api/main/navigation' ออกไป
      const productsRes = await fetch('/api/admin/products');
      if (!productsRes.ok) throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);
    } catch (err: any) {
      setError(err.message);
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
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
  }, [products, filters, allCategoriesMap]);
  
  const saveProduct = useCallback(async (productData: ProductFormData) => {
    const isEditing = !!productData.Product_ID;
    const method = isEditing ? 'PATCH' : 'POST';
    delete productData['Selected_Category_ID'];
    delete productData['Selected_Sub_Category_ID'];
    try {
      const response = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      showAlert(result.message, 'success');
      await fetchProducts(); // << 4. เรียก fetchProducts() แทน fetchData()
      return true;
    } catch (err: any) {
      showAlert(err.message, 'error');
      return false;
    }
  }, [fetchProducts, showAlert]);

  const deleteProduct = useCallback(async (productId: number) => {
    showAlert('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?', 'warning', 'ยืนยันการลบ', async () => {
        try {
            const response = await fetch(`/api/admin/products?id=${productId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showAlert(result.message, 'success');
            await fetchProducts(); // << 5. เรียก fetchProducts() แทน fetchData()
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    });
  }, [fetchProducts, showAlert]);

  return {
    loading: loading || categoriesLoading, // << 6. รวมสถานะ loading
    error: error || categoriesError,
    data: { products, categories, subCategories, childSubCategories }, // << 7. ส่งข้อมูลทั้งหมดกลับไป
    filteredProducts,
    allCategoriesMap,
    filters,
    setFilters,
    actions: { saveProduct, deleteProduct, getProductStockStatus }
  };
}