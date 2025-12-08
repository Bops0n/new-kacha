'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiMinus, FiShoppingCart, FiPhone, FiX, FiZoomIn } from 'react-icons/fi';
import { FaLine } from 'react-icons/fa';
import { useParams } from 'next/navigation';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useAddToCart } from '@/app//hooks/useAddToCart';
import { useProductDetail } from '@/app/hooks/useProductDetail';
import { FullCategoryPath } from '@/types';
import { calculateAvailableStock } from '@/app/utils/calculations';
import ProductDisplayCard from '../../components/ProductDisplayCard';
import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';
import { useWebsiteSettings } from '@/app/providers/WebsiteSettingProvider';

// --- Component: Breadcrumbs ---
const Breadcrumbs = ({ path }: { path: FullCategoryPath | null }) => {
    if (!path) return <div className="h-6 mb-6"></div>;
    return (
        <div className="text-sm breadcrumbs mb-6 text-base-content/70">
            <ul>
                <li><Link href="/" className="hover:text-primary">หน้าแรก</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}`} className="hover:text-primary">{path.Category_Name}</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}&subCategoryId=${path.Sub_Category_ID}`} className="hover:text-primary">{path.Sub_Category_Name}</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}&subCategoryId=${path.Sub_Category_ID}&childCategoryId=${path.Child_ID}`} className="font-semibold text-primary">{path.Child_Name}</Link></li>
            </ul>
        </div>
    );
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const settings = useWebsiteSettings();
  
  const { product, relatedProducts, categoryPath, loading, error } = useProductDetail(productId);
  const { addToCart, isAdding } = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  // State สำหรับ Modal ดูรูป
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    setQuantity(prevQty => {
      if (!product) return prevQty;
      if (type === 'increase') return Math.min(prevQty + 1, calculateAvailableStock(product));
      return Math.max(prevQty - 1, 1);
    });
  };

  const handleAddToCartClick = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-20 text-error"><h2 className="text-2xl font-bold">เกิดข้อผิดพลาด</h2><p>{error}</p></div>;
  if (!product) return <div className="text-center py-20 text-base-content/60">ไม่พบสินค้า</div>;

  const hasDiscount = product.Discount_Price !== null && product.Discount_Price < product.Sale_Price;
  const displayPrice = hasDiscount ? product.Discount_Price : product.Sale_Price;

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8 font-sarabun">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs path={categoryPath} />

        <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* --- 1. ส่วนรูปภาพสินค้า (ซ้าย) --- */}
            <div className="lg:w-1/2 p-6 lg:p-10 bg-base-200/30 flex items-center justify-center">
               <div 
                  className="relative group w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-base-200 shadow-sm bg-white cursor-zoom-in"
                  onClick={() => setPreviewImage(product.Image_URL || 'https://placehold.co/600x400?text=No+Image')}
               >
                  <img
                    src={product.Image_URL || 'https://placehold.co/600x400?text=No+Image'}
                    alt={product.Name}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                      </span>
                  </div>

                  {hasDiscount && (
                    <div className="badge badge-error badge-lg absolute top-4 right-4 text-white font-bold shadow-md z-10">
                      ลดราคา
                    </div>
                  )}
               </div>
            </div>

            {/* --- 2. ส่วนข้อมูลสินค้า (ขวา) --- */}
            <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-base-content leading-snug mb-2">{product.Name}</h1>
                <p className="text-base-content/60 text-sm">รหัสสินค้า: <span className="font-mono">{product.Product_ID}</span></p>
              </div>
              
              <div className="mb-6">
                {hasDiscount && <p className="text-xl text-base-content/40 line-through">{formatPrice(product.Sale_Price)}</p>}
                <p className="text-4xl font-bold text-primary tracking-tight">{formatPrice(displayPrice)}</p>
              </div>

              <div className="bg-base-200/50 rounded-xl p-4 mb-6 text-sm text-base-content/80 space-y-2 border border-base-200">
                <p className="flex justify-between">
                    <span>สถานะสต็อก:</span> 
                    <span className={`font-bold ${calculateAvailableStock(product) > 0 ? 'text-success' : 'text-error'}`}>
                        {calculateAvailableStock(product) > 0 ? `มีสินค้า (${calculateAvailableStock(product)} ${product.Unit})` : 'สินค้าหมด'}
                    </span>
                </p>
                {product.Dimensions && <p className="flex justify-between"><span>ขนาด:</span> <span className="font-medium">{product.Dimensions}</span></p>}
                {product.Material && <p className="flex justify-between"><span>วัสดุ:</span> <span className="font-medium">{product.Material}</span></p>}
                {product.Brand && <p className="flex justify-between"><span>แบรนด์:</span> <span className="font-medium">{product.Brand}</span></p>}
              </div>

              <div className="flex items-end gap-4 mb-8">
                <div className="form-control w-full max-w-[140px]">
                    <label className="label"><span className="label-text font-semibold">จำนวน</span></label>
                    <div className="flex items-center border border-base-300 rounded-lg overflow-hidden bg-base-100">
                        <button onClick={() => handleQuantityChange('decrease')} disabled={quantity <= 1} className="btn btn-ghost btn-sm px-3 rounded-none h-10"><FiMinus /></button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, calculateAvailableStock(product))))}
                            className="input input-sm input-ghost w-full text-center focus:outline-none h-10 font-bold text-lg"
                        />
                        <button onClick={() => handleQuantityChange('increase')} disabled={quantity >= calculateAvailableStock(product)} className="btn btn-ghost btn-sm px-3 rounded-none h-10"><FiPlus /></button>
                    </div>
                </div>
                <button 
                    onClick={handleAddToCartClick} 
                    disabled={calculateAvailableStock(product) === 0 || isAdding} 
                    className="btn btn-primary btn-lg flex-1 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all h-[3.25rem]"
                >
                    {isAdding ? <span className="loading loading-spinner"></span> : <FiShoppingCart className="w-6 h-6 mr-2" />}
                    {isAdding ? 'กำลังเพิ่ม...' : 'เพิ่มลงรถเข็น'}
                </button>
              </div>

              <div className="divider"></div>

              <div className="space-y-3 text-sm">
                <h3 className="font-semibold text-base-content/80">สอบถามข้อมูลเพิ่มเติม</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <a href={settings.lineURL} target="_blank" rel="noreferrer" className="btn btn-outline btn-success btn-sm gap-2">
                        <FaLine className="w-5 h-5" /> LINE: {settings.lineOfficialName}
                    </a>
                    <p className="btn btn-outline btn-info btn-sm gap-2">
                        <FiPhone className="w-4 h-4" /> โทร: {settings.contactPhone}
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* === 3. ส่วนรายละเอียดสินค้า === */}
          <div className="p-8 lg:p-10 border-t border-base-200 bg-base-50/50">
            <h2 className="text-2xl font-bold text-base-content mb-6 border-l-4 border-primary pl-4">รายละเอียดสินค้า</h2>
            <div className="prose max-w-none text-base-content/80 leading-relaxed whitespace-pre-wrap">
                {product.Description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับสินค้านี้'}
            </div>
          </div>

          {/* === 4. สินค้าที่เกี่ยวข้อง === */}
          {relatedProducts.length > 0 && (
            <div className="p-8 lg:p-10 border-t border-base-200">
              <h2 className="text-2xl font-bold text-base-content mb-8 text-center">สินค้าที่เกี่ยวข้อง</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(related => {
                  const relatedHasDiscount = related.Discount_Price !== null && related.Discount_Price < related.Sale_Price;
                  const relatedDisplayPrice = relatedHasDiscount ? related.Discount_Price : related.Sale_Price;
                  return (
                    <ProductDisplayCard product={related} key={related.Product_ID} ></ProductDisplayCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}