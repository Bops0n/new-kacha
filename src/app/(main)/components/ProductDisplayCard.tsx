'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiPlus, FiMinus, FiX, FiZoomIn, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { ProductInventory } from '@/types';
import { calculateAvailableStock } from '@/app/utils/calculations';
import { formatPrice } from '@/app/utils/formatters';
import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';

interface ProductDisplayCardProps {
  product: ProductInventory;
}

// --- Component เสริม: สำหรับแสดงรูปขนาดเต็ม (Zoom) ---
const FullImageModal = ({ src, alt, onClose }: { src: string, alt: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="relative w-full max-w-5xl h-full max-h-screen flex items-center justify-center">
            <button className="absolute top-4 right-4 btn btn-circle btn-ghost text-white bg-black/50 hover:bg-red-500 border-none z-50">
                <FiX className="w-6 h-6" />
            </button>
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
                 <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                 />
            </div>
        </div>
    </div>
  );
};

// --- Modal หลัก: เลือกจำนวนสินค้า ---
const AddToCartQuantityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: ProductInventory;
  onAddToCart: (product: ProductInventory, quantity: number) => void;
}> = ({ isOpen, onClose, product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // คำนวณราคาปัจจุบัน (เช็คส่วนลด)
  const currentPrice = useMemo(() => {
    return (product.Discount_Price !== null && product.Discount_Price < product.Sale_Price)
        ? product.Discount_Price
        : product.Sale_Price;
  }, [product]);

  // คำนวณสต็อก
  const availableStock = useMemo(() => calculateAvailableStock(product), [product]);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (quantity < availableStock) setQuantity(prev => prev + 1);
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleConfirmAddToCart = () => {
    if (quantity >= 1 && quantity <= availableStock) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <>
        <div className="modal modal-open flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
        <div className="modal-box w-full max-w-3xl p-0 overflow-hidden bg-base-100 rounded-2xl shadow-2xl">
            {/* Header Mobile Only */}
            <div className="flex justify-between items-center p-4 md:hidden border-b">
                <h3 className="font-bold text-lg">เพิ่มลงตะกร้า</h3>
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost"><FiX /></button>
            </div>

            <div className="flex flex-col md:flex-row h-full">
                {/* Left: Product Image */}
                <div className="w-full md:w-5/12 bg-base-200/50 p-6 flex items-center justify-center relative group">
                    <div 
                        className="relative w-full aspect-square cursor-zoom-in bg-white rounded-xl border border-base-200 p-2 shadow-sm"
                        onClick={() => setPreviewImage(product.Image_URL || 'https://placehold.co/400x400?text=No+Image')}
                    >
                        <Image
                            src={product.Image_URL || 'https://placehold.co/400x400?text=No+Image'}
                            alt={product.Name}
                            fill
                            className="object-contain rounded-lg hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-xl">
                            <span className="text-white text-xs font-medium flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/20"><FiZoomIn /> คลิกเพื่อขยาย</span>
                        </div>
                    </div>
                </div>

                {/* Right: Details & Controls */}
                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        {/* Close Button Desktop */}
                        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 hidden md:flex"><FiX className="w-5 h-5"/></button>
                        
                        <h3 className="font-bold text-2xl text-base-content mb-1 leading-tight pr-8">{product.Name}</h3>
                        <p className="text-base-content/60 text-sm mb-4">แบรนด์: {product.Brand || '-'}</p>

                        <div className="flex items-end gap-3 mb-6 border-b border-base-200 pb-4">
                            <span className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</span>
                            {product.Discount_Price !== null && product.Discount_Price < product.Sale_Price && (
                                <span className="text-sm text-base-content/40 line-through mb-1.5">{formatPrice(product.Sale_Price)}</span>
                            )}
                            <span className="text-sm text-base-content/60 mb-1.5">/ {product.Unit}</span>
                        </div>

                        {/* Stock Info */}
                        <div className="flex items-center gap-2 mb-6">
                            {availableStock > 0 ? (
                                <div className="badge badge-success badge-outline gap-1 p-3">
                                    <FiCheckCircle /> มีสินค้า {availableStock} {product.Unit}
                                </div>
                            ) : (
                                <div className="badge badge-error gap-1 p-3 text-white">
                                    <FiAlertCircle /> สินค้าหมด
                                </div>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="form-control mb-6">
                            <label className="label"><span className="label-text font-semibold">จำนวนที่ต้องการ</span></label>
                            <div className="flex items-center gap-4">
                                <div className="join border border-base-300 rounded-lg">
                                    <button className="join-item btn btn-ghost hover:bg-base-200" onClick={handleDecrement} disabled={quantity <= 1}><FiMinus /></button>
                                    <input 
                                        className="join-item input input-ghost w-16 text-center font-bold focus:outline-none" 
                                        type="number" 
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, availableStock)))}
                                    />
                                    <button className="join-item btn btn-ghost hover:bg-base-200" onClick={handleIncrement} disabled={quantity >= availableStock}><FiPlus /></button>
                                </div>
                                <div className="text-sm text-base-content/60">
                                    รวม: <span className="text-primary font-bold text-lg ml-1">{formatPrice(currentPrice * quantity)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <button onClick={onClose} className="btn btn-ghost flex-1">ยกเลิก</button>
                        <button 
                            onClick={handleConfirmAddToCart} 
                            disabled={quantity < 1 || quantity > availableStock} 
                            className="btn btn-primary flex-[2] shadow-lg hover:shadow-primary/30"
                        >
                            <FiShoppingCart className="mr-2" /> เพิ่มลงตะกร้า
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* Render Zoom Modal if active */}
        <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
};


