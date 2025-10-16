'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductInventory, FullCategoryPath } from '../../types';

export function useProductDetail(productId: string) {
  const [product, setProduct] = useState<ProductInventory | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductInventory[]>([]);
  const [categoryPath, setCategoryPath] = useState<FullCategoryPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/main/products/${productId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
      }
      const data = await response.json();
      setProduct(data.Product);
      setRelatedProducts(data.Related_Products || []);
      setCategoryPath(data.Category_Path || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  return { product, relatedProducts, categoryPath, loading, error };
}