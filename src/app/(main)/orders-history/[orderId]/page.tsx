'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, FiDollarSign, 
  FiRefreshCw, FiTrash2
} from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';

// --- UI Configuration ---
const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; } } = {
  waiting_payment: { label: 'รอชำระเงิน', color: 'badge-warning', icon: FiClock, bgColor: 'bg-warning/10' },
  pending: { label: 'รอดำเนินการ', color: 'badge-warning', icon: FiClock, bgColor: 'bg-warning/10' },
  processing: { label: 'กำลังเตรียม', color: 'badge-info', icon: FiPackage, bgColor: 'bg-info/10' },
  shipped: { label: 'จัดส่งแล้ว', color: 'badge-primary', icon: FiTruck, bgColor: 'bg-primary/10' },
  delivered: { label: 'ส่งเรียบร้อย', color: 'badge-success', icon: FiCheckCircle, bgColor: 'bg-success/10' },
  refunding: { label: 'ยกเลิก: กำลังรอคืนเงิน', color: 'badge-accent', icon: FiRefreshCw, bgColor: 'bg-accent/10' },
  refunded: { label: 'ยกเลิก: คืนเงินสำเร็จ', color: 'badge-neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10' },
  cancelled: { label: 'ยกเลิก', color: 'badge-error', icon: FiXCircle, bgColor: 'bg-error/10' },
};

