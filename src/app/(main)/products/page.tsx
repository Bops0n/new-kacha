'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiBox, FiChevronDown, FiChevronRight, FiFilter, FiX } from 'react-icons/fi'; // เพิ่ม Icon
import { useProductsPage } from '@/app/hooks/useProductsPage';
import ProductDisplayCard from '../components/ProductDisplayCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/formatters';
import { ProductsPageData, Category, SubCategory, ChildSubCategory } from '@/types';

// --- 1. สร้าง Component สำหรับแสดงรายการหมวดหมู่ (ใช้ซ้ำได้ทั้ง Desktop และ Mobile) ---
const CategoryMenuTree = ({ pageData, closeMenu }: { pageData: ProductsPageData, closeMenu?: () => void }) => {
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId');
  const activeSubCategoryId = searchParams.get('subCategoryId');
  const activeChildCategoryId = searchParams.get('childCategoryId');

  // Helper เช็คว่า Active หรือไม่
  const isActive = (type: 'main' | 'sub' | 'child', id: number) => {
    if (type === 'main') return activeCategoryId == id.toString();
    if (type === 'sub') return activeSubCategoryId == id.toString();
    if (type === 'child') return activeChildCategoryId == id.toString();
    return false;
  };

  return (
    <ul className="menu bg-base-100 w-full p-0 text-base-content">
      {/* ลิงก์ดูทั้งหมด */}
      <li className="mb-2">
        <Link 
          href="/products" 
          onClick={closeMenu}
          className={`font-semibold ${!activeCategoryId ? 'active text-black' : 'hover:bg-base-200'}`}
        >
          <FiBox className="w-4 h-4" /> สินค้าทั้งหมด
        </Link>
      </li>

      {/* Loop หมวดหมู่หลัก */}
      {pageData.categories.map(category => {
        const isMainActive = isActive('main', category.Category_ID);
        const subCats = pageData.subCategories.filter(sub => sub.Category_ID === category.Category_ID);

        return (
          <li key={category.Category_ID} className="mb-1">
            {subCats.length > 0 ? (
              <details open={isMainActive}>
                <summary className={`group font-medium ${isMainActive ? 'text-primary' : ''}`}>
                  {category.Name}
                </summary>
                <ul>
                  {/* ลิงก์ "ดูทั้งหมดในหมวดหลัก" */}
                  <li>
                     <Link 
                        href={`/products?categoryId=${category.Category_ID}`}
                        onClick={closeMenu}
                        className={`text-sm ${isMainActive && !activeSubCategoryId ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                     >
                        ทั้งหมดใน {category.Name}
                     </Link>
                  </li>
                  
                  {/* Loop หมวดหมู่รอง */}
                  {subCats.map(subCategory => {
                    const isSubActive = isActive('sub', subCategory.Sub_Category_ID);
                    const childCats = pageData.childSubCategories.filter(child => child.Sub_Category_ID === subCategory.Sub_Category_ID);

                    return (
                      <li key={subCategory.Sub_Category_ID}>
                        {childCats.length > 0 ? (
                          <details open={isSubActive}>
                            <summary className={`text-sm ${isSubActive ? 'text-primary' : ''}`}>
                              {subCategory.Name}
                            </summary>
                            <ul>
                               {/* ลิงก์ "ดูทั้งหมดในหมวดรอง" */}
                               <li>
                                  <Link 
                                      href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`}
                                      onClick={closeMenu}
                                      className={`text-xs ${isSubActive && !activeChildCategoryId ? 'font-bold underline decoration-primary' : ''}`}
                                  >
                                      รวม {subCategory.Name}
                                  </Link>
                               </li>
                              {/* Loop หมวดหมู่ย่อย (Child) */}
                              {childCats.map(childCategory => (
                                <li key={childCategory.Child_ID}>
                                  <Link
                                    href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`}
                                    onClick={closeMenu}
                                    className={`text-xs ${isActive('child', childCategory.Child_ID) ? 'active' : ''}`}
                                  >
                                    {childCategory.Name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          // ถ้าไม่มีลูกย่อย ให้เป็นลิงก์เลย
                          <Link 
                            href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`}
                            onClick={closeMenu}
                            className={`text-sm ${isSubActive ? 'active' : ''}`}
                          >
                            {subCategory.Name}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : (
               // ถ้าไม่มีหมวดรองเลย
               <Link 
                href={`/products?categoryId=${category.Category_ID}`}
                onClick={closeMenu}
                className={isMainActive ? 'active' : ''}
               >
                 {category.Name}
               </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// --- 2. Sidebar สำหรับ Desktop ---
const CategorySidebar = ({ pageData } : { pageData: ProductsPageData }) => {
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-4 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4 px-2 flex items-center gap-2">
            <FiFilter className="text-primary"/> หมวดหมู่สินค้า
        </h2>
        <CategoryMenuTree pageData={pageData} />
      </div>
    </aside>
  );
};

// --- 3. Mobile Filter Drawer (สำหรับมือถือ) ---
const MobileFilter = ({ pageData } : { pageData: ProductsPageData }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden mb-4">
            <button 
                className="btn btn-outline w-full flex justify-between items-center bg-base-100"
                onClick={() => setIsOpen(true)}
            >
                <span className="flex items-center gap-2"><FiFilter /> กรองสินค้า / หมวดหมู่</span>
                <FiChevronRight />
            </button>

            {/* Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
                    
                    {/* Drawer Content */}
                    <div className="relative w-4/5 max-w-xs bg-base-100 h-full shadow-xl flex flex-col animate-slideInLeft">
                        <div className="p-4 border-b flex justify-between items-center bg-base-200">
                            <h2 className="font-bold text-lg">หมวดหมู่สินค้า</h2>
                            <button onClick={() => setIsOpen(false)} className="btn btn-sm btn-circle btn-ghost">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <CategoryMenuTree pageData={pageData} closeMenu={() => setIsOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Page ---
export default function ProductsPage() {
  const { loading, error, pageData, filteredProducts } = useProductsPage();
  const searchParams = useSearchParams();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20 text-error"><h2 className="text-2xl font-bold">เกิดข้อผิดพลาด</h2><p>{error}</p></div>;
  if (!pageData) return null;

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
    <div className="min-h-screen bg-base-200 p-4 lg:p-8 font-sarabun">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar (Desktop) */}
        <CategorySidebar pageData={pageData} />
        
        <main className="flex-1 min-w-0"> {/* min-w-0 helps with flex shrinking */}
          
          {/* Mobile Filter Button */}
          <MobileFilter pageData={pageData} />

          {/* Page Title & Count */}
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-2">{getPageTitle()}</h1>
            <p className="text-base-content/70 text-sm">พบสินค้าทั้งหมด {filteredProducts.length} รายการ</p>
          </div>

          {/* Product Grid */}
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
            <div className="flex flex-col items-center justify-center py-16 bg-base-100 rounded-xl shadow-sm border border-base-200 text-center">
              <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                  <FiBox className="w-10 h-10 text-base-content/30" />
              </div>
              <h3 className="text-xl font-bold text-base-content mb-2">ไม่พบสินค้า</h3>
              <p className="text-base-content/60">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาใหม่อีกครั้ง</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}