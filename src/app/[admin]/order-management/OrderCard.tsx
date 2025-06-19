import React from 'react';
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEye // Import FiEye
} from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '../../../../types'; // Correct path to types

interface OrderCardProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order, initialMode?: 'view' | 'edit') => void; // Changed prop name
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  statusConfig,
  formatPrice,
  viewOrderDetails, // Updated prop name
}) => {
  const Icon = statusConfig[order.status].icon;

  return (
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => viewOrderDetails(order, 'view')}>
      <div className="card-body p-4">
        <h2 className="card-title text-primary text-xl mb-2">{order.customerName} <span className="text-base-content/70 text-sm">({order.id})</span></h2>
        <p className="text-sm flex items-center gap-1"><FiMail className="w-3 h-3" /> {order.email}</p>
        <p className="text-sm flex items-center gap-1"><FiPhone className="w-3 h-3" /> {order.phone}</p>
        <div className="divider my-2"></div>
        <p className="text-sm font-semibold mb-1 flex items-center gap-1"><FiPackage className="w-3 h-3" /> สินค้า:</p>
        <ul className="list-disc list-inside text-sm pl-4">
          {order.products.map((product, idx) => (
            <li key={idx}>{product.name} ({product.quantity})</li>
          ))}
        </ul>
        <div className="divider my-2"></div>
        <p className="text-sm mb-1 flex items-center gap-1"><FiDollarSign className="w-3 h-3" /> <strong>รวม:</strong> <span className="font-bold">{formatPrice(order.total)}</span></p>
        <p className="text-sm flex items-center gap-1"><FiCalendar className="w-3 h-3" /> <strong>วันที่สั่ง:</strong> {order.orderDate}</p>
        <p className="text-sm flex items-center gap-1">
          {React.createElement(Icon, { className: `w-3 h-3 ${statusConfig[order.status].color}` })}
          <strong>สถานะ:</strong>{' '}
          <span className={`badge ${statusConfig[order.status].color.replace('text-', 'badge-')} badge-outline`}>
            {statusConfig[order.status].label}
          </span>
        </p>
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              viewOrderDetails(order, 'view'); // Open in view mode
            }}
          >
            <FiEye className="w-4 h-4" /> ดูรายละเอียด {/* Changed icon to FiEye */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
