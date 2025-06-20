'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiStar } from 'react-icons/fi';

// Assuming ProductInventory type is defined in src/types.ts
// Make sure ProductInventory.Product_ID is 'string' or 'number' as needed
interface ProductInventory {
  Product_ID: number; // Keeping as number based on products/page.tsx mock data
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

export default function ProductDisplayCard({ product, formatPrice }: ProductDisplayCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail page
    e.stopPropagation(); // Prevent card click event
    console.log(`Adding Product ID: ${product.Product_ID} to cart`);
    alert(`เพิ่ม "${product.Name}" ลงในตะกร้าแล้ว!`);
    // In a real app, send this to your cart API
  };

  return (
    <Link
      href={`/product/${product.Product_ID}`} // Link to the product detail page
      className="card bg-base-100 shadow-xl compact transition-transform transform hover:scale-105 duration-300 group overflow-hidden relative"
    >
      <figure className="h-48 relative overflow-hidden">
        <img
          src={product.Image_URL || 'https://placehold.co/400x300/EEEEEE/333333?text=No+Image'}
          alt={product.Name}
          // layout="fill"
          // objectFit="cover"
          className="rounded-t-lg transition-transform duration-300 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/666666?text=Image+Error'; }}
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
            onClick={handleAddToCart}
            title="เพิ่มลงรถเข็น"
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
  );
}
