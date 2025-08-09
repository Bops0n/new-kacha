'use client';

import React from 'react';
import { FiPackage, FiDollarSign, FiCalendar, FiEye } from 'react-icons/fi';
import { Order, StatusConfig } from '@/types';
import { formatPrice, formatDate } from '@/app/utils/formatters';

interface OrderCardProps {
  order: Order;
  statusConfig: StatusConfig;
  viewOrderDetails: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, statusConfig, viewOrderDetails }) => {
  const StatusIcon = statusConfig[order.Status]?.icon;
  const statusInfo = statusConfig[order.Status];

  return (
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => viewOrderDetails(order)}>
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="card-title text-base">{order.Customer_Name}</h2>
                <p className="text-sm text-base-content/70">ID: #{order.Order_ID}</p>
            </div>
            {statusInfo && (
                <span className={`badge ${statusInfo.color}`}>
                    {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                    {statusInfo.label}
                </span>
            )}
        </div>
        
        <div className="divider my-2"></div>
        
        <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><FiPackage className="w-4 h-4 text-base-content/70" /> <span>{order.Products.length} รายการ</span></p>
            <p className="flex items-center gap-2"><FiDollarSign className="w-4 h-4 text-base-content/70" /> <span className="font-bold">{formatPrice(order.Total_Amount)}</span></p>
            <p className="flex items-center gap-2"><FiCalendar className="w-4 h-4 text-base-content/70" /> <span>สั่งเมื่อ: {formatDate(order.Order_Date)}</span></p>
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              viewOrderDetails(order);
            }}
          >
            <FiEye className="w-4 h-4" /> ดูรายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;