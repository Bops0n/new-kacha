'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, FiDollarSign, 
  FiRefreshCw, FiTrash2, FiAlertTriangle, FiFileText, FiInfo
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
  preparing: { label: 'กำลังเตรียม', color: 'badge-info', icon: FiPackage, bgColor: 'bg-info/10' },
  shipped: { label: 'จัดส่งแล้ว', color: 'badge-primary', icon: FiTruck, bgColor: 'bg-primary/10' },
  delivered: { label: 'ส่งเรียบร้อย', color: 'badge-success', icon: FiCheckCircle, bgColor: 'bg-success/10' },
  refunding: { label: 'ยกเลิก: กำลังรอคืนเงิน', color: 'badge-accent', icon: FiRefreshCw, bgColor: 'bg-accent/10' },
  refunded: { label: 'ยกเลิก: คืนเงินสำเร็จ', color: 'badge-neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10' },
  cancelled: { label: 'ยกเลิก', color: 'badge-error', icon: FiXCircle, bgColor: 'bg-error/10' },
  req_cancel: { label: 'ขอยกเลิก', color: 'badge-error', icon: FiFileText, bgColor: 'bg-error/10' },
};

// --- StepIndicator Component ---
const OrderStepIndicator = ({ order, statusConfig }: { order: Order, statusConfig: StatusConfig }) => {
  const currentStatus = order.Status;
  
  const happyPath: OrderStatus[] = (order.Payment_Type === 'bank_transfer')
    ? ['waiting_payment', 'pending', 'preparing', 'shipped', 'delivered']
    : ['pending', 'preparing', 'shipped', 'delivered'];
    
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

  if (currentStatus === 'cancelled' || currentStatus === 'req_cancel') {
    const isReq = currentStatus === 'req_cancel';
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-6 max-w-md mx-auto text-center">
        <li className="step step-primary">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 border-primary bg-primary text-primary-content shadow-md`}> {React.createElement(FiShoppingCart, { className: 'w-5 h-5' })}</div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">สั่งสินค้า</span>
          </div>
        </li>
        <li className={`step ${isReq ? 'step-warning' : 'step-error'}`}>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 ${isReq ? 'border-warning bg-warning text-warning-content' : 'border-error bg-error text-error-content'} shadow-md`}> 
                {React.createElement(statusConfig[currentStatus].icon, { className: 'w-5 h-5' })}
            </div>
            <span className="text-xs sm:text-sm mt-2 font-medium text-base-content/90">{statusConfig[currentStatus].label}</span>
          </div>
        </li>
      </ul>
    );
  }

  return (
    <div className="text-center p-4">
      <span className={`badge ${statusConfig[currentStatus]?.color.replace('bg-', 'badge-') || 'badge-ghost'} badge-lg gap-2`}>
        {statusConfig[currentStatus]?.icon && React.createElement(statusConfig[currentStatus].icon)}
        {statusConfig[currentStatus]?.label || currentStatus}
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

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { return; }
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/main/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      await fetchOrderDetails();
      setIsCancelModalOpen(false);
      showAlert('ดำเนินการสำเร็จ', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // +++ Logic คำนวณสถานะปลายทางสำหรับการยกเลิก +++
  const targetStatusInfo = useMemo(() => {
    if (!order) return null;
    const hasSlip = !!order.Transaction_Slip;
    const isChecked = order.Is_Payment_Checked;

    if (hasSlip && isChecked) {
        return {
            key: 'refunding' as OrderStatus,
            config: statusConfig['refunding'],
            description: 'เนื่องจากมีการยืนยันชำระเงินแล้ว ระบบจะเปลี่ยนสถานะเป็น "รอคืนเงิน" เพื่อให้เจ้าหน้าที่ตรวจสอบและดำเนินการคืนเงิน'
        };
    }
    if (hasSlip && !isChecked) {
        return {
            key: 'req_cancel' as OrderStatus,
            config: statusConfig['req_cancel'],
            description: 'เนื่องจากมีการแนบสลิปแล้วแต่ยังไม่ได้รับการตรวจสอบ ระบบจะเปลี่ยนสถานะเป็น "ขอยกเลิก" เพื่อให้เจ้าหน้าที่รับทราบ'
        };
    }
    return {
        key: 'cancelled' as OrderStatus,
        config: statusConfig['cancelled'],
        description: 'รายการจะถูกเปลี่ยนสถานะเป็น "ยกเลิก" ทันที'
    };
  }, [order]);

  // +++ Logic คำนวณข้อความแจ้งเตือนใน Text Box ด้านล่าง +++
  const orderStatusNote = useMemo(() => {
    if (!order) return null;
    
    const { Status, Payment_Type, Is_Payment_Checked, Transaction_Slip, Transaction_Status } = order;
    
    // 1. Pending + Rejected (สลิปถูกปฏิเสธ) -> ให้แจ้งเตือนและให้แนบใหม่
    console.log(Status, Transaction_Status)
    if (Status === 'waiting_payment' && Transaction_Status === 'rejected') {
        return {
            icon: FiAlertTriangle,
            color: 'text-error',
            bgColor: 'bg-error/10',
            borderColor: 'border-error/20',
            title: 'สลิปการโอนเงินถูกปฏิเสธ',
            message: 'เจ้าหน้าที่ได้ปฏิเสธสลิปการโอนเงินของท่าน กรุณาตรวจสอบความถูกต้องและอัพโหลดหลักฐานการโอนเงินใหม่อีกครั้ง'
        };
    }

    // 2. Pending + มีสลิป (ตรวจสอบสถานะการเช็ค)
    if (Status === 'pending' && Payment_Type === 'bank_transfer' && Transaction_Slip) {
        if (!Is_Payment_Checked) {
            // ยังไม่ตรวจ
            return {
                icon: FiClock,
                color: 'text-warning',
                bgColor: 'bg-warning/10',
                borderColor: 'border-warning/20',
                title: 'มีการอัปโหลดสลิปแล้ว',
                message: 'ระบบได้รับสลิปของท่านแล้ว ทีมงานกำลังตรวจสอบความถูกต้อง (รอเจ้าหน้าที่ตรวจสอบ)'
            };
        } else {
            // ตรวจแล้ว
            return {
                icon: FiCheckCircle,
                color: 'text-success',
                bgColor: 'bg-success/10',
                borderColor: 'border-success/20',
                title: 'สลิปการโอนเงินได้รับการตรวจสอบแล้ว',
                message: 'ข้อมูลการชำระเงินถูกต้อง ทางร้านจะดำเนินการคำสั่งซื้อให้เร็วที่สุด'
            };
        }
    }

    // 3. Waiting Payment (Bank Transfer)
    if (Status === 'waiting_payment' && Payment_Type === 'bank_transfer') {
        return {
            icon: FiInfo,
            color: 'text-info',
            bgColor: 'bg-info/10',
            borderColor: 'border-info/20',
            title: 'รอชำระเงิน',
            message: 'กรุณาชำระเงินและแนบหลักฐานการโอนเงิน เพื่อให้ทางร้านตรวจสอบและดำเนินการต่อ'
        };
    }

    // 4. Refunding
    if (Status === 'refunding') {
        return {
            icon: FiRefreshCw,
            color: 'text-accent', 
            bgColor: 'bg-accent/10',
            borderColor: 'border-accent/20',
            title: 'กำลังดำเนินการคืนเงิน',
            message: 'การชำระเงินถูกตรวจสอบแล้ว เจ้าหน้าที่กำลังดำเนินการคืนเงิน'
        };
    }

    // 5. Refunded
    if (Status === 'refunded') {
        return {
            icon: FiCheckCircle,
            color: 'text-neutral', 
            bgColor: 'bg-neutral/10',
            borderColor: 'border-neutral/20',
            title: 'คืนเงินสำเร็จ',
            message: 'คำสั่งซื้อของคุณได้รับการคืนเงินเรียบร้อยแล้ว'
        };
    }

    // 6. กรณีอื่นๆ
    const config = statusConfig[Status] || statusConfig.pending;
    return {
        icon: config.icon,
        color: config.color.replace('badge-', 'text-'),
        bgColor: config.bgColor,
        borderColor: 'border-base-200',
        title: config.label,
        message: `สถานะปัจจุบัน: ${config.label}`
    };

  }, [order]);


  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container mx-auto p-4 text-center text-error"><h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1><p>{error}</p><button onClick={() => router.back()} className="btn btn-primary mt-4">กลับ</button></div>;
  if (!order) return <div className="text-center p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;
  if (order.User_ID !== Number(session?.user.id)) return <AccessDeniedPage url="/"/>

  const canUploadSlip = order.Payment_Type === 'bank_transfer' && (
    order.Status === 'waiting_payment' || 
    (order.Status === 'pending' && order.Is_Payment_Checked === false)
  );

  const canCancel = ['waiting_payment', 'pending', 'preparing'].includes(order.Status);
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
                    <p><strong>บริษัทขนส่ง:</strong> {order.Shipping_Method || '-'}</p>
                    <p><strong>Tracking ID:</strong> {order.Tracking_Number || '-'}</p>
                    <p><strong>วันที่จัดส่ง (คาดการณ์):</strong> {order.Shipping_Date ? order.Shipping_Date : '-'}</p>
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
        {(order.Payment_Type === 'bank_transfer' || order.Transaction_Slip) && (
          <div className="card bg-base-200 p-4 sm:p-6 mt-6">
            <div role="tablist" className="tabs tabs-bordered">
              <input type="radio" name="payment_tabs" role="tab" className="tab" aria-label="หลักฐานการโอนเงิน" defaultChecked={!order.Refund_Slip} />
              <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-b-box p-4 sm:p-6">
                <div className="text-center">
                  {order.Transaction_Slip ? (
                    <div className="mb-4">
                      <img src={order.Transaction_Slip} alt="Transfer Slip" className="max-w-sm h-auto rounded-md shadow-sm mx-auto" />
                    </div>
                  ) : (
                    <p className="text-base-content/70 mb-4 py-8">{order.Payment_Type === 'bank_transfer' ? 'ยังไม่มีสลิปการโอนเงิน' : 'ไม่จำเป็น (ชำระเงินปลายทาง)'}</p>
                  )}
                </div>
                
                {canUploadSlip && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 border-t border-base-300 pt-6">
                    <label className='flex flex-col items-center justify-center w-full max-w-xs'>
                      <input type="file" className="file-input file-input-bordered file-input-primary w-full" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                      <span className="text-xs text-base-content/60 mt-2">{'สามารถอัพโหลดไฟล์ขนาดไม่เกิน 5MB เท่านั้น (รองรับ .jpg, .png)'}</span>
                    </label>
                    <button onClick={handleUploadSlip} disabled={!selectedFile || isUploading} className="btn btn-primary mt-2 sm:mt-0 sm:self-start">
                        {isUploading && <span className="loading loading-spinner"></span>}<FiUploadCloud className="mr-2"/>{isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                    </button>
                  </div>
                )}


              </div>

              {order.Refund_Slip && (
                <>
                  <input type="radio" name="payment_tabs" role="tab" className="tab" aria-label="หลักฐานการคืนเงิน" defaultChecked={!!order.Refund_Slip} />
                  <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-b-box p-6">
                    <div className="text-center">
                      <img src={order.Refund_Slip} alt="Refund Slip" className="max-w-sm h-auto rounded-md shadow-sm mx-auto mb-4" />
                      <p className="text-base-content/70 text-sm">ผู้ดูแลระบบได้ทำการคืนเงินให้ท่านแล้ว</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* +++ เพิ่ม Text Box แจ้งเตือนสถานะด้านล่าง (รวมกรณี Rejected) +++ */}
            {orderStatusNote && (
                <div className={`alert ${orderStatusNote.bgColor} border ${orderStatusNote.borderColor} mt-6 flex items-start gap-3 text-left`}>
                    <div className={`p-2 rounded-full bg-white/60 ${orderStatusNote.color}`}>
                        {React.createElement(orderStatusNote.icon, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${orderStatusNote.color}`}>{orderStatusNote.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{orderStatusNote.message}</p>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* ปุ่มขอยกเลิกคำสั่งซื้อ */}
        {canCancel && (
            <div className="mt-8 pt-6 border-t border-base-300 flex justify-center sm:justify-end">
                <button 
                    onClick={() => {
                        setCancelReason('');
                        setIsCancelModalOpen(true);
                    }} 
                    className="btn btn-outline btn-error"
                >
                    <FiTrash2 className="mr-2"/> ขอยกเลิกคำสั่งซื้อ
                </button>
            </div>
        )}

        {/* +++ Modal ยกเลิกคำสั่งซื้อ (UI ใหม่) +++ */}
        <dialog className={`modal ${isCancelModalOpen ? 'modal-open' : ''}`}>
            <div className="modal-box">
                <button 
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => !isCancelling && setIsCancelModalOpen(false)}
                >✕</button>
                
                <h3 className="font-bold text-lg text-error flex items-center gap-2">
                    <FiAlertTriangle className="w-6 h-6" /> ยืนยันการยกเลิกคำสั่งซื้อ
                </h3>
                
                <div className="py-4 space-y-3">
                    <p className="font-medium">Order ID: #{orderId}</p>
                    <p className="text-sm text-base-content/70">คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?</p>
                    
                    <div className="form-control w-full mt-2">
                        <label className="label">
                            <span className="label-text font-semibold text-error">ระบุเหตุผล (จำเป็น):</span>
                        </label>
                        <textarea 
                            className="textarea textarea-bordered textarea-error h-24 w-full bg-base-50" 
                            placeholder="เช่น เปลี่ยนใจ, สั่งผิด, ต้องการเปลี่ยนที่อยู่..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            disabled={isCancelling}
                        ></textarea>
                    </div>

                    {/* +++ กล่องแจ้งเตือนสถานะที่จะเปลี่ยนไป +++ */}
                    {targetStatusInfo && (
                        <div className={`alert ${targetStatusInfo.config.bgColor} border ${targetStatusInfo.config.color.replace('text-', 'border-')} mt-4 flex flex-col sm:flex-row items-start gap-3`}>
                            <div className={`p-2 rounded-full bg-white/50 ${targetStatusInfo.config.color}`}>
                                {React.createElement(targetStatusInfo.config.icon, { className: "w-5 h-5" })}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-sm ${targetStatusInfo.config.color}`}>ผลการดำเนินการ</h3>
                                <p className="text-xs opacity-80 mt-1">{targetStatusInfo.description}</p>
                                <div className={`badge ${targetStatusInfo.config.color.replace('text-', 'badge-')} gap-1 mt-2`}>
                                    สถานะใหม่: {targetStatusInfo.config.label}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button 
                        className="btn btn-ghost" 
                        onClick={() => setIsCancelModalOpen(false)}
                        disabled={isCancelling}
                    >
                        ปิด
                    </button>
                    <button 
                        className="btn btn-error text-white" 
                        onClick={handleCancelOrder}
                        disabled={isCancelling || !cancelReason.trim()}
                    >
                        {isCancelling ? <span className="loading loading-spinner"></span> : 'ยืนยันการยกเลิก'}
                    </button>
                </div>
            </div>
            {/* Backdrop */}
            <form method="dialog" className="modal-backdrop">
                <button onClick={() => !isCancelling && setIsCancelModalOpen(false)}>close</button>
            </form>
        </dialog>

      </div>
    </div>
  );
}