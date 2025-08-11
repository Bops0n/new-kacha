import React from 'react';
import { FiEye, FiTrash2 } from 'react-icons/fi'; // Changed FiEdit to FiEye, removed FiEdit from import
import { ProductInventory } from '@/types'; // Correct path to types
import { ModalMode } from '@/types';

interface ProductRowProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
  getFullCategoryName: (childId: number | null) => string;
  openProductModal: (product: ProductInventory | null, initialMode: ModalMode) => void
  deleteProduct: (productId: number) => void;
  availableStock: number;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  formatPrice,
  getFullCategoryName,
  openProductModal,
  deleteProduct,
  availableStock
}) => {
  const isLowStock = availableStock <= product.Reorder_Point && availableStock > 0;
  const isOutOfStock = availableStock === 0;

  return (
    // Make the entire row clickable to open the modal in view mode
    <tr className="hover cursor-pointer" onClick={() => openProductModal(product, 'view')}>
      <td><div className="font-bold text-primary">{product.Product_ID}</div></td>
      {/* Image */}
      <td>
        <div className="avatar">
          <div className="mask mask-squircle w-12 h-12">
            <img
              src={product.Image_URL || 'https://placehold.co/48x48/EEEEEE/333333?text=No+Img'}
              alt={product.Name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/48x48/CCCCCC/666666?text=Img+Error';
              }}
            />
          </div>
        </div>
      </td>
      {/* Name and Description */}
      <td>
        <div className="font-semibold">{product.Name}</div>
        <div className="text-sm text-base-content/70 max-w-[200px] truncate">
          {product.Description || 'ไม่มีรายละเอียด'}
        </div>
      </td>
      {/* Brand */}
      <td>{product.Brand}</td>
      {/* Category */}
      <td className="text-sm text-base-content/80">{getFullCategoryName(product.Child_ID)}</td>
      {/* Quantity with status indicators */}
      <td>
        <div className="font-bold">
          {availableStock} {product.Unit}
        </div>
        {isOutOfStock && <span className="badge badge-error badge-xs ml-1">หมด</span>}
        {isLowStock && !isOutOfStock && <span className="badge badge-warning badge-xs ml-1">ใกล้หมด</span>}
      </td>
      {/* Sale Price */}
      <td><div className="font-bold">{formatPrice(product.Sale_Price)}</div></td>
      {/* Visibility Status */}
      <td>
        {product.Visibility ? (
          <span className="badge badge-success">แสดงผล</span>
        ) : (
          <span className="badge badge-neutral">ซ่อน</span>
        )}
      </td>
      {/* Actions */}
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              openProductModal(product, 'view'); // Open in view mode
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              deleteProduct(product.Product_ID);
            }}
            title="ลบ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProductRow;
