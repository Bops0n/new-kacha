// components/OrderCard.tsx
import React from 'react';
import { FiEye, FiPackage } from 'react-icons/fi';
import { Order, StatusConfig } from '../types'; // Adjust path as needed

interface OrderCardProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  statusConfig,
  formatPrice,
  viewOrderDetails,
}) => {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <h2 className="card-title text-primary text-xl mb-2">{order.id}</h2>
        <p className="text-sm">
          <strong>ลูกค้า:</strong> {order.customerName}
        </p>
        <p className="text-sm">
          <strong>สถานะ:</strong>
          <span className={`ml-2 badge ${statusConfig[order.status].color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[order.status].label}
          </span>
        </p>
        <p className="text-sm">
          <strong>ยอดรวม:</strong> {formatPrice(order.total)}
        </p>
        <p className="text-sm">
          <strong>วันที่สั่ง:</strong> {order.orderDate}
        </p>
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => viewOrderDetails(order)}
          >
            <FiEye className="w-4 h-4" /> ดูรายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;