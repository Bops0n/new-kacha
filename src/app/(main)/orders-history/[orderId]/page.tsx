'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiTruck, FiCheckCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, 
  FiRefreshCw, FiTrash2, FiAlertTriangle, FiCreditCard,
  FiArrowDown, FiZoomIn, FiCopy,
  FiXCircle
} from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatDateTimeShort, formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { useOrderHistory } from '@/app/hooks/useOrderHistory';
import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';
import { useWebsiteSettings } from '@/app/providers/WebsiteSettingProvider';
import { ORDER_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, SHIPPING_METHOD_CONFIG } from '@/app/utils/client';
import Image from 'next/image';

// --- Component: Payment Info Modal ---
const PaymentInfoModal = (
{ isOpen, onClose, totalAmount, setPreviewImage }: 
{ isOpen: boolean; onClose: () => void; totalAmount: number; setPreviewImage: (image: string) => void }) => {
    const { showAlert } = useAlert();
    const settings = useWebsiteSettings();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text.replace(/-/g, ''));
        showAlert('คัดลอกเลขบัญชีเรียบร้อยแล้ว', 'success');
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-4xl">
                <button
                    onClick={onClose}
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                >
                    ✕
                </button>

                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <FiCreditCard className="text-primary" /> ช่องทางการชำระเงิน
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className="flex justify-center h-full">
                        <div
                            className="relative group w-full max-w-full aspect-square rounded-2xl overflow-hidden border border-base-200 shadow-sm bg-white cursor-zoom-in h-full"
                            onClick={() => setPreviewImage(settings.paymentQRScanImage)}
                        >
                            <Image
                                src={settings.paymentQRScanImage}
                                alt='Payment QR Scan'
                                width={512}
                                height={512}
                                className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center pointer-events-none">
                                <span className="text-white bg-black/60 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                <FiZoomIn /> คลิกเพื่อขยาย
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 h-full">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center">
                            <p className="text-sm text-base-content/70">ยอดที่ต้องชำระ</p>
                            <p className="text-3xl font-bold text-primary">
                                {formatPrice(totalAmount)}
                            </p>
                        </div>
                        <div className="card bg-base-100 border border-base-200 shadow-sm flex-grow">
                        <div className="card-body p-4">
                            <h4 className="font-bold text-base mb-2">{settings.companyName}</h4>

                            <div className="text-sm space-y-1">
                                <p><span className="opacity-70">ธนาคาร:</span> {settings.paymentBankName}</p>
                                <p><span className="opacity-70">ชื่อบัญชี:</span> {settings.paymentBankAccountName}</p>
                            </div>

                            <div className="divider my-2"></div>

                            <div className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
                                <span className="font-mono text-lg font-bold tracking-wider">
                                    เลขบัญชี: {settings.paymentBankAccountNumber}
                                </span>

                                <button
                                    className="btn btn-xs btn-ghost text-primary tooltip tooltip-left"
                                    data-tip="คัดลอก"
                                    onClick={() => handleCopy(settings.paymentBankAccountNumber)}
                                >
                                    <FiCopy /> คัดลอก
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-center text-base-content/60 mt-6">
                    * กรุณาตรวจสอบยอดเงินและเลขบัญชีก่อนโอน  
                    <br />
                    เมื่อโอนเสร็จแล้ว กรุณาแนบสลิปในหน้าคำสั่งซื้อ
                </div>

                <div className="modal-action mt-2">
                    <button className="btn btn-primary w-full text-white" onClick={onClose}>
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>

            <form
                method="dialog"
                className="modal-backdrop bg-black/50 backdrop-blur-sm"
            >
                <button onClick={onClose}>ปิด</button>
            </form>
        </dialog>
    );
};

