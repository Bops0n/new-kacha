'use client';

import React, { useEffect, useState } from 'react';
import { FiSave, FiX, FiEdit, FiImage, FiShoppingBag, FiArchive, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { Order, EditOrderFormData, OrderStatus, StatusConfig, SimpleProductDetail, OrderProductDetail } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice, formatDate } from '@/app/utils/formatters';
import { calculateAvailableStock } from '@/app/utils/calculations';

// --- Sub-Component: OrderItemDetail ---
const OrderItemDetail: React.FC<{ orderProduct: OrderProductDetail; liveProduct?: SimpleProductDetail; }> = ({ orderProduct, liveProduct }) => {
  const name = liveProduct?.Name || orderProduct.Product_Name;
  const imageUrl = liveProduct?.Image_URL || orderProduct.Product_Image_URL;
  const availableStock = calculateAvailableStock(liveProduct);
  const isStockInsufficient = typeof availableStock !== 'undefined' && availableStock < orderProduct.Quantity;
  const hasDiscount = orderProduct.Product_Discount_Price !== null && orderProduct.Product_Discount_Price < orderProduct.Product_Sale_Price;
  const pricePaidPerItem = orderProduct.Product_Discount_Price ?? orderProduct.Product_Sale_Price;
  const subtotal = pricePaidPerItem * orderProduct.Quantity;

  return (
    <div className="card card-side bg-base-200 shadow-sm w-full items-center p-2">
      <figure className="pl-2 flex-shrink-0"><div className="avatar w-20 h-20"><div className="w-20 rounded-lg bg-base-100 flex items-center justify-center">{imageUrl ? <img src={imageUrl} alt={name} className="w-full h-full object-contain" /> : <FiImage className="w-10 h-10 text-base-content/30" />}</div></div></figure>
      <div className="card-body p-3 flex-grow"><h2 className="card-title text-base font-bold" title={name}>{name}</h2><div className="text-sm space-y-1 mt-1"><div className="flex items-center gap-2"><FiShoppingBag /><span>สั่ง: <span className="font-bold text-primary">{orderProduct.Quantity}</span> {orderProduct.Product_Unit}</span></div>{typeof availableStock !== 'undefined' && (<div className={`flex items-center gap-2 ${isStockInsufficient ? 'text-error' : 'text-success'}`}><FiArchive/><span>คลัง: <span className="font-bold">{availableStock}</span> ชิ้น</span></div>)}</div>{isStockInsufficient && (<div className="badge badge-error gap-1 mt-2"><FiAlertTriangle /> สินค้าไม่พอ</div>)}</div>
      <div className="flex-shrink-0 text-right pr-4 w-32">{hasDiscount && (<p className="text-xs text-base-content/50 line-through">{formatPrice(orderProduct.Product_Sale_Price)}</p>)}<p className="text-sm font-semibold">{formatPrice(pricePaidPerItem)}</p><p className="text-xs">x {orderProduct.Quantity}</p><div className="divider my-0"></div><p className="text-base font-bold text-primary">{formatPrice(subtotal)}</p></div>
    </div>
  );
};

// --- Sub-Component: CancellationModal ---
const CancellationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void; orderId: number; }> = ({ isOpen, onClose, onConfirm, orderId }) => {
    const [reason, setReason] = useState('');
    if (!isOpen) return null;
    return (
        <div className="modal modal-open flex justify-center items-center z-[60]"><div className="modal-box"><div className="text-center"><FiAlertTriangle className="mx-auto h-12 w-12 text-error" /><h3 className="font-bold text-lg mt-4">ยืนยันการยกเลิกคำสั่งซื้อ #{orderId}</h3></div><div className="form-control w-full mt-4"><label className="label"><span className="label-text">กรุณาระบุเหตุผล (จำเป็น):</span></label><textarea className="textarea textarea-bordered h-24" placeholder="เช่น ลูกค้าแจ้งยกเลิก, สินค้าหมด..." value={reason} onChange={(e) => setReason(e.target.value)}></textarea></div><div className="modal-action"><button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn btn-error" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>ยืนยันการยกเลิกออเดอร์</button></div></div></div>
    );
};