export default function ProductDisplayCard({ product }: ProductDisplayCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const session = useSession();
  const { showAlert } = useAlert();
  const { increment } = useCounter();
 
  const handleConfirmAddToCart = async (productToAdd: ProductInventory, quantityToAdd: number) => {
    if (session?.status !== 'authenticated') {
        showAlert('กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงในตะกร้า', 'warning');
        return;
    }

    try {
      const response = await fetch('/api/main/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productToAdd.Product_ID,
          quantity: quantityToAdd,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
      }

      showAlert(`เพิ่ม ${productToAdd.Name} (${quantityToAdd} ชิ้น) ลงในรถเข็นแล้ว!`, 'success');
      increment(); // เพิ่มจำนวนสินค้าใน Navbar
    } catch (error: any) {
      showAlert(error.message, 'error');
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const availableStock = calculateAvailableStock(product);

  return (
    <>
      <Link href={`/products/${product.Product_ID}`} className="card bg-base-100 shadow-xl transition-all transform hover:scale-[1.02] hover:shadow-2xl duration-300 group border border-transparent hover:border-base-200 h-full">
        <figure className="h-56 relative overflow-hidden bg-white p-4">
          <Image
            src={product.Image_URL || 'https://placehold.co/400x300?text=No+Image'}
            alt={product.Name}
            layout="fill"
            className="object-contain transition-transform duration-500 group-hover:scale-110 p-2"
          />
          {product.Discount_Price !== null && product.Discount_Price < product.Sale_Price && (
            <div className="absolute top-2 right-2 badge badge-error text-white font-bold shadow-md z-10">
              ลดราคา
            </div>
          )}
          {availableStock === 0 && (
             <div className="absolute inset-0 bg-black/10 backdrop-grayscale flex items-center justify-center z-20">
                <span className="badge badge-lg bg-black/70 text-white border-none px-4 py-3">สินค้าหมด</span>
             </div>
          )}
        </figure>
        
        <div className="card-body p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
               <p className="text-xs text-base-content/50 mb-1">{product.Brand || 'ไม่ระบุแบรนด์'}</p>
               <div className="rating rating-xs disabled">
                  {/* <input type="radio" name={`rating-${product.Product_ID}`} className="mask mask-star-2 bg-orange-400" disabled checked={product.Review_Rating ? product.Review_Rating >= 4 : false} /> */}
               </div>
            </div>
            <h3 className="card-title text-base font-bold leading-snug line-clamp-2 h-10 mb-2 group-hover:text-primary transition-colors">
              {product.Name}
            </h3>
          </div>
          
          <div className="flex items-end justify-between mt-2 pt-2 border-t border-base-100">
            <div className="flex flex-col">
              {product.Discount_Price !== null && product.Discount_Price < product.Sale_Price ? (
                <>
                  <span className="text-xs text-base-content/40 line-through">
                    {formatPrice(product.Sale_Price)}
                  </span>
                  <span className="font-extrabold text-primary text-lg">
                    {formatPrice(product.Discount_Price)}
                  </span>
                </>
              ) : (
                <span className="font-extrabold text-primary text-lg">
                  {formatPrice(product.Sale_Price)}
                </span>
              )}
            </div>
            
            <button
              className="btn btn-primary btn-sm btn-circle shadow-lg hover:scale-110 transition-transform"
              onClick={openModal}
              title="เพิ่มลงรถเข็น"
              disabled={availableStock === 0}
            >
              <FiShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      <AddToCartQuantityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onAddToCart={handleConfirmAddToCart}
      />
    </>
  );
}