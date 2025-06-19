import React from 'react';
import { FiEye, FiTrash2, FiEdit } from 'react-icons/fi'; // Import FiEye
import { Order, OrderStatus, StatusConfig } from '../../../../types'; // Correct path to types

interface OrderRowProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order, initialMode?: 'view' | 'edit') => void; // Changed prop name
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, reason?: string | null) => void;
  deleteOrder: (orderId: string) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({
  order,
  statusConfig,
  formatPrice,
  viewOrderDetails, // Updated prop name
  updateOrderStatus,
  deleteOrder,
}) => {
  const Icon = statusConfig[order.status].icon;

  return (
    <tr className="hover cursor-pointer" onClick={() => viewOrderDetails(order, 'view')}>
      <td><div className="font-bold text-primary">{order.id}</div></td>
      <td>
        <div className="font-semibold">{order.customerName}</div>
        <div className="text-sm text-base-content/70">{order.email}</div>
      </td>
      <td>
        <ul className="list-disc list-inside text-sm">
          {order.products.map((product, idx) => (
            <li key={idx}>{product.name} ({product.quantity})</li>
          ))}
        </ul>
      </td>
      <td><div className="font-bold">{formatPrice(order.total)}</div></td>
      <td>
        <span className={`badge ${statusConfig[order.status].color.replace('text-', 'badge-')} badge-outline`}>
          {React.createElement(Icon, { className: "inline-block w-3 h-3 mr-1" })}
          {statusConfig[order.status].label}
        </span>
      </td>
      <td>{order.orderDate}</td>
      <td>{order.deliveryDate || '-'}</td>
      <td>{order.trackingId || '-'}</td>
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              viewOrderDetails(order, 'view'); // Open in view mode
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" /> {/* Changed icon to FiEye */}
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              deleteOrder(order.id);
            }}
            title="ลบคำสั่งซื้อ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;