// --- StepIndicator Component ---
const OrderStepIndicator = ({ order, statusConfig }: { order: Order, statusConfig: StatusConfig }) => {
  const currentStatus = order.Status;
  
  const happyPath: OrderStatus[] = (order.Payment_Type === 'bank_transfer')
    ? ['waiting_payment', 'pending', 'preparing', 'shipped', 'delivered']
    : ['pending', 'preparing', 'shipped', 'delivered'];
    
  const refundPath: OrderStatus[] = ['refunding', 'refunded'];
  
  const happyStepIndex = happyPath.indexOf(currentStatus);

  const renderArrow = () => (
    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-20 w-max">
        <span className="text-[10px] font-bold text-black bg-base-100 px-2 py-0.5 rounded-full shadow-sm mb-1 border border-base-200">อยู่ที่นี่</span>
        <FiArrowDown className="w-6 h-6 text-black filter drop-shadow-sm" />
    </div>
  );

  const renderIconCircle = (icon: React.ElementType, isCurrent: boolean, isComplete: boolean) => {
      let bgClass = 'bg-base-100 border-base-300 text-base-content/30';
      if (isComplete) bgClass = 'bg-success text-green-600-content border-success';
      else if (isCurrent) bgClass = `${icon === FiCheckCircle ? 'bg-success border-success' : 'bg-primary text-primary-content border-primary'} shadow-lg scale-110 ring-2 ring-primary/30`;

      return (
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10 ${bgClass}`}>
            {React.createElement(icon, { className: 'w-5 h-5' })}
        </div>
      );
  };

  if (happyStepIndex > -1) {
    return (
      <ul className="steps steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
        {happyPath.map((step, index) => {
          const statusInfo = statusConfig[step];
          if (!statusInfo) return null; 
          const isComplete = index < happyStepIndex;
          const isCurrent = index === happyStepIndex;
          const stepColor = isComplete ? 'step-success' : isCurrent ? step === 'delivered' ? 'step-success': 'step-primary' : '';
          return (
            <li key={step} className={`step ${stepColor} overflow-visible`} data-content="">
              <div className="flex flex-col items-center relative">
                {isCurrent && renderArrow()}
                {renderIconCircle(statusInfo.icon, isCurrent, isComplete)}
                <span className={`text-xs sm:text-sm mt-3 font-medium ${isCurrent ? 'text-black font-bold' : 'text-base-content/70'}`}>
                    {statusInfo.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  const refundStepIndex = refundPath.indexOf(currentStatus);
  if (refundStepIndex > -1) {
    return (
      <ul className="steps steps-horizontal md:steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
        {refundPath.map((step, index) => {
            const statusInfo = statusConfig[step];
            const isComplete = index < refundStepIndex;
            const isCurrent = index === refundStepIndex;
            const stepColor = isComplete ? 'step-success' : isCurrent ? 'step-secondary' : '';
            return (
                <li key={step} className={`step ${stepColor} overflow-visible`} data-content="">
                    <div className="flex flex-col items-center relative">
                        {isCurrent && renderArrow()}
                        {renderIconCircle(statusInfo.icon, isCurrent, isComplete)}
                        <span className="text-xs sm:text-sm mt-3 font-medium">{statusInfo.label}</span>
                    </div>
                </li>
            );
        })}
      </ul>
    );
  }

  if (currentStatus === 'cancelled' || currentStatus === 'req_cancel') {
    const isReq = currentStatus === 'req_cancel';
    return (
      <ul className="steps steps-horizontal md:steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
        <li className="step step-primary overflow-visible" data-content="">
            <div className="flex flex-col items-center relative">
                {renderIconCircle(FiShoppingCart, false, true)}
                <span className="text-xs sm:text-sm mt-3 font-medium">สั่งสินค้า</span>
            </div>
        </li>
        <li className={`step ${isReq ? 'step-warning' : 'step-error'} overflow-visible`} data-content="">
            <div className="flex flex-col items-center relative">
                {renderArrow()}
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 ${isReq ? 'bg-warning text-warning-content border-warning shadow-lg' : 'bg-error text-error-content border-error shadow-lg'}`}>
                    {React.createElement(ORDER_STATUS_CONFIG[currentStatus].icon, { className: 'w-5 h-5' })}
                </div>
                <span className={`text-xs sm:text-sm mt-3 font-bold ${isReq ? 'text-warning' : 'text-error'}`}>
                    {ORDER_STATUS_CONFIG[currentStatus].label}
                </span>
            </div>
        </li>
      </ul>
    );
  }
  return null;
};

