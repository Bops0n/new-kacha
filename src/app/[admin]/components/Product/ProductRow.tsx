import React from 'react'; // Ensure React is explicitly imported
import { FiEye, FiEdit, FiTrash2, FiEyeOff } from 'react-icons/fi';
import { ProductInventory } from '../../../types'; // Adjust path based on your project structure

interface ProductRowProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
  getFullCategoryName: (childId: number | null) => string; // To display category path
  viewProductDetails: (product: ProductInventory) => void;
  handleEditProductClick: (product: ProductInventory) => void;
  deleteProduct: (productId: number) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  formatPrice,
  getFullCategoryName,
  viewProductDetails,
  handleEditProductClick,
  deleteProduct,
}) => {
  const isLowStock = product.Quantity <= product.Reorder_Point && product.Quantity > 0;
  const isOutOfStock = product.Quantity === 0;

  return (
    <tr className="hover">
      {/* Product ID */}
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
        <div className={`font-bold ${isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : ''}`}>
          {product.Quantity} {product.Unit}
        </div>
        {isOutOfStock && <span className="badge badge-error badge-xs">หมด</span>}
        {isLowStock && !isOutOfStock && <span className="badge badge-warning badge-xs">ใกล้หมด</span>}
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
            onClick={() => viewProductDetails(product)}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={() => handleEditProductClick(product)}
            title="แก้ไข"
          >
            <FiEdit className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={() => deleteProduct(product.Product_ID)}
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