// --- Main Modal Component ---
interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isEditing: boolean;
  toggleEditMode: () => void;
  onSave: (payload: Partial<Order>) => Promise<boolean>;
  onCancelOrder: (orderId: number, reason: string) => Promise<boolean>;
  onInitiateRefund: (order: Order) => void;
  onConfirmRefund: (order: Order) => void;
  statusConfig: StatusConfig;
  liveProductDetails: Map<number, SimpleProductDetail>;
  isFetchingDetails: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen, onClose, order, isEditing, toggleEditMode, onSave, onCancelOrder, onInitiateRefund, onConfirmRefund, statusConfig,
  liveProductDetails, isFetchingDetails
}) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState<EditOrderFormData>({ trackingId: '', shippingCarrier: '', deliveryDate: '', status: 'pending', transferSlipImageUrl: '', cancellationReason: '' });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!order) return;
    const payload: Partial<Order> = { Order_ID: order.Order_ID, Tracking_ID: formData.trackingId || null, Shipping_Carrier: formData.shippingCarrier || null, DeliveryDate: formData.deliveryDate || null, Status: formData.status };
    showAlert(`ยืนยันการบันทึกสำหรับออเดอร์ #${order.Order_ID}?`, 'info', 'ยืนยัน', async () => {
      const success = await onSave(payload);
      if (success && payload.Status){
        toggleEditMode();
        setFormData({
          ...formData,
          trackingId: payload.Tracking_ID || '',
          shippingCarrier: payload.Shipping_Carrier || '',
          deliveryDate: payload.DeliveryDate ? payload.DeliveryDate.split('T')[0] : '',
          status: payload.Status,
        })
        showAlert('บันทึกสำเร็จ!', 'success');
      } 
      
    });
  };

  const handleCancellation = () => {
      if (!order) return;
      if (order.Transfer_Slip_Image_URL) {
          onInitiateRefund(order);
          onClose();
      } else {
          setIsCancelModalOpen(true);
      }
  };

  const handleConfirmCancellation = async (reason: string) => {
    if (!order) return;
    const success = await onCancelOrder(order.Order_ID, reason);
    if (success) {
        setIsCancelModalOpen(false);
        onClose();
    }
  };

  if (!isOpen || !order) return null;

  return (
    <>
      <dialog className="modal modal-open z-50">
        <div className="modal-box w-11/12 max-w-3xl">
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
          <h3 className="font-bold text-lg mb-4">{isEditing ? `แก้ไขคำสั่งซื้อ #${order.Order_ID}` : `รายละเอียดคำสั่งซื้อ #${order.Order_ID}`}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><h4 className="font-semibold mb-2">ข้อมูลลูกค้า</h4><div className="bg-base-200 rounded-lg p-4 space-y-1 text-sm"><p><strong>ชื่อ:</strong> {order.Customer_Name}</p><p><strong>อีเมล:</strong> {order.Email || '-'}</p><p><strong>ที่อยู่:</strong> {order.Address}</p></div></div>
            <div><h4 className="font-semibold mb-2">ข้อมูลคำสั่งซื้อ</h4><div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
                {isEditing ? (
                  <>
                    <div><label className="label-text text-xs">Tracking ID</label><input type="text" name="trackingId" value={formData.trackingId} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                    <div><label className="label-text text-xs">บริษัทขนส่ง</label><input type="text" name="shippingCarrier" value={formData.shippingCarrier} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                    <div><label className="label-text text-xs">วันที่ส่ง</label><input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="input input-bordered w-full input-sm" /></div>
                    <div><label className="label-text text-xs">สถานะ</label><select name="status" value={formData.status} onChange={handleChange} className="select select-bordered w-full select-sm">{Object.keys(statusConfig).map(key => !['cancelled', 'refunding', 'refunded'].includes(key) && (<option key={key} value={key}>{statusConfig[key as OrderStatus].label}</option>))}</select></div>
                  </>
                ) : (
                  <>
                  <p><strong>Tracking ID:</strong> {order.Tracking_ID || '-'}</p>
                  <p><strong>บริษัทขนส่ง:</strong> {order.Shipping_Carrier || '-'}</p>
                  <p><strong>วันที่ส่ง:</strong> {formatDate(order.DeliveryDate)}</p>
                  <p><strong>สถานะ:</strong> <span className={`badge ${statusConfig[order.Status]?.color}`}>{statusConfig[order.Status]?.label}</span></p>
                  <p><strong>จัดการโดย:</strong> {order.Action.Update_Name}</p>
                  <p><strong>เมื่อเวลา:</strong> {order.Action.Update_Date}</p>
                  {
                    order.Status === 'cancelled' && <p><strong>เหตุผล:</strong> {order.Cancellation_Reason || '-'}</p>
                  }
                  </>
                )}
              </div></div>
          </div>
          
          <div className="mt-6"><h4 className="font-semibold mb-2">หลักฐานการโอนเงิน</h4><div className="bg-base-200 rounded-lg p-4 flex justify-center items-center min-h-[10rem] overflow-hidden">{order.Transfer_Slip_Image_URL ? <img src={order.Transfer_Slip_Image_URL} alt={`สลิปของ #${order.Order_ID}`} className="max-w-full max-h-64 object-contain" /> : <p className="text-base-content/70">ยังไม่มีหลักฐานการโอนเงิน</p>}</div></div>
          
          <div className="mt-6">
            <h4 className="font-semibold mb-2">รายการสินค้า</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {isFetchingDetails ? (<div className="text-center p-4"><span className="loading loading-dots loading-md"></span><p>กำลังโหลด...</p></div>) : (order.Products.map((p, idx) => (<OrderItemDetail key={idx} orderProduct={p} liveProduct={liveProductDetails.get(p.Product_ID!)}/>)))}
            </div>
            <div className="divider mt-2 mb-1"></div>
            <div className="flex justify-between items-center pr-4"><h4 className="text-base font-bold">ยอดรวมทั้งสิ้น</h4><p className="text-xl font-bold text-primary">{formatPrice(order.Total_Amount)}</p></div>
          </div>

          {order.Status === 'refunding' && !isEditing && (<div className="mt-4 p-4 border border-info rounded-lg bg-info/10 text-center"><h4 className="font-bold text-info">สถานะ: กำลังรอคืนเงิน</h4><p className="text-xs mt-1">กรุณาโอนเงินคืนและกดยืนยัน</p><button className='btn btn-info btn-sm mt-3' onClick={() => onConfirmRefund(order)}><FiCheckCircle className="mr-2"/> ยืนยันการคืนเงินแล้ว</button></div>)}
          {order.Status === 'refunded' && !isEditing && (<div className="mt-4 p-4 border border-success rounded-lg bg-success/10 text-center"><h4 className="font-bold text-success">สถานะ: คืนเงินสำเร็จ</h4><p className="text-xs mt-1">ระบบบันทึกการคืนเงินเรียบร้อยแล้ว</p></div>)}
          {isEditing && !['cancelled', 'refunded', 'refunding'].includes(order.Status) && (<div className="mt-4 p-4 border border-error rounded-lg bg-error/10"><h4 className="font-bold text-error">ยกเลิกคำสั่งซื้อ</h4><p className="text-xs mt-1">ระบบจะตรวจสอบสลิปและดำเนินการตามขั้นตอนที่เหมาะสม</p><button className='btn btn-error btn-sm mt-3' onClick={handleCancellation}>ดำเนินการยกเลิก</button></div>)}

          <div className="modal-action">
            {isEditing ? (<><button className="btn btn-ghost" onClick={toggleEditMode}><FiX /> ยกเลิก</button><button className="btn btn-primary" onClick={handleSave}><FiSave /> บันทึก</button></>) : (<><button className="btn" onClick={onClose}>ปิด</button><button className="btn btn-primary" onClick={toggleEditMode} disabled={!['pending', 'processing', 'shipped'].includes(order.Status)}><FiEdit /> แก้ไข</button></>)}
          </div>
        </div>
      </dialog>
      <CancellationModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancellation} orderId={order.Order_ID} />
    </>
  );
};

export default OrderDetailModal;