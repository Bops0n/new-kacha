'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'; // << Import Link
import { FiBox } from 'react-icons/fi';
import { useProductsPage } from '@/app/hooks/useProductsPage';
import ProductDisplayCard from '../components/ProductDisplayCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/formatters';
import { ProductsPageData } from '@/types';

// Component for the category sidebar
const CategorySidebar = ({ pageData } : { pageData: ProductsPageData }) => {
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId');
  const activeSubCategoryId = searchParams.get('subCategoryId');
  const activeChildCategoryId = searchParams.get('childCategoryId');

  return (
    <aside className="w-full lg:w-72 bg-base-100 rounded-lg shadow-md p-6 sticky top-4 self-start">
      <h2 className="text-2xl font-bold mb-6 text-base-content ">หมวดหมู่สินค้า</h2>
      <ul className="menu bg-base-100 p-0 w-full">
        <li>
            <Link href="/products" className={!activeCategoryId ? 'active' : ''}>สินค้าทั้งหมด</Link>
        </li>
        {pageData.categories.map(category => (
          <li key={category.Category_ID}>
            <details open={activeCategoryId == category.Category_ID.toString()}>
              <summary className="font-semibold">
                {/* 1. เพิ่ม Link ให้กับ Category หลัก */}
                <Link 
                  href={`/products?categoryId=${category.Category_ID}`}
                  onClick={(e) => e.stopPropagation()} // ป้องกัน details ปิดเมื่อคลิก
                  className="flex-1"
                >
                  {category.Name}
                </Link>
              </summary>
              <ul>
                {pageData.subCategories.filter(sub => sub.Category_ID === category.Category_ID).map(subCategory => (
                  <li key={subCategory.Sub_Category_ID}>
                    <details open={activeSubCategoryId == subCategory.Sub_Category_ID.toString()}>
                      <summary>
                        {/* 2. เพิ่ม Link ให้กับ Subcategory */}
                        <Link 
                          href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`}
                          onClick={(e) => e.stopPropagation()} // ป้องกัน details ปิดเมื่อคลิก
                          className="flex-1"
                        >
                          {subCategory.Name}
                        </Link>
                      </summary>
                      <ul>
                        {pageData.childSubCategories.filter(child => child.Sub_Category_ID === subCategory.Sub_Category_ID).map(childCategory => (
                          <li key={childCategory.Child_ID}>
                            <Link 
                              href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`}
                              className={activeChildCategoryId == childCategory.Child_ID.toString() ? 'active' : ''}
                            >
                              {childCategory.Name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </aside>
  );
};


export default function ProductsPage() {
  const { loading, error, pageData, filteredProducts } = useProductsPage();
  const searchParams = useSearchParams();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20 text-error"><h2 className="text-2xl font-bold">เกิดข้อผิดพลาด</h2><p>{error}</p></div>;
  if (!pageData) return null;

  // Function to determine the page title based on filters
  const getPageTitle = () => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) return `ผลการค้นหาสำหรับ "${searchTerm}"`;

    const discount = searchParams.get('discount');
    if (discount) return `สินค้าลดราคา`;

    const childId = searchParams.get('childCategoryId');
    if (childId) return pageData.childSubCategories.find(c => c.Child_ID == Number(childId))?.Name || 'สินค้า';
    
    const subId = searchParams.get('subCategoryId');
    if (subId) return pageData.subCategories.find(s => s.Sub_Category_ID == Number(subId))?.Name || 'สินค้า';

    const catId = searchParams.get('categoryId');
    if (catId) return pageData.categories.find(c => c.Category_ID == Number(catId))?.Name || 'สินค้า';
    
    return 'สินค้าทั้งหมด';
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        <CategorySidebar pageData={pageData} />
        
        <main className="flex-1">
          <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-base-content mb-2">{getPageTitle()}</h1>
            <p className="text-base-content/70">พบ {filteredProducts.length} รายการ</p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductDisplayCard
                  key={product.Product_ID}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-base-100 rounded-lg shadow-md">
              <FiBox className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70 text-lg">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}