// --- StepIndicator (ดีไซน์วงกลม + เส้น) ---
const OrderStepIndicator = ({ order, statusConfig }: { order: Order, statusConfig: StatusConfig }) => {
  const currentStatus = order.Status;
  const happyPath: OrderStatus[] = (order.Payment_Type === 'bank_transfer')
    ? ['waiting_payment', 'pending', 'processing', 'shipped', 'delivered']
    : ['pending', 'processing', 'shipped', 'delivered'];
  const refundPath: OrderStatus[] = ['refunding', 'refunded'];
  const happyStepIndex = happyPath.indexOf(currentStatus);

  if (happyStepIndex > -1) {
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-6 text-center">
        {happyPath.map((step, index) => {
          const statusInfo = statusConfig[step];
          if (!statusInfo) return null; 
          const isComplete = index < happyStepIndex;
          const isCurrent = index === happyStepIndex;
          const circleClasses = `flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${isCurrent ? 'border-primary bg-primary text-primary-content shadow-md' : isComplete ? 'border-success bg-success text-success-content' : 'border-base-300 bg-base-100 text-base-content/60'}`;
          const iconComponent = statusInfo.icon; 
          return (
            <li key={step} className={`step ${isComplete || isCurrent ? 'step-primary' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={circleClasses}>{React.createElement(iconComponent, { className: 'w-5 h-5' })}</div>
                <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">{statusInfo.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  // Refund Path
  const refundStepIndex = refundPath.indexOf(currentStatus);
  if (refundStepIndex > -1) {
    const refundComplete = refundStepIndex >= 0;
    const refundedComplete = refundStepIndex >= 1;
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-6 max-w-md mx-auto text-center">
        <li className={`step ${refundComplete ? 'step-accent' : ''}`}>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${refundComplete ? 'border-accent bg-accent text-accent-content shadow-md' : 'border-base-300 bg-base-100 text-base-content/60'}`}>{React.createElement(statusConfig.refunding.icon, { className: 'w-5 h-5' })}</div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">{statusConfig.refunding.label}</span>
          </div>
        </li>
        <li className={`step ${refundedComplete ? 'step-neutral' : ''}`}>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${refundedComplete ? 'border-neutral bg-neutral text-neutral-content shadow-md' : 'border-base-300 bg-base-100 text-base-content/60'}`}>{React.createElement(statusConfig.refunded.icon, { className: 'w-5 h-5' })}</div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">{statusConfig.refunded.label}</span>
          </div>
        </li>
      </ul>
    );
  }

  // Cancelled Path
  if (currentStatus === 'cancelled') {
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-6 max-w-md mx-auto text-center">
        <li className="step step-primary">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 border-primary bg-primary text-primary-content shadow-md`}> {React.createElement(FiShoppingCart, { className: 'w-5 h-5' })}</div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">สั่งสินค้า</span>
          </div>
        </li>
        <li className="step step-error">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 border-error bg-error text-error-content shadow-md`}> {React.createElement(statusConfig.cancelled.icon, { className: 'w-5 h-5' })}</div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">{statusConfig.cancelled.label}</span>
          </div>
        </li>
      </ul>
    );
  }

  return (
    <div className="text-center p-4">
      <span className={`badge ${statusInfo?.color.replace('bg-', 'badge-')} badge-lg gap-2`}>
        {statusInfo?.icon && React.createElement(statusInfo.icon)}
        {statusInfo?.label || currentStatus}
      </span>
    </div>
  );
};

// --- Main Page Component ---
export default function OrderDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // +++ เพิ่ม State สำหรับการยกเลิก +++
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelSection, setShowCancelSection] = useState(false);

  const orderId = typeof params.orderId === 'string' ? parseInt(params.orderId, 10) : NaN;

  const fetchOrderDetails = useCallback(async () => {
    if (isNaN(orderId)) { setError('รหัสคำสั่งซื้อไม่ถูกต้อง'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/main/orders/${orderId}`);
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้'); }
      const data = await response.json();
      setOrder(data.order);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setSelectedFile(null); showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB', 'warning'); return }
      if (!['image/jpeg', 'image/png'].includes(file.type)) { setSelectedFile(null); showAlert('ไฟล์ต้องเป็นรูปภาพ (JPEG หรือ PNG)', 'warning'); return }
      setSelectedFile(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!order || !selectedFile) { showAlert('กรุณาเลือกไฟล์สลิปก่อน', 'warning'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('transferSlip', selectedFile);
      const response = await fetch(`/api/main/orders/${order.Order_ID}`, { method: 'PATCH', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'ไม่สามารถอัปโหลดสลิปได้');
      await fetchOrderDetails();
      setSelectedFile(null);
      showAlert('อัปโหลดสลิปสำเร็จ!', 'success');
    } catch (err: any) { showAlert(err.message, 'error'); } finally { setIsUploading(false); }
  };

  // +++ ฟังก์ชันยกเลิกคำสั่งซื้อ +++
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { showAlert('กรุณาระบุเหตุผลในการยกเลิก', 'warning'); return; }
    
    showAlert(`ยืนยันการยกเลิกออเดอร์ #${orderId} หรือไม่?`, 'warning', 'ยืนยันการยกเลิก', async () => {
      setIsCancelling(true);
      try {
        const response = await fetch(`/api/main/orders/${orderId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: cancelReason }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        await fetchOrderDetails(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะ
        setShowCancelSection(false); // ปิดส่วนยกเลิก
        showAlert('ยกเลิกคำสั่งซื้อสำเร็จ', 'success');
      } catch (err: any) {
        showAlert(err.message, 'error');
      } finally {
        setIsCancelling(false);
      }
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container mx-auto p-4 text-center text-error"><h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1><p>{error}</p><button onClick={() => router.back()} className="btn btn-primary mt-4">กลับ</button></div>;
  if (!order) return <div className="text-center p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;
  if (order.User_ID !== Number(session?.user.id)) return <AccessDeniedPage url="/"/>

  const canUploadSlip = order.Payment_Type === 'bank_transfer' && order.Status === 'waiting_payment';
  // +++ เช็คว่ายกเลิกได้หรือไม่ (เฉพาะสถานะเหล่านี้) +++
  const canCancel = ['waiting_payment', 'pending', 'processing'].includes(order.Status);
  const subtotalBeforeDiscount = order.Products.reduce((sum, product) => sum + (product.Product_Sale_Price * product.Quantity), 0);

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-4 flex-wrap gap-4">
          <button onClick={() => router.back()} className="btn btn-ghost"><FiArrowLeft className="mr-2" /> กลับไปหน้ารายการ</button>
          <h1 className="text-xl md:text-2xl font-bold text-base-content text-right">รายละเอียดคำสั่งซื้อ #{order.Order_ID}</h1>
        </div>

        {/* Step Indicator */}
        <OrderStepIndicator order={order} statusConfig={statusConfig} />

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-200 p-6">
                <h2 className="card-title text-xl mb-4"><FiMapPin className="mr-2"/>ที่อยู่จัดส่ง</h2>
                <div className="space-y-1 text-base-content/90">
                    <p>{order.Address_1} {order.Address_2} {order.Sub_District} {order.District} {order.Province} {order.Zip_Code}</p>
                    <p><strong>โทร:</strong> {order.Phone}</p>
                </div>
            </div>
            <div className="card bg-base-200 p-6">
                <h2 className="card-title text-xl mb-4"><FiTruck className="mr-2"/>ข้อมูลการจัดส่ง</h2>
                <div className="space-y-1 text-base-content/90">
                    <p><strong>ประเภทชำระเงิน:</strong> {order.Payment_Type}</p>
                    <p><strong>บริษัทขนส่ง:</strong> {order.Shipping_Carrier || '-'}</p>
                    <p><strong>Tracking ID:</strong> {order.Tracking_ID || '-'}</p>
                    <p><strong>วันที่จัดส่ง (คาดการณ์):</strong> {order.DeliveryDate ? order.DeliveryDate : '-'}</p>
                </div>
            </div>
        </div>

        {/* Product List */}
        <div className="mt-6">
            <h2 className="text-xl font-bold text-base-content mb-4"><FiShoppingCart className="inline-block mr-2"/>รายการสินค้า</h2>
            <div className="space-y-4">
              {order.Products.map((product, index) => {
                  const hasDiscount = product.Product_Discount_Price !== null && product.Product_Discount_Price < product.Product_Sale_Price;
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-base-200">
                        <img src={product.Product_Image_URL || 'https://placehold.co/100x100?text=No+Image'} alt={product.Product_Name} className="w-20 h-20 object-contain rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="font-semibold">{product.Product_Name} ({product.Product_Brand})</p>
                            <div className="text-sm text-base-content/70">
                                {hasDiscount ? (
                                    <span><span className="line-through">{formatPrice(product.Product_Sale_Price)}</span><span className="text-primary font-bold ml-2">{formatPrice(product.Product_Discount_Price!)}</span></span>
                                ) : (
                                    <span>{formatPrice(product.Product_Sale_Price)}</span>
                                )}
                                <span className="ml-2">x {product.Quantity} {product.Product_Unit}</span>
                            </div>
                        </div>
                        <p className="font-bold text-lg text-primary">{formatPrice(product.Subtotal || 0)}</p>
                    </div>
                  );
              })}
            </div>
        </div>

        {/* Summary */}
        <div className="card bg-base-200 p-6 mt-6">
            <h2 className="card-title text-xl mb-4"><FiDollarSign className="mr-2"/>สรุปยอดคำสั่งซื้อ</h2>
            <div className="space-y-3 text-base-content/90">
                <div className="flex justify-between"><span>ยอดรวม (ก่อนหักส่วนลด):</span><span className="font-semibold">{formatPrice(subtotalBeforeDiscount)}</span></div>
                <div className="flex justify-between text-error"><span>ส่วนลดรวม:</span><span className="font-semibold">- {formatPrice(subtotalBeforeDiscount - order.Total_Amount)}</span></div>
                <div className="flex justify-between"><span>ค่าจัดส่ง:</span><span className="font-semibold text-success">ฟรี</span></div>
            </div>
            <div className="divider my-4"></div>
            <div className="flex justify-between items-center text-xl font-bold"><span>ยอดชำระทั้งหมด:</span><span className="text-primary">{formatPrice(order.Total_Amount)}</span></div>
        </div>
        
        {/* Slip Upload & View Section */}
        {(order.Payment_Type === 'bank_transfer' || (order as any).Return_Slip_Image_URL) && (
          <div className="card bg-base-200 p-4 sm:p-6 mt-6">
            <div role="tablist" className="tabs tabs-bordered">
              <input type="radio" name="payment_tabs" role="tab" className="tab" aria-label="หลักฐานการโอนเงิน" defaultChecked={!(order as any).Return_Slip_Image_URL} />
              <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-b-box p-4 sm:p-6">
                <div className="text-center">
                  {order.Transfer_Slip_Image_URL ? (
                    <img src={order.Transfer_Slip_Image_URL} alt="Transfer Slip" className="max-w-sm h-auto rounded-md shadow-sm mx-auto mb-4" />
                  ) : (
                    <p className="text-base-content/70 mb-4 py-8">{order.Payment_Type === 'bank_transfer' ? 'ยังไม่มีสลิปการโอนเงิน' : 'ไม่จำเป็น (ชำระเงินปลายทาง)'}</p>
                  )}
                </div>
                {canUploadSlip && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 border-t border-base-300 pt-6">
                    <label className='flex flex-col items-center justify-center w-full max-w-xs'>
                      <input type="file" className="file-input file-input-bordered file-input-primary w-full" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                      <span className="text-xs text-base-content/60 mt-2">{'สามารถอัพโหลดไฟล์ขนาดไม่เกิน 5MB เท่านั้น'}</span>
                    </label>
                    <button onClick={handleUploadSlip} disabled={!selectedFile || isUploading} className="btn btn-primary mt-2 sm:mt-0 sm:self-start">
                        {isUploading && <span className="loading loading-spinner"></span>}<FiUploadCloud className="mr-2"/>{isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                    </button>
                  </div>
                )}
              </div>

              {(order as any).Return_Slip_Image_URL && (
                <>
                  <input type="radio" name="payment_tabs" role="tab" className="tab" aria-label="หลักฐานการคืนเงิน" defaultChecked={!!(order as any).Return_Slip_Image_URL} />
                  <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-b-box p-6">
                    <div className="text-center">
                      <img src={(order as any).Return_Slip_Image_URL} alt="Refund Slip" className="max-w-sm h-auto rounded-md shadow-sm mx-auto mb-4" />
                      <p className="text-base-content/70 text-sm">ผู้ดูแลระบบได้ทำการคืนเงินให้ท่านแล้ว</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* +++ 4. ส่วนยกเลิกคำสั่งซื้อ (เพิ่มใหม่) +++ */}
        {canCancel && (
            <div className="mt-8 pt-6 border-t border-base-300">
                {!showCancelSection ? (
                     <div className="flex justify-center sm:justify-end">
                        <button onClick={() => setShowCancelSection(true)} className="btn btn-outline btn-error btn-sm">
                            <FiTrash2 className="mr-2"/> ขอยกเลิกคำสั่งซื้อ
                        </button>
                     </div>
                ) : (
                    <div className="bg-error/10 border border-error rounded-lg p-4 animate-fadeIn">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-error font-bold flex items-center gap-2"><FiTrash2/> ยกเลิกคำสั่งซื้อ</h3>
                            <button onClick={() => setShowCancelSection(false)} className="btn btn-sm btn-circle btn-ghost text-error"><FiXCircle/></button>
                        </div>
                        <div className="form-control w-full">
                            <label className="label"><span className="label-text text-error-content/80">ระบุเหตุผลที่ต้องการยกเลิก (จำเป็น):</span></label>
                            <input 
                                type="text" 
                                className="input input-bordered input-error w-full bg-white" 
                                placeholder="เช่น เปลี่ยนใจ, สั่งผิด, ต้องการเปลี่ยนที่อยู่..." 
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end mt-4 gap-2">
                            <button onClick={() => setShowCancelSection(false)} className="btn btn-ghost btn-sm text-error-content/70" disabled={isCancelling}>ปิด</button>
                            <button onClick={handleCancelOrder} className="btn btn-error btn-sm text-white" disabled={isCancelling || !cancelReason.trim()}>
                                {isCancelling ? <span className="loading loading-spinner loading-xs"></span> : 'ยืนยันการยกเลิก'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
        {/* --- จบส่วนยกเลิก --- */}

      </div>
    </div>
  );
}