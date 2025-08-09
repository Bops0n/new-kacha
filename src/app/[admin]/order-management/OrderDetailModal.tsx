'use client';

import React, { useEffect, useState } from 'react';
import { FiSave, FiX, FiEdit, FiImage, FiShoppingBag, FiArchive, FiAlertTriangle } from 'react-icons/fi';
import { Order, EditOrderFormData, OrderStatus, StatusConfig, SimpleProductDetail, OrderProductDetail } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice, formatDate } from '@/app/utils/formatters';
import OrderItemDetail from './OrderItemDetail';

// --- Sub-Component for displaying each item ---
// Component ย่อยสำหรับแสดงรายละเอียดสินค้าแต่ละชิ้นในออเดอร์
interface OrderItemDetailProps {
  orderProduct: OrderProductDetail;
  liveProduct?: SimpleProductDetail;
}



// --- Main Modal Component ---
interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isEditing: boolean;
  toggleEditMode: () => void;
  onSave: (payload: Partial<Order>) => Promise<boolean>;
  statusConfig: StatusConfig;
  liveProductDetails: Map<number, SimpleProductDetail>;
  isFetchingDetails: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen, onClose, order, isEditing, toggleEditMode, onSave, statusConfig,
  liveProductDetails, isFetchingDetails
}) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<EditOrderFormData>({
    trackingId: '', shippingCarrier: '', deliveryDate: '', status: 'pending',
    transferSlipImageUrl: '', cancellationReason: '',
  });

  useEffect(() => {
    console.log(order?.Products)
    if (order) {
      setFormData({
        trackingId: order.Tracking_ID || '',
        shippingCarrier: order.Shipping_Carrier || '',
        deliveryDate: order.DeliveryDate ? order.DeliveryDate.split('T')[0] : '',
        status: order.Status,
        transferSlipImageUrl: order.Transfer_Slip_Image_URL || '',
        cancellationReason: order.Cancellation_Reason || '',
      });
    }
  }, [order]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!order) return;

    if (formData.status === 'cancelled' && !formData.cancellationReason.trim()) {
      showAlert('กรุณาระบุเหตุผลในการยกเลิกคำสั่งซื้อ', 'warning', 'ข้อมูลไม่ครบถ้วน');
      return;
    }

    const payload: Partial<Order> = {
      Order_ID: order.Order_ID,
      Tracking_ID: formData.trackingId || null,
      Shipping_Carrier: formData.shippingCarrier || null,
      DeliveryDate: formData.deliveryDate || null,
      Status: formData.status,
      Transfer_Slip_Image_URL: formData.transferSlipImageUrl || null,
      Cancellation_Reason: formData.status === 'cancelled' ? formData.cancellationReason.trim() : null,
    };
    
    showAlert(`ยืนยันการบันทึกสำหรับออเดอร์ #${order.Order_ID}?`, 'info', 'ยืนยัน', async () => {
      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    });
  };

  if (!isOpen || !order) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
        <h3 className="font-bold text-lg mb-4">
          {isEditing ? `แก้ไขคำสั่งซื้อ #${order.Order_ID}` : `รายละเอียดคำสั่งซื้อ #${order.Order_ID}`}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">ข้อมูลลูกค้า</h4>
            <div className="bg-base-200 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>ชื่อ:</strong> {order.Customer_Name}</p>
              <p><strong>อีเมล:</strong> {order.Email || '-'}</p>
              <p><strong>ที่อยู่:</strong> {order.Address}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">ข้อมูลคำสั่งซื้อ</h4>
            <div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
              {isEditing ? (
                <>
                  <div><label className="label-text text-xs">Tracking ID</label><input type="text" name="trackingId" value={formData.trackingId} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                  <div><label className="label-text text-xs">บริษัทขนส่ง</label><input type="text" name="shippingCarrier" value={formData.shippingCarrier} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                  <div><label className="label-text text-xs">วันที่ส่ง</label><input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                  <div><label className="label-text text-xs">สถานะ</label><select name="status" value={formData.status} onChange={handleChange} className="select select-bordered w-full select-sm">{Object.keys(statusConfig).map(key => <option key={key} value={key}>{statusConfig[key as OrderStatus].label}</option>)}</select></div>
                  {formData.status === 'cancelled' && <div className="mt-1"><label className="label-text text-xs">เหตุผลการยกเลิก (จำเป็น)</label><textarea name="cancellationReason" value={formData.cancellationReason} onChange={handleChange} className="textarea textarea-bordered w-full" placeholder="ระบุเหตุผลที่นี่..."></textarea></div>}
                </>
              ) : (
                <>
                  <p><strong>Tracking ID:</strong> {order.Tracking_ID || '-'}</p>
                  <p><strong>บริษัทขนส่ง:</strong> {order.Shipping_Carrier || '-'}</p>
                  <p><strong>วันที่ส่ง:</strong> {formatDate(order.DeliveryDate)}</p>
                  <p><strong>สถานะ:</strong> <span className={`badge ${statusConfig[order.Status]?.color}`}>{statusConfig[order.Status]?.label}</span></p>
                  {order.Status === 'cancelled' && <p><strong>เหตุผล:</strong> {order.Cancellation_Reason || '-'}</p>}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold mb-2">หลักฐานการโอนเงิน</h4>
          <div className="bg-base-200 rounded-lg p-4 flex justify-center items-center min-h-[10rem] overflow-hidden">
            {order.Transfer_Slip_Image_URL ? (
              <img src={order.Transfer_Slip_Image_URL} alt={`สลิปของ #${order.Order_ID}`} className="max-w-full max-h-64 object-contain" />
            ) : (
              <p className="text-base-content/70">ยังไม่มีหลักฐานการโอนเงิน</p>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-semibold mb-2">รายการสินค้า</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {isFetchingDetails ? (
              <div className="text-center p-4"><span className="loading loading-dots loading-md"></span><p>กำลังโหลดข้อมูลล่าสุด...</p></div>
            ) : (
              order.Products.map((p, idx) => (
                <OrderItemDetail
                  key={idx}
                  orderProduct={p}
                  liveProduct={liveProductDetails.get(p.Product_ID!)}
                />
              ))
            )}
          </div>
          <div className="divider mt-2 mb-1"></div>
          <div className="flex justify-between items-center pr-4">
            <h4 className="text-base font-bold">ยอดรวมทั้งสิ้น</h4>
            <p className="text-xl font-bold text-primary">{formatPrice(order.Total_Amount)}</p>
          </div>
        </div>

        <div className="modal-action">
          {isEditing ? (
            <>
              <button className="btn btn-ghost" onClick={toggleEditMode}><FiX /> ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave}><FiSave /> บันทึก</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={onClose}>ปิด</button>
              <button className="btn btn-primary" onClick={toggleEditMode} disabled={order.Status === 'cancelled'}><FiEdit /> แก้ไข</button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default OrderDetailModal;