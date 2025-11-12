'use client';

import React, { useEffect } from 'react';
import { SimpleProductDetail, OrderProductDetail } from '@/types';
import { FiImage, FiArchive, FiShoppingBag, FiAlertTriangle } from 'react-icons/fi';
import { formatPrice } from '@/app/utils/formatters';

interface OrderItemDetailProps {
  orderProduct: OrderProductDetail;
  liveProduct?: SimpleProductDetail;
}

const OrderItemDetail: React.FC<OrderItemDetailProps> = ({ orderProduct, liveProduct }) => {
  
  const name = liveProduct?.Name || orderProduct.Product_Name;
  const imageUrl = liveProduct?.Image_URL || orderProduct.Product_Image_URL;
  const availableStock = liveProduct?.Quantity;

  const isStockInsufficient = typeof availableStock !== 'undefined' && availableStock < orderProduct.Quantity;
  
  // --- Logic การแสดงราคา ---
  const hasDiscount = orderProduct.Product_Discount_Price !== null && orderProduct.Product_Discount_Price < orderProduct.Product_Sale_Price;

  return (
    <div className="card card-side bg-base-200 shadow-sm w-full items-center p-2">
      {/* ส่วนรูปภาพ (ซ้าย) */}
      <figure className="pl-2 flex-shrink-0">
        <div className="avatar w-20 h-20">
            <div className="w-20 rounded-lg bg-base-100 flex items-center justify-center">
            {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
            ) : (
                <FiImage className="w-10 h-10 text-base-content/30" />
            )}
            </div>
        </div>
      </figure>

      {/* ส่วนข้อมูล (กลาง) */}
      <div className="card-body p-3 flex-grow">
        <h2 className="card-title text-base font-bold leading-tight" title={name}>
          {name}
        </h2>
        <div className="text-sm space-y-1 mt-1">
            <div className="flex items-center gap-2 text-base-content/80">
                <FiShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span>จำนวนที่สั่ง: <span className="font-bold text-primary">{orderProduct.Quantity}</span> {orderProduct.Product_Unit}</span>
            </div>
            {typeof availableStock !== 'undefined' && (
                <div className={`flex items-center gap-2 ${isStockInsufficient ? 'text-error' : 'text-success'}`}>
                    <FiArchive className="w-4 h-4 flex-shrink-0" />
                    <span>คงเหลือในคลัง: <span className="font-bold">{availableStock}</span> ชิ้น</span>
                </div>
            )}
        </div>
        {isStockInsufficient && ( <div className="badge badge-error gap-1 mt-2"><FiAlertTriangle className="w-3 h-3"/> สินค้าไม่พอ</div> )}
      </div>

      {/* +++ START: ส่วนราคา (ขวา) ที่เพิ่มเข้ามาใหม่ +++ */}
      <div className="flex-shrink-0 text-right pr-4">
        {hasDiscount && (
          <p className="text-sm text-base-content/50 line-through">
            {formatPrice(Number(orderProduct.Product_Sale_Price))}1
          </p>
        )}
        <p className="text-base font-semibold">
          {formatPrice(Number(orderProduct.Product_Sale_Cost))}2
        </p>
        <p className="text-xs text-base-content/70">x {orderProduct.Quantity}</p>
        <div className="divider my-0"></div>
        <p className="text-lg font-bold text-primary">
          {formatPrice(orderProduct.Product_Sale_Price * orderProduct.Quantity)}3
        </p>
      </div>
      {/* +++ END: ส่วนราคา (ขวา) ที่เพิ่มเข้ามาใหม่ +++ */}

    </div>
  );
};

export default OrderItemDetail;