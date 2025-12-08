'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiBox, FiFilter, FiX, FiChevronRight } from 'react-icons/fi';
import { useProductsPage } from '@/app/hooks/useProductsPage';
import ProductDisplayCard from '../components/ProductDisplayCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/formatters';
import { ProductsPageData } from '@/types';

// --- 1. Component แสดงโครงสร้างหมวดหมู่ (Recursive/Accordion) ---
const CategoryMenuTree = ({ pageData, closeMenu }: { pageData: ProductsPageData, closeMenu?: () => void }) => {
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('categoryId');
  const activeSubCategoryId = searchParams.get('subCategoryId');
  const activeChildCategoryId = searchParams.get('childCategoryId');

  const isActive = (type: 'main' | 'sub' | 'child', id: number) => {
    if (type === 'main') return activeCategoryId == id.toString();
    if (type === 'sub') return activeSubCategoryId == id.toString();
    if (type === 'child') return activeChildCategoryId == id.toString();
    return false;
  };

  return (
    <ul className="menu bg-base-100 w-full p-0 text-base-content text-sm">
      {/* ลิงก์ดูทั้งหมด */}
      <li className="mb-2">
        <Link 
          href="/products" 
          onClick={closeMenu}
          className={`font-bold ${!activeCategoryId && !searchParams.get('search') ? 'active text-white' : 'hover:bg-base-200'}`}
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
                <summary className={`group font-semibold ${isMainActive ? 'text-primary' : ''}`}>
                  {category.Name}
                </summary>
                <ul>
                  {/* ลิงก์รวมหมวดหลัก */}
                  <li>
                     <Link 
                        href={`/products?categoryId=${category.Category_ID}`}
                        onClick={closeMenu}
                        className={`border-l-4 ${isMainActive && !activeSubCategoryId ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-transparent'}`}
                     >
                        รวม {category.Name}
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
                            <summary className={`${isSubActive ? 'text-primary' : ''}`}>
                              {subCategory.Name}
                            </summary>
                            <ul>
                               {/* ลิงก์รวมหมวดรอง */}
                               <li>
                                  <Link 
                                      href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`}
                                      onClick={closeMenu}
                                      className={`${isSubActive && !activeChildCategoryId ? 'text-primary font-bold underline decoration-primary' : ''}`}
                                  >
                                      รวม {subCategory.Name}
                                  </Link>
                               </li>
                              {/* Loop หมวดหมู่ย่อย */}
                              {childCats.map(childCategory => (
                                <li key={childCategory.Child_ID}>
                                  <Link
                                    href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`}
                                    onClick={closeMenu}
                                    className={`${isActive('child', childCategory.Child_ID) ? 'active font-bold' : ''}`}
                                  >
                                    {childCategory.Name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <Link 
                            href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`}
                            onClick={closeMenu}
                            className={`${isSubActive ? 'active' : ''}`}
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
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold mb-4 px-2 flex items-center gap-2 text-base-content/80 border-b pb-2">
            <FiFilter className="text-primary"/> หมวดหมู่สินค้า
        </h2>
        <CategoryMenuTree pageData={pageData} />
      </div>
    </aside>
  );
};

// --- 3. Mobile Filter Drawer ---
const MobileFilter = ({ pageData } : { pageData: ProductsPageData }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="lg:hidden mb-4">
            <button 
                className="btn btn-outline w-full flex justify-between items-center bg-base-100 shadow-sm"
                onClick={() => setIsOpen(true)}
            >
                <span className="flex items-center gap-2"><FiFilter /> กรองสินค้า / หมวดหมู่</span>
                <FiChevronRight />
            </button>

            {/* Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex animate-fadeIn">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
                    <div className="relative w-4/5 max-w-xs bg-base-100 h-full shadow-2xl flex flex-col animate-slideInLeft">
                        <div className="p-4 border-b flex justify-between items-center bg-base-200">
                            <h2 className="font-bold text-lg flex items-center gap-2"><FiFilter/> หมวดหมู่</h2>
                            <button onClick={() => setIsOpen(false)} className="btn btn-sm btn-circle btn-ghost">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <CategoryMenuTree pageData={pageData} closeMenu={() => setIsOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Page Component ---
export default function ProductsPage() {
  // เรียกใช้ Hook ที่รองรับ Infinite Scroll
  const { loading, error, pageData, filteredProducts, loadMore, hasMore } = useProductsPage();
  const searchParams = useSearchParams();

  // Ref สำหรับตรวจจับเมื่อเลื่อนลงล่างสุด
  const loaderRef = useRef(null);

  // Intersection Observer สำหรับ Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && filteredProducts.length < pageData?.total) {
        // console.log(hasMore)
        
        loadMore();
      }
    }, {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    }
  }, [loadMore, hasMore]);

  // Helper หาชื่อหน้า
  const getPageTitle = () => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) return `ผลการค้นหาสำหรับ "${searchTerm}"`;

    const discount = searchParams.get('discount');
    if (discount) return `สินค้าลดราคา`;

    if (!pageData) return 'สินค้าทั้งหมด';

    const childId = searchParams.get('childCategoryId');
    if (childId) return pageData.childSubCategories.find(c => c.Child_ID == Number(childId))?.Name || 'สินค้า';
    
    const subId = searchParams.get('subCategoryId');
    if (subId) return pageData.subCategories.find(s => s.Sub_Category_ID == Number(subId))?.Name || 'สินค้า';

    const catId = searchParams.get('categoryId');
    if (catId) return pageData.categories.find(c => c.Category_ID == Number(catId))?.Name || 'สินค้า';
    
    return 'สินค้าทั้งหมด';
  };

  if (error) return (
    <div className="min-h-[50vh] flex items-center justify-center text-error text-center p-8">
        <div>
            <h2 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm mt-4">ลองใหม่อีกครั้ง</button>
        </div>
    </div>
  );

  // ข้อมูล Placeholder สำหรับ Sidebar ก่อนโหลดเสร็จ
  const emptyPageData: ProductsPageData = { categories: [], subCategories: [], childSubCategories: [], products: [] };

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8 font-sarabun">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar (Desktop) */}
        <CategorySidebar pageData={pageData || emptyPageData} />
        
        <main className="flex-1 min-w-0">
          
          {/* Mobile Filter */}
          <MobileFilter pageData={pageData || emptyPageData} />

          {/* Page Title & Count */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-1">{getPageTitle()}</h1>
                <p className="text-base-content/60 text-sm">
                    {loading && filteredProducts.length === 0 ? 'กำลังโหลดข้อมูล...' : `แสดง ${filteredProducts.length} รายการ จากทั้งหมด ${pageData?.total || 0} รายการ`}
                </p>
            </div>
            {/* (Optional) ใส่ Dropdown เรียงลำดับราคาตรงนี้ได้ในอนาคต */}
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductDisplayCard
                  key={product.Product_ID}
                  product={product}
                  // formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            !loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-2xl shadow-sm border border-base-200 text-center">
                    <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
                        <FiBox className="w-10 h-10 text-base-content/30" />
                    </div>
                    <h3 className="text-xl font-bold text-base-content mb-2">ไม่พบสินค้า</h3>
                    <p className="text-base-content/60">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาใหม่อีกครั้ง</p>
                    <Link href="/products" className="btn btn-primary mt-6">ดูสินค้าทั้งหมด</Link>
                </div>
            )
          )}

          {/* Loading Indicator & Infinite Scroll Trigger */}
          <div ref={loaderRef} className="py-8 flex justify-center w-full min-h-[60px]">
             {loading && <LoadingSpinner />}
             {!loading && !hasMore && filteredProducts.length > 0 && (
                <p className="text-base-content/40 text-xs mt-4">-- แสดงสินค้าครบทั้งหมดแล้ว --</p>
             )}
          </div>

        </main>
      </div>
    </div>
  );
}