import React from 'react';
import { FiStar } from 'react-icons/fi'; // For star rating
import { ProductInventory } from '../../types'; // Adjust path if your types.ts is in a different location

interface ProductDisplayCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
}

const ProductDisplayCard: React.FC<ProductDisplayCardProps> = ({ product, formatPrice }) => {
  // Determine if there's a discount
  const hasDiscount = product.Sale_Price < product.Sale_Cost;

  // Render stars for review rating
  const renderStars = (rating: number | null) => {
    if (rating === null || rating < 0 || rating > 5) {
      return (
        <div className="flex items-center text-gray-400">
          {[...Array(5)].map((_, i) => (
            <FiStar key={i} className="w-4 h-4" />
          ))}
          <span className="text-sm ml-1">(ไม่มีคะแนน)</span>
        </div>
      );
    }
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-star-${product.Product_ID}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" /> {/* grey-300 */}
              </linearGradient>
            </defs>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" fill={`url(#half-star-${product.Product_ID})`} />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="text-sm ml-1 text-base-content/70">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl rounded-lg overflow-hidden transition-transform transform hover:scale-105 duration-300 ease-in-out">
      <figure className="relative w-full h-48 bg-gray-200">
        <img
          src={product.Image_URL || 'https://placehold.co/400x300/EEEEEE/333333?text=No+Image'}
          alt={product.Name}
          className="w-full h-full object-contain" // Use object-contain to prevent cropping
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/666666?text=Image+Error';
          }}
        />
        {/* Placeholder for "ตรา จระเข้" or "USA" if needed, but often part of image */}
        {product.Brand && product.Brand.toLowerCase().includes('จระเข้') && (
          <div className="absolute top-2 left-2 badge badge-info text-xs font-semibold">จระเข้</div>
        )}
      </figure>

      <div className="card-body p-4 flex flex-col justify-between">
        <h2 className="card-title text-base-content text-lg mb-2 truncate">
          {product.Name}
        </h2>

        <div className="flex items-center mb-1">
          {renderStars(product.Review_Rating)}
        </div>

        <div className="flex flex-col mb-2">
          {hasDiscount && (
            <span className="text-sm text-base-content/60 line-through">
              จากราคาปกติ {formatPrice(product.Sale_Cost)}
            </span>
          )}
          <span className="text-3xl font-bold text-red-500">
            {formatPrice(product.Sale_Price)}
            <span className="text-base text-base-content/70 font-normal ml-1">/ {product.Unit}</span>
          </span>
        </div>

        <div className="card-actions justify-start">
          <button className="btn btn-primary btn-sm rounded-full">
            ดูรายละเอียด
          </button>
          {/* Example of adding to cart button if needed
          <button className="btn btn-secondary btn-sm rounded-full">
            <FiShoppingCart className="w-4 h-4" /> เพิ่มลงตะกร้า
          </button>
          */}
        </div>
      </div>
    </div>
  );
};

export default ProductDisplayCard;