export default function OrderDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  const { vatRate } = useWebsiteSettings();
  
  const { handleConfirmReceive: confirmReceiveHook, getCancelTarget, getOrderStatusNote } = useOrderHistory();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // State สำหรับ Tab (Default = Payment)
  const [activeTab, setActiveTab] = useState<'payment' | 'refund'>('payment');
  
  // +++ State สำหรับ Modal ช่องทางการชำระเงิน +++
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

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
      
      // ถ้ามี Refund Slip ให้ Auto switch ไป Tab Refund
      if (data.order.Refund_Slip) setActiveTab('refund');

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        setError(message); 
    } finally { 
        setLoading(false); 
    }
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  const handleConfirmReceive = async (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsConfirming(true);
      await confirmReceiveHook(e, orderId, fetchOrderDetails)
      setIsConfirming(false);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleFileChangeManual(file);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"; 
      showAlert(message, 'error'); 
    } finally { 
        setIsUploading(false); 
    }
  };

    function handleFileChangeManual(file: File) {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB Limit
            setSelectedFile(null);
            showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB', 'warning');
            return;
        }
        if (file.type !== 'image/jpeg' && 
            file.type !== 'image/png') {
            setSelectedFile(null);
            showAlert('ไฟล์ต้องเป็นรูปภาพ (JPG, JPEG หรือ PNG)', 'warning');
            return;
        }

        setSelectedFile(file);
    }

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      showAlert(message, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const targetStatusInfo = useMemo(() => {
    if (!order) return null;
    const result = getCancelTarget(order);
    if (!result) return null;
    return {
        config: ORDER_STATUS_CONFIG[result.targetStatus], 
        description: result.description
    };
  }, [order, getCancelTarget]);

  const orderStatusNote = useMemo(() => getOrderStatusNote(order), [order, getOrderStatusNote]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container mx-auto p-4 text-center text-error"><h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1><p>{error}</p><button onClick={() => router.back()} className="btn btn-primary mt-4">กลับ</button></div>;
  if (!order) return <div className="text-center p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;
  if (order.User_ID !== Number(session?.user?.id)) return <AccessDeniedPage url="/"/>

  const canUploadSlip = order.Payment_Type === 'bank_transfer' && (order.Status === 'waiting_payment' || (order.Status === 'pending' && order.Is_Payment_Checked === false));
  const canCancel = ['waiting_payment', 'pending'].includes(order.Status);
  const subtotalBeforeDiscount = order.Products.reduce((sum, product) => sum + (product.Product_Sale_Price * product.Quantity), 0);

  // Check if we should show the switch buttons
  const showRefundContext = order.Status === 'refunding' || !!order.Refund_Slip || order.Status === 'refunded';
  const paymentConfig = PAYMENT_METHOD_CONFIG[order.Payment_Type];
  const shippingConfig = SHIPPING_METHOD_CONFIG[order.Shipping_Method];

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto bg-base-100 rounded-2xl shadow-xl p-6 md:p-10 overflow-visible border border-base-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-base-300 pb-6">
            <div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn btn-circle btn-ghost btn-sm text-base-content/70 hover:bg-base-200"><FiArrowLeft className="w-5 h-5" /></button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">หมายเลขคำสั่งซื้อ: {order.Order_ID}</h1>
                </div>
                <p className="text-base-content/60 mt-1 ml-12 text-sm">วันที่สั่งซื้อ: {formatDateTimeShort(order.Order_Date)}</p>
            </div>
            <div className={`badge border-none px-4 py-3 md:py-5 rounded-lg font-medium text-sm md:text-xl flex items-center gap-2 ${ORDER_STATUS_CONFIG[order.Status]?.bgColor} ${ORDER_STATUS_CONFIG[order.Status]?.textColor}`}>
                {ORDER_STATUS_CONFIG[order.Status]?.icon && React.createElement(ORDER_STATUS_CONFIG[order.Status].icon)}
                {ORDER_STATUS_CONFIG[order.Status]?.label}
            </div>
        </div>

        {/* Step Indicator */}
        <OrderStepIndicator order={order} statusConfig={ORDER_STATUS_CONFIG} />

        <div className="divider my-8"></div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Left Column: Customer & Shipping */}
            <div className="lg:col-span-2 space-y-6">
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-6">
                        <h3 className="card-title text-lg flex items-center gap-2 mb-2"><FiMapPin className="text-primary" /> ที่อยู่จัดส่ง</h3>
                        <div className="text-base-content/80 space-y-1 pl-7">
                            <p className="font-medium text-base-content">{order.Customer_Name}</p>
                            <p>{order.Address_1} {order.Address_2}</p>
                            <p>{order.Sub_District} {order.District}</p>
                            <p>{order.Province} {order.Zip_Code}</p>
                            <p className="mt-2 flex items-center gap-2 text-sm"><span className="font-semibold">โทร:</span> {order.Phone}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-6">
                        <h3 className="card-title text-lg flex items-center gap-2 mb-2"><FiTruck className="text-primary" /> ข้อมูลการจัดส่ง</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7 text-sm text-base-content/80">
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">ประเภทการชำระเงิน</p>
                                <p className="font-medium">
                                    <span className={`badge ${paymentConfig.textColor} ${paymentConfig.bgColor}`}>
                                        <paymentConfig.icon className="inline-block w-4 h-4 mr-1" />
                                        {paymentConfig.label}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">วิธีการจัดส่ง</p>
                                <p className="font-medium">
                                    {shippingConfig ? (
                                        <span className={`badge ${shippingConfig.textColor} ${shippingConfig.bgColor}`}>
                                            <shippingConfig.icon className="inline-block w-4 h-4 mr-1" />
                                            {shippingConfig.label}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </p>
                            </div>
                            <div><p className="font-semibold text-base-content/60 mb-1">บริษัทขนส่ง</p><p className="font-medium">{order.Shipping_Provider || '-'}</p></div>
                            <div><p className="font-semibold text-base-content/60 mb-1">หมายเลขพัสดุ</p><p className="font-medium tracking-wide select-all bg-base-200 px-2 py-1 rounded w-fit">{order.Tracking_Number || '-'}</p></div>
                            <div><p className="font-semibold text-base-content/60 mb-1">วันที่จัดส่ง</p><p className="font-medium">{formatDateTimeShort(order.Shipping_Date)}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Payment & Slip (Tabbed Card) */}
            <div className="space-y-6">
                <div className="card bg-base-100 border border-base-200 shadow-sm h-fit"> 
                    <div className="card-body p-6 flex flex-col">
                        
                        {/* Header Title Change based on activeTab */}
                        <h3 className={`card-title text-lg flex items-center gap-2 mb-4 ${activeTab === 'payment' ? 'text-primary' : 'text-secondary'}`}>
                            {activeTab === 'payment' 
                                ? <><FiCreditCard className="w-5 h-5" /><span className='text-black'>หลักฐานการชำระเงิน</span></>
                                : <><FiRefreshCw className="w-5 h-5" /> <span className='text-black'>หลักฐานการคืนเงิน</span></>
                            }
                        </h3>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[200px]">
                            {activeTab === 'payment' ? (
                                // --- PAYMENT TAB CONTENT ---
                                <>
                                    {order.Transaction_Slip && (
                                        <div 
                                            className="relative group w-full rounded-xl overflow-hidden border border-base-300 shadow-sm cursor-zoom-in bg-base-200"
                                            onClick={() => setPreviewImage(order.Transaction_Slip!)}
                                        >
                                            <Image 
                                                src={order.Transaction_Slip} 
                                                alt="Transfer Slip" 
                                                width={512}
                                                height={512}
                                                className="w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-105" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="text-white text-xs font-medium flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/20">
                                                    <FiZoomIn /> คลิกเพื่อขยาย
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {canUploadSlip && order.Payment_Type === 'bank_transfer' && (
                                        <>
                                            <button 
                                                onClick={() => setIsPaymentModalOpen(true)}
                                                className={`btn w-full btn-base-200 text-primary ${order.Transaction_Slip ? 'mt-4' : ''}`}
                                            >
                                                ดูช่องทางการชำระเงิน
                                            </button>
                                            <div
                                                className="w-full mt-4 animate-fadeIn"
                                            >
                                                {/* If a file is selected, show the file info and change/remove buttons */}
                                                {selectedFile ? (
                                                    <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-center">
                                                        <p className="text-xs font-semibold text-green-600/80 mb-1">ไฟล์ที่เลือก:</p>
                                                        <p className="text-sm font-medium text-green-600 break-all mb-3">{selectedFile.name}</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button 
                                                                className="btn btn-xs btn-outline btn-primary"
                                                                onClick={() => document.getElementById("transfer-slip-upload")?.click()}
                                                            >
                                                                <FiRefreshCw /> เปลี่ยนไฟล์
                                                            </button>
                                                            <button 
                                                                className="btn btn-xs btn-ghost text-error"
                                                                onClick={() => setSelectedFile(null)}
                                                            >
                                                                <FiTrash2 /> ลบไฟล์
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Otherwise, show the appropriate uploader */
                                                    order.Transaction_Slip ? (
                                                        <div className="relative group w-full">
                                                            <input 
                                                                type="file" 
                                                                id="transfer-slip-upload-small" 
                                                                onChange={handleFileChange} 
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                                accept="image/png, image/jpeg, image/jpg" 
                                                            />
                                                            <div className="btn btn-outline btn-primary btn-sm w-full flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:shadow-md transition-all duration-200">
                                                                <FiUploadCloud className="w-4 h-4" />
                                                                <span>เปลี่ยนรูปสลิป</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileChangeManual(file); }}
                                                            className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col justify-center items-center cursor-pointer transition ${isDragging ? "bg-primary/10 border-primary" : "bg-base-200 border-base-300 hover:border-primary"}`}
                                                            onClick={() => document.getElementById("transfer-slip-upload")?.click()}
                                                        >
                                                            <FiUploadCloud className="w-10 h-10 text-base-content/60" />
                                                            <p className="mt-2 text-base-content/70 text-center">แนบสลิปการโอนเงิน</p>
                                                            <p className="text-xs text-base-content/50 mt-1">คลิกเพื่อเลือกไฟล์ หรือวางไฟล์ลงที่นี่</p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                            {/* Hidden file input - always present */}
                                            <input
                                                id="transfer-slip-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/jpg"
                                                onChange={handleFileChange}
                                            />

                                            <p className="text-xs text-base-content/60 text-center mt-2">
                                                รองรับไฟล์ JPG, JPEG, PNG (ขนาดไม่เกิน 5MB)
                                            </p>

                                            {/* Upload Button */}
                                            <button
                                                className="btn btn-primary w-full mt-2 flex gap-2 justify-center items-center"
                                                disabled={!selectedFile || isUploading}
                                                onClick={handleUploadSlip}
                                            >
                                                {isUploading && <span className="loading loading-spinner"></span>}
                                                {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดหลักฐานการโอนเงิน"}
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                // --- REFUND TAB CONTENT ---
                                <div className="w-full animate-fadeIn">
                                    {order.Refund_Slip ? (
                                        <div 
                                            className="relative group w-full rounded-xl overflow-hidden border border-base-300 shadow-sm cursor-zoom-in bg-base-200"
                                            onClick={() => setPreviewImage(order.Refund_Slip!)}
                                        >
                                            <Image 
                                                src={order.Refund_Slip} 
                                                alt="Refund Slip" 
                                                width={512}
                                                height={512}
                                                className="w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-105" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="text-white text-xs font-medium flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/20">
                                                    <FiZoomIn /> คลิกเพื่อขยาย
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-base-content/50">
                                            <FiRefreshCw className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p>อยู่ระหว่างดำเนินการคืนเงิน</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Toggle Buttons (Only show if refund context exists) */}
                        {showRefundContext && (
                            <div className="grid grid-rows-2 gap-2 mt-2 pt-0 border-t border-base-200">
                                <button 
                                    className={`btn btn-sm ${activeTab === 'payment' ? 'btn-primary' : 'btn-outline border-base-300 text-base-content/70 hover:bg-base-100 hover:text-base-content'}`}
                                    onClick={() => setActiveTab('payment')}
                                >
                                    <FiCreditCard className={activeTab === 'payment' ? '' : 'opacity-70'} /> หลักฐานโอนเงิน
                                </button>

                                {order.Refund_Slip ? (
                                    <button 
                                        className={`btn btn-sm ${activeTab === 'refund' ? 'btn-secondary' : 'btn-outline border-base-300 text-base-content/70 hover:bg-base-100 hover:text-base-content'}`}
                                        onClick={() => setActiveTab('refund')}
                                    >
                                        <FiRefreshCw className={activeTab === 'refund' ? '' : 'opacity-70'} /> หลักฐานคืนเงิน
                                    </button>
                                ) : (
                                    <button className="btn btn-sm btn-disabled btn-outline border-base-200 bg-base-100 text-base-content/40" disabled>
                                        <span className="loading loading-spinner loading-xs"></span> ⏳ รอการคืนเงิน
                                    </button>
                                )}
                                
                            </div>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>

        {/* Product List & Summary */}
        <div className="mt-6"> 
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 px-1"><FiShoppingCart className="text-primary" /> รายการสินค้า</h3>
            <div className="bg-base-100 border border-base-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead className="bg-base-200/50 text-base-content/70">
                            <tr>
                                <th className="pl-6">สินค้า</th>
                                <th className="text-center">ราคาต่อหน่วย</th>
                                <th className="text-center">จำนวน</th>
                                <th className="text-right pr-6">ราคารวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.Products.map((product, index) => {
                                const hasDiscount = product.Product_Discount_Price !== null && product.Product_Discount_Price < product.Product_Sale_Price;
                                return (
                                    <tr key={index} className="hover:bg-base-50 transition-colors border-b border-base-100 last:border-none">
                                        <td className="pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="avatar">
                                                    <div className="mask mask-squircle w-12 h-12 bg-base-200 border border-base-200">
                                                        <Image 
                                                            src={product.Product_Image_URL || 'https://placehold.co/100x100?text=No+Image'} 
                                                            alt={product.Product_Name} 
                                                            width={512}
                                                            height={512}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-base-content/90">{product.Product_Name}</div>
                                                    <div className="text-xs opacity-60">{product.Product_Brand}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {hasDiscount ? (
                                                <div className="flex flex-col">
                                                    <span className="line-through text-xs opacity-50">{formatPrice(product.Product_Sale_Price)}</span>
                                                    <span className="font-bold text-primary">{formatPrice(product.Product_Discount_Price!)}</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">{formatPrice(product.Product_Sale_Price)}</span>
                                            )}
                                        </td>
                                        <td className="text-center font-medium opacity-80">x {product.Quantity} {product.Product_Unit}</td>
                                        <td className="text-right pr-6 font-bold text-base-content/90">{formatPrice(product.Subtotal || 0)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-base-50/50 p-6 border-t border-base-200">
                    <div className="flex flex-col gap-2 max-w-xs ml-auto">
                        <div className="flex justify-between text-sm text-base-content/70"><span>ราคาสินค้า</span><span>{formatPrice(subtotalBeforeDiscount - subtotalBeforeDiscount * order.Current_Vat / 100)}</span></div>
                        <div className="flex justify-between text-sm text-error"><span>ส่วนลด</span><span>- {formatPrice(subtotalBeforeDiscount - order.Total_Amount)}</span></div>
                        <div className="flex justify-between text-sm text-base-content/70"><span>ภาษีมูลค่าเพิ่ม ({vatRate}%)</span><span>{formatPrice(subtotalBeforeDiscount / 100 * order.Current_Vat)}</span></div>
                        <div className="flex justify-between text-sm text-green-600"><span>ค่าจัดส่ง</span><span>ฟรี</span></div>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between items-center"><span className="font-bold text-lg">ยอดรวมสุทธิ</span><span className="font-extrabold text-2xl text-green-600 underline-offset-1 underline">{formatPrice(order.Total_Amount)}</span></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alert & Actions Area */}
        <div className="mt-8">
            {orderStatusNote && (
                <div className={`alert ${orderStatusNote.bgColor} border ${orderStatusNote.borderColor} shadow-sm rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-white/80 ${orderStatusNote.color} shadow-sm`}>{React.createElement(orderStatusNote.icon, { className: 'w-6 h-6' })}</div>
                        <div><h3 className={`font-bold text-lg ${orderStatusNote.color}`}>{orderStatusNote.title}</h3><p className="text-sm opacity-90 mt-1 whitespace-pre-line">{orderStatusNote.message}</p></div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        {order.Status === 'shipped' && (<button className="btn btn-success text-white shadow-md border-none px-6" onClick={handleConfirmReceive} disabled={isConfirming}>{isConfirming ? <span className="loading loading-spinner loading-xs"></span> : <FiCheckCircle className="w-5 h-5 mr-1" />} {isConfirming ? ' กำลังบันทึก...' : ' ยืนยันรับสินค้า'}</button>)}
                    </div>
                </div>
            )}

            {canCancel && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    
                    <div className="text-sm text-base-content/70">
                        * หมายเหตุ : สถานะ {ORDER_STATUS_CONFIG['waiting_payment'].label}, {ORDER_STATUS_CONFIG['pending'].label} สามารถดำเนินการขอยกเลิกคำสั่งซื้อได้
                    </div>

                    <button
                        className="btn btn-ghost text-error hover:bg-error/10 self-end sm:self-auto"
                        onClick={() => {
                            setCancelReason('');
                            setIsCancelModalOpen(true);
                        }}
                    >
                        <FiXCircle className="mr-1" />
                        ขอยกเลิกคำสั่งซื้อ
                    </button>
                </div>
            )}
        </div>

        {/* Modal: Cancel Order */}
        <dialog className={`modal ${isCancelModalOpen ? 'modal-open' : ''}`}>
            <div className="modal-box">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => !isCancelling && setIsCancelModalOpen(false)}>✕</button>
                <h3 className="font-bold text-lg text-error flex items-center gap-2"><FiAlertTriangle className="w-6 h-6" /> ยืนยันการยกเลิกคำสั่งซื้อ</h3>
                <div className="py-4 space-y-3">
                    <p className="font-medium">หมายเลขคำสั่งซื้อ: {orderId}</p>
                    <p className="text-sm text-base-content/70">คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?</p>
                    <div className="form-control w-full mt-2">
                        <label className="label"><span className="label-text font-semibold text-error">ระบุเหตุผล (จำเป็น):</span></label>
                        <textarea className="textarea textarea-bordered textarea-error h-24 w-full bg-base-50 focus:outline-none focus:ring-2 focus:ring-error/50" placeholder="เช่น เปลี่ยนใจ, สั่งผิด, ต้องการเปลี่ยนที่อยู่..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} disabled={isCancelling}></textarea>
                    </div>
                    {targetStatusInfo && (
                        <div className={`alert ${targetStatusInfo.config.bgColor} border ${targetStatusInfo.config.textColor.replace('text-', 'border-')} mt-4 flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg`}>
                            <div className={`p-2 rounded-full bg-white/50 ${targetStatusInfo.config.textColor}`}>{React.createElement(targetStatusInfo.config.icon, { className: "w-5 h-5" })}</div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-sm ${targetStatusInfo.config.textColor}`}>ผลการดำเนินการ</h3>
                                <p className="text-xs opacity-80 mt-1">{targetStatusInfo.description}</p>
                                <div className={`badge ${targetStatusInfo.config.textColor.replace('text-', 'badge-')} gap-1 mt-2 border-none ${targetStatusInfo.config.textColor}`}>สถานะใหม่ : {targetStatusInfo.config.label}</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-action bg-base-100 pt-0">
                    <button className="btn btn-ghost" onClick={() => setIsCancelModalOpen(false)} disabled={isCancelling}>ปิด</button>
                    <button className="btn btn-error text-white shadow-md" onClick={handleCancelOrder} disabled={isCancelling || !cancelReason.trim()}>{isCancelling ? <span className="loading loading-spinner"></span> : 'ยืนยันการยกเลิก'}</button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm"><button onClick={() => !isCancelling && setIsCancelModalOpen(false)}>close</button></form>
        </dialog>

        {/* Modal: Payment Info (New) */}
        <PaymentInfoModal 
            isOpen={isPaymentModalOpen} 
            onClose={() => setIsPaymentModalOpen(false)} 
            totalAmount={order.Total_Amount}
            setPreviewImage={setPreviewImage}
        />

      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}