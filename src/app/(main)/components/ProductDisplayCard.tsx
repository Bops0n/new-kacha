'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiStar, FiPlus, FiMinus } from 'react-icons/fi'; // Added FiPlus, FiMinus for quantity selection

// Assuming ProductInventory type is defined in src/types.ts
interface ProductInventory {
  Product_ID: number;
  Child_ID: number;
  Name: string;
  Brand: string;
  Description: string;
  Unit: string;
  Quantity: number; // Stock quantity
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string;
}

interface ProductDisplayCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
}

// Add to Cart Quantity Selection Modal Component
const AddToCartQuantityModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product: ProductInventory;
  formatPrice: (price: number) => string;
  onAddToCart: (product: ProductInventory, quantity: number) => void;
}> = ({ isOpen, onClose, product, formatPrice, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1); // Default quantity is 1

  // Do not render modal if not open
  if (!isOpen) return null;

  // Handle incrementing quantity
  const handleIncrement = () => {
    // Prevent adding more than available stock
    if (quantity < product.Quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  // Handle decrementing quantity
  const handleDecrement = () => {
    // Prevent quantity from going below 1
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Handle manual quantity input
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= product.Quantity) {
      setQuantity(value);
    } else if (e.target.value === '') {
      // Allow empty input temporarily for user to type
      setQuantity(0); // Set to 0 or null to indicate incomplete input
    }
  };

  // Handle blur event for manual quantity input to ensure valid number
  const handleQuantityBlur = () => {
    if (quantity === 0 || isNaN(quantity)) {
      setQuantity(1); // Reset to 1 if user leaves input empty or invalid
    } else if (quantity > product.Quantity) {
      setQuantity(product.Quantity); // Cap at max available quantity
    }
  };

  // Handle adding product to cart with selected quantity
  const handleConfirmAddToCart = () => {
    if (quantity >= 1 && quantity <= product.Quantity) {
      onAddToCart(product, quantity);
      onClose(); // Close modal after adding to cart
      setQuantity(1); // Reset quantity for next open
    }
  };

  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50 p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full transform transition-all scale-100 opacity-100 duration-300 ease-out">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">เลือกจำนวนสินค้า</h2>

        {/* Product Details in Modal */}
        <div className="flex items-center mb-6 border-b pb-4">
          <Image
            src={product.Image_URL || 'https://placehold.co/100x100/EEEEEE/333333?text=รูปภาพ'}
            alt={product.Name}
            width={80}
            height={80}
            objectFit="cover"
            className="rounded-md mr-4"
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{product.Name}</h3>
            <p className="text-gray-600">ราคา: {formatPrice(product.Sale_Price)}</p>
            <p className="text-gray-500 text-sm">สินค้าคงเหลือ: {product.Quantity} {product.Unit}</p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1}
            className="btn btn-circle btn-sm bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiMinus className="w-5 h-5" />
          </button>
          <input
            type="number"
            value={quantity === 0 ? '' : quantity} // Display empty string if quantity is 0 for input purpose
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            className="input input-bordered w-24 text-center text-lg font-semibold"
            min="1"
            max={product.Quantity}
            aria-label="จำนวนสินค้า"
          />
          <button
            onClick={handleIncrement}
            disabled={quantity >= product.Quantity}
            className="btn btn-circle btn-sm btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>

        {quantity > product.Quantity && (
          <p className="text-red-500 text-center mb-4">
            จำนวนที่เลือกเกินกว่าสินค้าที่มีในสต็อก
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="btn btn-ghost px-6 py-2 rounded-lg text-gray-600 transition-colors duration-300 hover:bg-gray-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirmAddToCart}
            disabled={quantity < 1 || quantity > product.Quantity}
            className="btn btn-primary px-6 py-2 rounded-lg text-white font-semibold transition-colors duration-300 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            เพิ่มลงรถเข็น
          </button>
        </div>
      </div>
    </div>
  );
};


export default function ProductDisplayCard({ product, formatPrice }: ProductDisplayCardProps) {
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);

  // This function will be called when the user confirms adding to cart from the modal
  const handleConfirmAddToCart = (productToAdd: ProductInventory, quantityToAdd: number) => {
    console.log(`Adding Product ID: ${productToAdd.Product_ID}, Name: ${productToAdd.Name}, Quantity: ${quantityToAdd} to cart.`);
    // Here you would typically dispatch an action to add the item to a global cart state
    // For example: dispatch(addToCart(productToAdd.Product_ID, quantityToAdd));
    // Or make an API call to update the backend cart
    setIsQuantityModalOpen(false); // Close the modal after confirmation
  };

  const openQuantityModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuantityModalOpen(true);
  };

  const closeQuantityModal = () => {
    setIsQuantityModalOpen(false);
  };

  return (
    <>
      <Link
        href={`/product/${product.Product_ID}`}
        className="card bg-base-100 shadow-xl compact transition-transform transform hover:scale-105 duration-300 group overflow-hidden relative"
      >
        <figure className="h-48 relative overflow-hidden">
          <img
            src={product.Image_URL || 'https://placehold.co/400x300/EEEEEE/333333?text=ไม่พบรูปภาพ&format=png'}
            alt={product.Name}
            layout="fill"
            className="rounded-t-lg transition-transform duration-300 group-hover:scale-110 object-cover"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/666666?text=รูปภาพผิดพลาด&format=png'; }}
          />
          {product.Sale_Price < product.Sale_Cost && (
            <span className="badge badge-error absolute top-2 right-2 text-white font-bold px-3 py-2 z-10">
              ลด {((1 - product.Sale_Price / product.Sale_Cost) * 100).toFixed(0)}%
            </span>
          )}
        </figure>
        <div className="card-body p-4 text-base-content flex flex-col justify-between">
          <div>
            <h3 className="card-title text-lg font-semibold leading-tight line-clamp-2 mb-1">
              {product.Name}
            </h3>
            <p className="text-sm text-base-content/70 line-clamp-2 min-h-[40px]">
              {product.Description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              {product.Sale_Price < product.Sale_Cost && (
                <p className="text-sm text-base-content/60 line-through">
                  {formatPrice(product.Sale_Cost)}
                </p>
              )}
              <p className="font-bold text-primary text-xl">
                {formatPrice(product.Sale_Price)}
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm btn-circle shadow-md hover:scale-110 transition-transform duration-300"
              onClick={openQuantityModal} // Changed to open the new quantity modal
              title="เลือกจำนวนและเพิ่มลงรถเข็น"
            >
              <FiShoppingCart className="w-5 h-5" />
            </button>
          </div>
          {product.Review_Rating !== null && (
            <div className="flex items-center text-sm text-base-content/70 mt-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={`w-4 h-4 ${i < Math.floor(product.Review_Rating!) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
              ))}
              <span className="ml-1">({product.Review_Rating.toFixed(1)})</span>
            </div>
          )}
        </div>
      </Link>

      {/* Add to Cart Quantity Selection Modal */}
      <AddToCartQuantityModal
        isOpen={isQuantityModalOpen}
        onClose={closeQuantityModal}
        product={product}
        formatPrice={formatPrice}
        onAddToCart={handleConfirmAddToCart}
      />
    </>
  );
}
