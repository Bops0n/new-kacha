'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiStar, FiPlus, FiMinus } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useAlert } from '@/app/context/AlertModalContext';
import { useCounter } from '@/app/context/CartCount';
import { ProductInventory } from '@/types'; // อ้างอิงจากโครงสร้างใหม่
import { calculateAvailableStock } from '@/app/utils/calculations';

interface ProductDisplayCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
}

// Modal Component สำหรับเลือกจำนวนสินค้า
const AddToCartQuantityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: ProductInventory;
  formatPrice: (price: number) => string;
  onAddToCart: (product: ProductInventory, quantity: number) => void;
}> = ({ isOpen, onClose, product, formatPrice, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (quantity < product.Quantity) setQuantity(prev => prev + 1);
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleConfirmAddToCart = () => {
    if (quantity >= 1 && quantity <= product.Quantity) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        <h3 className="font-bold text-lg text-center mb-4">เลือกจำนวนสินค้า</h3>
        <div className="flex items-center mb-6 border-b pb-4">
          <Image
            src={product.Image_URL || 'https://placehold.co/100x100?text=No+Image'}
            alt={product.Name}
            width={80}
            height={80}
            className="rounded-md mr-4 object-contain"
          />
          <div>
            <h4 className="font-semibold text-base-content">{product.Name}</h4>
            <p className="text-primary">{formatPrice(product.Sale_Price)}</p>
            <p className="text-sm text-base-content/70">คงเหลือ: {calculateAvailableStock(product)} {product.Unit}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={handleDecrement} disabled={quantity <= 1} className="btn btn-outline btn-sm"><FiMinus /></button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, product.Quantity)))}
            className="input input-bordered w-20 text-center"
          />
          <button onClick={handleIncrement} disabled={quantity >= product.Quantity} className="btn btn-outline btn-sm"><FiPlus /></button>
        </div>
        <div className="modal-action justify-end">
          <button onClick={onClose} className="btn btn-ghost">ยกเลิก</button>
          <button onClick={handleConfirmAddToCart} disabled={quantity < 1 || quantity > product.Quantity} className="btn btn-primary">
            <FiShoppingCart className="mr-2" /> ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};


export default function ProductDisplayCard({ product, formatPrice }: ProductDisplayCardProps) {
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

  return (
    <>
      <Link href={`/products/${product.Product_ID}`} className="card bg-base-100 shadow-xl transition-transform transform hover:scale-105 duration-300 group">
        <figure className="h-48 relative overflow-hidden">
          <Image
            src={product.Image_URL || 'https://placehold.co/400x300?text=No+Image'}
            alt={product.Name}
            layout="fill"
            className="rounded-t-lg object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {product.Discount_Price !== null && product.Discount_Price < product.Sale_Price && (
            <div className="badge badge-error absolute top-2 right-2 text-white font-bold">
              ลดราคา
            </div>
          )}
        </figure>
        <div className="card-body p-4 justify-between">
          <div>
            <h3 className="card-title text-base font-semibold leading-tight line-clamp-2 h-12">
              {product.Name}
            </h3>
            <p className="text-sm text-base-content/70 line-clamp-2 h-10 mt-1">
              {product.Description}
            </p>
          </div>
          <div className="card-actions items-center justify-between mt-2">
            <div>
              {product.Discount_Price !== null && product.Discount_Price < product.Sale_Price ? (
                <>
                  <p className="text-sm text-base-content/60 line-through">
                    {formatPrice(product.Sale_Price)}
                  </p>
                  <p className="font-bold text-primary text-lg">
                    {formatPrice(product.Discount_Price)}
                  </p>
                </>
              ) : (
                <p className="font-bold text-primary text-lg">
                  {formatPrice(product.Sale_Price)}
                </p>
              )}
            </div>
            <button
              className="btn btn-primary btn-sm btn-circle shadow-md"
              onClick={openModal}
              title="เพิ่มลงรถเข็น"
              disabled={product.Quantity === 0}
            >
              <FiShoppingCart />
            </button>
          </div>
        </div>
      </Link>

      <AddToCartQuantityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        formatPrice={formatPrice}
        onAddToCart={handleConfirmAddToCart}
      />
    </>
  );
}