'use client';

import React from 'react';
import { FiEye, FiXCircle } from 'react-icons/fi';
import { Order, StatusConfig } from '@/types';
import { formatPrice } from '@/app/utils/formatters';
import OrderCancelButton from '../components/order-management/OrderCancelButton';

interface OrderRowProps {
  order: Order;
  statusConfig: StatusConfig;
  btnCancelOrder: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, statusConfig, btnCancelOrder }) => {
  const StatusIcon = statusConfig[order.Status]?.icon;
  const statusInfo = statusConfig[order.Status];

  const handleClickOpen = () => {
    if (order.Status === 'refunding' || order.Status === 'refunded') {
      window.open(`/admin/order-management/${order.Order_ID}/refunding`);
    } else {
      window.open(`/admin/order-management/${order.Order_ID}/checkorder`);
    }
  }

  return (
    <tr className="hover cursor-pointer" onClick={handleClickOpen}>
      <td><div className="font-bold text-primary">#{order.Order_ID}</div></td>
      <td>
        <div className="font-bold">{order.Customer_Name}</div>
        <div className="text-sm opacity-70">{order.Customer_Email || '-'}</div>
      </td>
      <td>
        <ul className="list-disc list-inside text-sm">
          {order.Products.slice(0, 2).map((p, idx) => (
            <li key={idx} className="truncate max-w-xs">{p.Product_Name} ({p.Quantity} {p.Product_Unit})</li>
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
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation();
              handleClickOpen();
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>

          {btnCancelOrder ? (
              <OrderCancelButton orderId={order.Order_ID}  onlyIcon={true}/>
            ) : (
              <button className="btn btn-sm btn-ghost btn-square" title="ยกเลิกคำสั่งซื้อ" disabled>
                <FiXCircle className="w-4 h-4" />
              </button>
            )
          }
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;