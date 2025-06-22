'use client'; // This component will run on the client side

import Image from 'next/image';
import { FiDollarSign, FiBox, FiStar, FiShoppingCart, FiTag } from 'react-icons/fi'; // Added FiShoppingCart

import { ProductInventory } from '../../../types'; // Assuming types.ts defines ProductInventory

// Helper for currency formatting (can be shared or passed as prop)
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

interface ProductDisplayCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string; // Assuming this function is passed for consistency
  onAddToCartClick: (product: ProductInventory) => void; // New prop for add to cart
}

const ProductDisplayCard: React.FC<ProductDisplayCardProps> = ({ product, formatPrice, onAddToCartClick }) => {
  const isDiscounted = product.Sale_Price < product.Sale_Cost;
  const originalPrice = product.Sale_Cost; // Assuming Sale_Cost is the original price

  return (
    <div className="card bg-base-100 shadow-xl rounded-lg overflow-hidden flex flex-col h-full transition-transform duration-200 hover:scale-103 hover:shadow-2xl">
      <figure className="relative w-full h-48 bg-base-200 flex items-center justify-center">
        {product.Image_URL ? (
          <img
            src={product.Image_URL}
            alt={product.Name}
             // Use fill to make image cover the area
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizes
            // Corrected: objectFit is a CSS property, not a direct HTML attribute in React.
            // Apply it via className with Tailwind's 'object-contain' utility.
            className="object-contain transition-opacity duration-300 opacity-0" // Maintain aspect ratio within the container
            onLoad={image => image.currentTarget.classList.remove('opacity-0')} // Remove opacity class when loaded
            onError={(e) => {
              e.currentTarget.onerror = null; // Prevent infinite loop
              e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/666666?text=Image+Error'; // Fallback
            }}
          />
        ) : (
          <FiBox className="w-24 h-24 text-base-content/30" />
        )}
        {isDiscounted && (
          <span className="badge badge-error absolute top-2 right-2">ลดราคา!</span>
        )}
      </figure>

      <div className="card-body p-4 flex flex-col justify-between">
        <div>
          <h2 className="card-title text-lg font-bold text-base-content mb-2 line-clamp-2">
            {product.Name}
          </h2>
          <p className="text-sm text-base-content/70 mb-2 line-clamp-3">
            {product.Description || 'ไม่มีคำอธิบาย'}
          </p>
          <p className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
            <FiTag className="w-3 h-3" /> แบรนด์: {product.Brand}
          </p>
          <p className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
            <FiBox className="w-3 h-3" /> สต็อก: {product.Quantity} {product.Unit}
          </p>
          {product.Review_Rating !== null && (
            <p className="text-xs text-base-content/60 mb-3 flex items-center gap-1">
              <FiStar className="w-3 h-3 text-warning" /> คะแนนรีวิว: {product.Review_Rating.toFixed(1)}
            </p>
          )}
        </div>

        {/* Pricing Information */}
        <div className="mt-auto pt-4 border-t border-base-200">
          {isDiscounted && (
            <p className="text-sm text-base-content/60 line-through">
              {formatPrice(originalPrice)}
            </p>
          )}
          <p className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
            <FiDollarSign className="w-6 h-6" /> {formatPrice(product.Sale_Price)}
          </p>

          {/* Add to Cart Button */}
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary w-full"
              onClick={() => onAddToCartClick(product)} // Call the passed handler
              disabled={product.Quantity === 0} // Disable if out of stock
            >
              <FiShoppingCart className="w-5 h-5" />
              {product.Quantity === 0 ? 'สินค้าหมด' : 'เพิ่มสินค้าลงรถเข็น'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplayCard;
