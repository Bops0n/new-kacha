import React from 'react'; // Ensure React is explicitly imported
import { FiEye, FiTag, FiBox, FiDollarSign } from 'react-icons/fi';
import { ProductInventory } from '../../../types'; // Adjust path based on your project structure

interface ProductCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
  getFullCategoryName: (childId: number | null) => string;
  viewProductDetails: (product: ProductInventory) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formatPrice,
  getFullCategoryName,
  viewProductDetails,
}) => {
  const isLowStock = product.Quantity <= product.Reorder_Point && product.Quantity > 0;
  const isOutOfStock = product.Quantity === 0;

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-start gap-4 mb-3">
          {/* Product Image */}
          <div className="avatar">
            <div className="mask mask-squircle w-16 h-16">
              <img
                src={product.Image_URL || 'https://placehold.co/64x64/EEEEEE/333333?text=No+Img'}
                alt={product.Name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/64x64/CCCCCC/666666?text=Img+Error';
                }}
              />
            </div>
          </div>
          {/* Product Name & Brand */}
          <div className="flex-1">
            <h2 className="card-title text-primary text-xl mb-1">{product.Name}</h2>
            <p className="text-sm text-base-content/70 flex items-center gap-1">
              <FiTag className="w-3 h-3" /> {product.Brand}
            </p>
            <p className="text-xs text-base-content/60">
              {getFullCategoryName(product.Child_ID)}
            </p>
          </div>
        </div>

        <p className="text-sm mb-1 flex items-center gap-1">
          <FiBox className="w-3 h-3" />
          <strong>จำนวน:</strong>{' '}
          <span className={`font-bold ${isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : ''}`}>
            {product.Quantity} {product.Unit}
          </span>
          {isOutOfStock && <span className="badge badge-error badge-xs ml-1">หมด</span>}
          {isLowStock && !isOutOfStock && <span className="badge badge-warning badge-xs ml-1">ใกล้หมด</span>}
        </p>
        <p className="text-sm mb-3 flex items-center gap-1">
          <FiDollarSign className="w-3 h-3" />
          <strong>ราคาขาย:</strong> {formatPrice(product.Sale_Price)}
        </p>

        {/* Visibility Status */}
        <p className="text-sm">
          <strong>สถานะ:</strong>{' '}
          {product.Visibility ? (
            <span className="badge badge-success badge-sm ml-1">แสดงผล</span>
          ) : (
            <span className="badge badge-neutral badge-sm ml-1">ซ่อน</span>
          )}
        </p>

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => viewProductDetails(product)}
          >
            <FiEye className="w-4 h-4" /> ดูรายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
