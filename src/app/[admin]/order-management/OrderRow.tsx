'use client';

import React from 'react';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { Order, StatusConfig } from '@/types';
import { formatPrice } from '@/app/utils/formatters';

interface OrderRowProps {
  order: Order;
  statusConfig: StatusConfig;
  viewOrderDetails: (order: Order) => void;
  deleteOrder: (orderId: number) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, statusConfig, viewOrderDetails, deleteOrder }) => {
  const StatusIcon = statusConfig[order.Status]?.icon;
  const statusInfo = statusConfig[order.Status];

  return (
    <tr className="hover cursor-pointer" onClick={() => viewOrderDetails(order)}>
      <td><div className="font-bold text-primary">#{order.Order_ID}</div></td>
      <td>
        <div className="font-bold">{order.Customer_Name}</div>
        <div className="text-sm opacity-70">{order.Email || '-'}</div>
      </td>
      <td>
        <ul className="list-disc list-inside text-sm">
          {order.Products.slice(0, 2).map((p, idx) => (
            <li key={idx} className="truncate max-w-xs">{p.Product_Name} (x{p.Quantity})</li>
          ))}
          {order.Products.length > 2 && <li className="text-xs opacity-60">...และอีก {order.Products.length - 2} รายการ</li>}
        </ul>
      </td>
      <td><div className="font-bold">{formatPrice(order.Total_Amount)}</div></td>
      <td>
        {statusInfo && (
          <span className={`badge ${statusInfo.color}`}>
            {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />} 
            {statusInfo.label}
          </span>
        )}
      </td>
      <td>{order.Order_Date}</td>
      <td>{order.Tracking_ID || '-'}</td>
      <td>
        <div className="flex gap-1">
          {/* <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation();
              viewOrderDetails(order);
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button> */}
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation();
              deleteOrder(order.Order_ID);
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