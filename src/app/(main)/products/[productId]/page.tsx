'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiMinus, FiShoppingCart, FiPhone } from 'react-icons/fi';
import { FaLine } from 'react-icons/fa';
import { useParams } from 'next/navigation';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useAddToCart } from '@/app//hooks/useAddToCart';
import { useProductDetail } from '@/app/hooks/useProductDetail';
import { FullCategoryPath } from '@/types';

// Component สำหรับ Breadcrumbs (คงไว้เหมือนเดิม)
const Breadcrumbs = ({ path }: { path: FullCategoryPath | null }) => {
    if (!path) return <div className="h-6 mb-6"></div>;
    return (
        <div className="text-sm breadcrumbs mb-6">
            <ul>
                <li><Link href="/">หน้าแรก</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}`}>{path.Category_Name}</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}&subCategoryId=${path.Sub_Category_ID}`}>{path.Sub_Category_Name}</Link></li>
                <li><Link href={`/products?categoryId=${path.Category_ID}&subCategoryId=${path.Sub_Category_ID}&childCategoryId=${path.Child_ID}`}>{path.Child_Name}</Link></li>
            </ul>
        </div>
    );
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  
  const { product, relatedProducts, categoryPath, loading, error } = useProductDetail(productId);
  const { addToCart, isAdding } = useAddToCart();

  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    setQuantity(prevQty => {
      if (!product) return prevQty;
      if (type === 'increase') return Math.min(prevQty + 1, product.Quantity);
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
  if (!product) return <div className="text-center py-20">ไม่พบสินค้า</div>;

  const hasDiscount = product.Sale_Price < product.Sale_Cost;
  const discountPercentage = hasDiscount ? ((1 - product.Sale_Price / product.Sale_Cost) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs path={categoryPath} />

        <div className="bg-base-100 rounded-lg shadow-xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- 1. ส่วนรูปภาพสินค้า --- */}
            <div className="lg:w-1/2 flex justify-center items-center p-4 relative">
              <img
                src={product.Image_URL || 'https://placehold.co/600x400?text=No+Image'}
                alt={product.Name}
                className="rounded-lg max-w-full h-auto"
              />
              {hasDiscount && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                  ลด {discountPercentage}%
                </div>
              )}
            </div>

            {/* --- 2. ส่วนข้อมูลสินค้า (ปรับปรุงให้ตรงตามรูปภาพ) --- */}
            <div className="lg:w-1/2 flex flex-col space-y-4">
              <h1 className="text-3xl font-bold text-base-content leading-tight">{product.Name}</h1>
              
              <div>
                {hasDiscount && <p className="text-xl text-base-content/60 line-through">{formatPrice(product.Sale_Cost)}</p>}
                <p className="text-4xl font-bold text-primary">{formatPrice(product.Sale_Price)}</p>
              </div>

              <div className="text-base-content/90 text-sm space-y-2 border-t border-base-300 pt-4">
                <p><strong>รหัสสินค้า:</strong> {product.Product_ID}</p>
                <p><strong>สถานะ:</strong> 
                  <span className={`font-semibold ${product.Quantity > 0 ? 'text-success' : 'text-error'}`}>
                    {product.Quantity > 0 ? ` มีสินค้า (${product.Quantity} ชิ้น)` : ' สินค้าหมด'}
                  </span>
                </p>
                {product.Dimensions && <p><strong>ขนาด:</strong> {product.Dimensions}</p>}
                {product.Material && <p><strong>วัสดุ:</strong> {product.Material}</p>}
              </div>

              {product.Review_Rating !== null && (
                <div className="flex items-center">
                  <div className="rating rating-sm items-center">
                    {[...Array(5)].map((_, i) => (
                      <input key={i} type="radio" name="rating-2" className="mask mask-star-2 bg-orange-400" readOnly checked={i < Math.round(product.Review_Rating!)} />
                    ))}
                  </div>
                  <span className="ml-2 text-base-content/70 text-sm">({product.Review_Rating} รีวิว)</span>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <span className="font-semibold text-base-content">จำนวน:</span>
                <div className="flex border border-base-300 rounded-md overflow-hidden">
                  <button onClick={() => handleQuantityChange('decrease')} disabled={quantity <= 1} className="btn btn-sm btn-ghost">-</button>
                  <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="input input-sm input-bordered w-16 text-center focus:outline-none"
                  />
                  <button onClick={() => handleQuantityChange('increase')} disabled={quantity >= product.Quantity} className="btn btn-sm btn-ghost">+</button>
                </div>
              </div>
           
              <button onClick={handleAddToCartClick} disabled={product.Quantity === 0 || isAdding} className="btn btn-primary btn-lg w-full">
                {isAdding ? <span className="loading loading-spinner"></span> : <FiShoppingCart className="w-6 h-6 mr-2" />}
                {isAdding ? 'กำลังเพิ่ม...' : 'เพิ่มลงรถเข็น'}
              </button>

              <div className="border-t border-base-300 pt-4 mt-4 space-y-3">
                <h3 className="font-semibold">สอบถามข้อมูลเพิ่มเติม</h3>
                <div className="flex items-center gap-3">
                  <FaLine className="w-6 h-6 text-green-500" />
                  <span>LINE: kacha982</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="w-6 h-6 text-blue-500" />
                  <span>โทร: 081-896-2687</span>
                </div>
              </div>
            </div>
          </div>

          {/* === 3. ส่วนรายละเอียดสินค้าและสินค้าที่เกี่ยวข้อง (จากโครงสร้างเดิม) === */}
          <div className="mt-12 p-6 bg-base-200 rounded-lg">
            <h2 className="text-2xl font-bold text-base-content mb-4">รายละเอียดสินค้า</h2>
            <p className="text-base-content/90 leading-relaxed">{product.Description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับสินค้านี้'}</p>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-base-content mb-6 text-center">สินค้าที่เกี่ยวข้อง</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(related => (
                  <Link key={related.Product_ID} href={`/products/${related.Product_ID}`} className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow">
                    <figure><img src={related.Image_URL || 'https://placehold.co/400x300?text=No+Image'} alt={related.Name} className="h-40 w-full object-cover" /></figure>
                    <div className="card-body p-4">
                      <h3 className="card-title text-base line-clamp-2 h-12">{related.Name}</h3>
                      <p className="text-lg font-semibold text-primary">{formatPrice(related.Sale_Price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}