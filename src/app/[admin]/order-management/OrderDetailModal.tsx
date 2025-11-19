'use client';

import React, { useEffect, useState } from 'react';
import { FiSave, FiX, FiEdit, FiImage, FiShoppingBag, FiArchive, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { Order, EditOrderFormData, OrderStatus, StatusConfig, SimpleProductDetail, OrderProductDetail } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice } from '@/app/utils/formatters';
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

// --- Sub-Component: RefundSlipUploadModal ---
const RefundSlipUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  onConfirmRefund: (order: Order, imageUrl: string) => void;
  order: Order;
}> = ({ isOpen, onClose, orderId, onConfirmRefund, order }) => {
  const { showAlert } = useAlert();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // ตรวจสอบขนาดและประเภทไฟล์
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB', 'warning');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        showAlert('ไฟล์ต้องเป็นรูปภาพ (JPEG หรือ PNG)', 'warning');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadAndConfirm = async () => {
    if (!file) {
      showAlert('กรุณาเลือกไฟล์สลิปคืนเงิน', 'warning');
      return;
    }
    
    setIsUploading(true);
    try {
      // 1. อัปโหลดไฟล์
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const uploadResponse = await fetch('/api/admin/upload', { 
        method: 'POST', 
        body: uploadFormData 
      });
      
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.message || 'Image upload failed');
      }
      
      const imageUrl = uploadResult.imageUrl;

      // 2. เรียกฟังก์ชันยืนยันคืนเงิน (ส่ง URL ไปด้วย)
      onConfirmRefund(order, imageUrl);
      setFile(null); // เคลียร์ไฟล์หลังอัปโหลดสำเร็จ
      onClose(); // ปิด Modal นี้

    } catch (e: any) {
      showAlert(e?.message ?? "อัปโหลดไม่สำเร็จ", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open z-[60]">
      <div className="modal-box">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        <h3 className="font-bold text-lg">อัปโหลดสลิปคืนเงินสำหรับ #{orderId}</h3>
        <p className="py-2 text-sm">กรุณาอัปโหลดสลิปหลักฐานการโอนเงินคืนให้ลูกค้า</p>
        
        <div className="form-control w-full mt-4">
          <input 
            type="file" 
            className="file-input file-input-bordered w-full" 
            accept="image/jpeg,image/png"
            onChange={handleFileChange} 
          />
          {file && <span className="text-xs mt-2">ไฟล์ที่เลือก: {file.name}</span>}
        </div>
        
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isUploading}>ยกเลิก</button>
          <button 
            className="btn btn-info" 
            onClick={handleUploadAndConfirm} 
            disabled={!file || isUploading}
          >
            {isUploading ? <span className="loading loading-spinner"/> : 'อัปโหลดและยืนยัน'}
          </button>
        </div>
      </div>
    </dialog>
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
  onInitiateRefund: (order: Order, reason: string) => void;
  onConfirmRefund: (order: Order, imageUrl: string) => void;
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
  
  // State สำหรับ Modal ยกเลิก
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // State สำหรับ Modal คืนเงิน
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

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
      // เคลียร์เหตุผลเมื่อเปิด Modal ใหม่ (หรือใช้เหตุผลเดิมที่มี)
      setCancellationReason(order.Cancellation_Reason || '');
    }
  }, [order, isOpen]); // เพิ่ม isOpen เพื่อให้ reset ค่าตอนเปิดใหม่

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // --- Logic บันทึกการแก้ไข (Tracking, Status, etc.) ---
  const handleSave = async () => {
    if (!order) return;
    const payload: Partial<Order> = { Order_ID: order.Order_ID, Tracking_ID: formData.trackingId || null, Shipping_Carrier: formData.shippingCarrier || null, DeliveryDate: formData.deliveryDate || null, Status: formData.status };
    showAlert(`ยืนยันการบันทึกสำหรับออเดอร์ #${order.Order_ID}?`, 'info', 'ยืนยัน', async () => {
      const success = await onSave(payload);
      if (success && payload.Status){
        toggleEditMode(); // ปิดโหมดแก้ไข
        // อัปเดต formData ใน state ทันที (เผื่อผู้ใช้เปิดดูอีกครั้ง)
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

  // --- Logic ตอนกดยืนยันใน Modal ยกเลิก ---
  const handleConfirmCancellation = async () => {
      if (!order) return;

      // 1. ตรวจสอบเหตุผล
      if (!cancellationReason.trim()) {
        showAlert('กรุณากรอก เหตุผลการยกเลิก', 'error');
        return; // ไม่ทำงานต่อถ้าไม่มีเหตุผล
      }

      // 2. ตรวจสอบสลิป
      if (order.Transfer_Slip_Image_URL) {
          // 2a. ถ้ามีสลิป: ไปสถานะ 'refunding'
          onInitiateRefund(order, cancellationReason);
          onClose(); // ปิด Modal หลัก
      } else {
          // 2b. ถ้าไม่มีสลิป: ไปสถานะ 'cancelled'
          const success = await onCancelOrder(order.Order_ID, cancellationReason);
          if (success) {
              setIsCancelModalOpen(false); // ปิด Modal ย่อย
              // onClose(); // ปิด Modal หลัก
          }
      }
      setCancellationReason(''); // เคลียร์เหตุผล
  };

  useEffect(() => {
    console.log(order, isOpen)
  },[])

  if (!isOpen || !order) return null;

  return (
    <>
      <dialog className="modal modal-open z-50">
        <div className="modal-box w-11/12 max-w-3xl">
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
          <h3 className="font-bold text-lg mb-4">{isEditing ? `แก้ไขคำสั่งซื้อ #${order.Order_ID}` : `รายละเอียดคำสั่งซื้อ #${order.Order_ID}`}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><h4 className="font-semibold mb-2">ข้อมูลลูกค้า</h4><div className="bg-base-200 rounded-lg p-4 space-y-1 text-sm"><p><strong>ชื่อ:</strong> {order.Customer_Name}</p><p><strong>อีเมล:</strong> {order.Email || '-'}</p><p><strong>ที่อยู่:</strong> {order.Address_1} {order.Address_2} {order.Sub_District} {order.District} {order.Province} {order.Zip_Code}</p></div></div>
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
                  <p><strong>วันที่ส่ง:</strong> {order.DeliveryDate}</p>
                  <p><strong>สถานะ:</strong> <span className={`badge ${statusConfig[order.Status]?.color}`}>{statusConfig[order.Status]?.label}</span></p>
                  <p><strong>จัดการโดย:</strong> {order.Action.Update_Name}</p>
                  <p><strong>เมื่อเวลา:</strong> {order.Action.Update_Date}</p>
                  {
                    (order.Status === 'cancelled' || order.Status === 'refunding' || order.Status === 'refunded') && 
                    <p><strong>เหตุผล:</strong> {order.Cancellation_Reason || '-'}</p>
                  }
                  </>
                )}
              </div></div>
          </div>
          
          <div className="mt-6"><h4 className="font-semibold mb-2">หลักฐานการโอนเงิน (จากลูกค้า)</h4><div className="bg-base-200 rounded-lg p-4 flex justify-center items-center min-h-[10rem] overflow-hidden">{order.Transfer_Slip_Image_URL ? <img src={order.Transfer_Slip_Image_URL} alt={`สลิปของ #${order.Order_ID}`} className="max-w-full max-h-64 object-contain" /> : <p className="text-base-content/70">ยังไม่มีหลักฐานการโอนเงิน</p>}</div></div>
          
          {/* แสดงสลิปคืนเงิน (ถ้ามี) */}
          {order.Return_Slip_Image_URL && !isEditing && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">หลักฐานการคืนเงิน (จากแอดมิน)</h4>
              <div className="bg-base-200 rounded-lg p-4 flex justify-center items-center min-h-[10rem] overflow-hidden">
                <img src={order.Return_Slip_Image_URL} alt={`สลิปคืนเงิน #${order.Order_ID}`} className="max-w-full max-h-64 object-contain" />
              </div>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-semibold mb-2">รายการสินค้า</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {isFetchingDetails ? (<div className="text-center p-4"><span className="loading loading-dots loading-md"></span><p>กำลังโหลด...</p></div>) : (order.Products.map((p, idx) => (<OrderItemDetail key={idx} orderProduct={p} liveProduct={liveProductDetails.get(p.Product_ID!)}/>)))}
            </div>
            <div className="divider mt-2 mb-1"></div>
            <div className="flex justify-between items-center pr-4"><h4 className="text-base font-bold">ยอดรวมทั้งสิ้น</h4><p className="text-xl font-bold text-primary">{formatPrice(order.Total_Amount)}</p></div>
          </div>

          {/* === ส่วนแสดงปุ่มตามสถานะ === */}

          {/* สถานะ: รอดำเนินการคืนเงิน */}
          {order.Status === 'refunding' && !isEditing && (
            <div className="mt-4 p-4 border border-info rounded-lg bg-info/10 text-center">
              <h4 className="font-bold text-info">สถานะ: กำลังรอคืนเงิน</h4>
              <p className="text-xs mt-1">กรุณาโอนเงินคืนและกดยืนยัน</p>
              <button 
                className='btn btn-info btn-sm mt-3' 
                onClick={() => setIsRefundModalOpen(true)} // <--- เปิด Modal อัปโหลด
              >
                <FiCheckCircle className="mr-2"/> ยืนยันการคืนเงิน (อัปโหลดสลิป)
              </button>
            </div>
          )}

          {/* สถานะ: คืนเงินสำเร็จ */}
          {order.Status === 'refunded' && !isEditing && (
            <div className="mt-4 p-4 border border-success rounded-lg bg-success/10 text-center">
              <h4 className="font-bold text-success">สถานะ: คืนเงินสำเร็จ</h4>
              <p className="text-xs mt-1">ระบบบันทึกการคืนเงินเรียบร้อยแล้ว</p>
            </div>
          )}
          
          {/* โหมดแก้ไข: แสดงปุ่มยกเลิก */}
          {isEditing && !['cancelled', 'refunded', 'refunding'].includes(order.Status) && (
            <div className="mt-4 p-4 border border-error rounded-lg bg-error/10">
              <h4 className="font-bold text-error">ยกเลิกคำสั่งซื้อ</h4>
              <p className="text-xs mt-1">ระบบจะตรวจสอบสลิปและดำเนินการตามขั้นตอนที่เหมาะสม</p>
              <button 
                className='btn btn-error btn-sm mt-3' 
                onClick={() => setIsCancelModalOpen(true)} // <--- เปิด Modal ยกเลิก
              >
                ดำเนินการยกเลิก
              </button>
            </div>
          )}

          {/* === ปุ่มหลัก (ปิด/แก้ไข/บันทึก) === */}
          <div className="modal-action">
            {isEditing ? (
              <>
                <button className="btn btn-ghost" onClick={toggleEditMode}><FiX /> ยกเลิก</button>
                <button className="btn btn-primary" onClick={handleSave}><FiSave /> บันทึก</button>
              </>
            ) : (
              <>
                <button className="btn" onClick={onClose}>ปิด</button>
                <button 
                  className="btn btn-primary" 
                  onClick={toggleEditMode} 
                  // ปิดปุ่มแก้ไข ถ้าออเดอร์ถูกยกเลิก/คืนเงินไปแล้ว
                  disabled={['cancelled', 'refunding', 'refunded'].includes(order.Status)}
                >
                  <FiEdit /> แก้ไข
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>

      {/* === Modal ย่อย (ทำงานอยู่เบื้องหลัง) === */}

      {/* Modal ยืนยันการยกเลิก (มี Textbox) */}
      <dialog className={`modal ${isCancelModalOpen ? 'modal-open' : ''} z-[60]`}>
        <div className="modal-box">
          <div className="text-center">
            <FiAlertTriangle className="mx-auto h-12 w-12 text-error" />
            <h3 className="font-bold text-lg mt-4">ยืนยันการยกเลิกคำสั่งซื้อ #{order.Order_ID}</h3>
          </div>
          <div className="form-control w-full mt-4">
            <label className="label"><span className="label-text">กรุณาระบุเหตุผล (จำเป็น):</span></label>
            <textarea 
              className="textarea textarea-bordered h-24" 
              placeholder="เช่น ลูกค้าแจ้งยกเลิก, สินค้าหมด..." 
              value={cancellationReason} 
              onChange={(e) => setCancellationReason(e.target.value)}
            ></textarea>
          </div>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setIsCancelModalOpen(false)}>ปิด</button>
            <button 
              className="btn btn-error" 
              onClick={handleConfirmCancellation}
              disabled={!cancellationReason.trim()} // ปิดปุ่มถ้ายังไม่กรอก
            >
              ยืนยันการยกเลิกออเดอร์
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal อัปโหลดสลิปคืนเงิน */}
      {order && ( // ตรวจสอบว่ามี order ก่อน render
        <RefundSlipUploadModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          orderId={order.Order_ID}
          order={order}
          onConfirmRefund={onConfirmRefund}
        />
      )}
    </>
  );
};

export default OrderDetailModal;