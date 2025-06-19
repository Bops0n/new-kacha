// components/OrderRow.tsx
import React from 'react';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '../types'; // Adjust path as needed

interface OrderRowProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({
  order,
  statusConfig,
  formatPrice,
  viewOrderDetails,
  updateOrderStatus,
  deleteOrder,
}) => {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    <tr className="hover">
      <td><div className="font-bold text-primary">{order.id}</div></td>
      <td>
        <div>
          <div className="font-semibold">{order.customerName}</div>
          <div className="text-sm text-base-content/70">{order.email}</div>
          <div className="text-sm text-base-content/70">{order.phone}</div>
        </div>
      </td>
      <td>
        <div className="max-w-xs">
          {order.products.slice(0, 2).map((product, idx) => (
            <div key={idx} className="text-sm">
              {product.name} x{product.quantity}
            </div>
          ))}
          {order.products.length > 2 && (
            <div className="text-sm text-base-content/70">
              และอีก {order.products.length - 2} รายการ
            </div>
          )}
        </div>
      </td>
      <td><div className="font-bold text-lg">{formatPrice(order.total)}</div></td>
      <td>
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          <span className={`badge ${statusConfig[order.status].color}`}>
            {statusConfig[order.status].label}
          </span>
        </div>
      </td>
      <td>{order.orderDate}</td>
      <td>{order.deliveryDate}</td>
      <td>
        <div className="text-sm text-base-content">
          {order.trackingId ? (
            <>
              {order.trackingId}
              {order.shippingCarrier && (
                <div className="text-xs text-base-content/50">({order.shippingCarrier})</div>
              )}
            </>
          ) : (
            <span className="text-base-content/50">ยังไม่มี</span>
          )}
        </div>
      </td>
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={() => viewOrderDetails(order)}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={() => deleteOrder(order.id)}
            title="ลบ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;