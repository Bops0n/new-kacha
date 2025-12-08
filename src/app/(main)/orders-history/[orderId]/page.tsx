'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, FiDollarSign, 
  FiRefreshCw, FiTrash2, FiAlertTriangle, FiFileText, FiInfo, FiCreditCard,
  FiArrowDown, FiZoomIn, FiUser, FiPhone, FiCopy, FiX
} from 'react-icons/fi';
import { Order, OrderStatus } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { useOrderHistory } from '@/app/hooks/useOrderHistory';

// --- Configuration ---
const PAYMENT_TIMEOUT_HOURS = 24;

// ข้อมูลบัญชีธนาคาร (สามารถแก้ไขให้ตรงกับของจริงได้ที่นี่)
const BANK_INFO = {
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  accountName: 'บจก. คชาโฮม จำกัด',
  accountNumber: '123-4-56789-0',
  branch: 'สาขาสุขุมวิท',
  promptPayId: '010555XXXXXXX' // ถ้ามี
};

// Status Config
const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; textColor: string } } = {
  waiting_payment: { label: 'รอชำระเงิน', color: 'warning', icon: FiClock, bgColor: 'bg-warning/10', textColor: 'text-warning' },
  pending: { label: 'รอดำเนินการ', color: 'warning', icon: FiClock, bgColor: 'bg-warning/10', textColor: 'text-warning' },
  preparing: { label: 'กำลังเตรียม', color: 'info', icon: FiPackage, bgColor: 'bg-info/10', textColor: 'text-info' },
  shipped: { label: 'จัดส่งแล้ว', color: 'primary', icon: FiTruck, bgColor: 'bg-primary/10', textColor: 'text-primary' },
  delivered: { label: 'ส่งเรียบร้อย', color: 'success', icon: FiCheckCircle, bgColor: 'bg-success/10', textColor: 'text-success' },
  refunding: { label: 'กำลังคืนเงิน', color: 'secondary', icon: FiRefreshCw, bgColor: 'bg-secondary/10', textColor: 'text-secondary' },
  refunded: { label: 'คืนเงินสำเร็จ', color: 'neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10', textColor: 'text-neutral' },
  cancelled: { label: 'ยกเลิก', color: 'error', icon: FiXCircle, bgColor: 'bg-error/10', textColor: 'text-error' },
  req_cancel: { label: 'ขอยกเลิก', color: 'warning', icon: FiFileText, bgColor: 'bg-warning/10', textColor: 'text-warning' },
};

// --- Component: Payment Info Modal ---
const PaymentInfoModal = ({ isOpen, onClose, totalAmount }: { isOpen: boolean; onClose: () => void; totalAmount: number }) => {
    const { showAlert } = useAlert();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text.replace(/-/g, ''));
        showAlert('คัดลอกเลขบัญชีเรียบร้อยแล้ว', 'success');
    };

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FiCreditCard className="text-primary" /> ช่องทางการชำระเงิน
                </h3>
                
                <div className="py-4 space-y-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center">
                        <p className="text-sm text-base-content/70">ยอดที่ต้องชำระ</p>
                        <p className="text-3xl font-bold text-primary">{formatPrice(totalAmount)}</p>
                    </div>

                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="font-bold text-base mb-2">{BANK_INFO.bankName}</h4>
                            <div className="space-y-1 text-sm">
                                <p><span className="opacity-70">ชื่อบัญชี:</span> {BANK_INFO.accountName}</p>
                                <p><span className="opacity-70">สาขา:</span> {BANK_INFO.branch}</p>
                            </div>
                            <div className="divider my-2"></div>
                            <div className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
                                <span className="font-mono text-lg font-bold tracking-wider">{BANK_INFO.accountNumber}</span>
                                <button 
                                    className="btn btn-xs btn-ghost text-primary tooltip tooltip-left" 
                                    data-tip="คัดลอก"
                                    onClick={() => handleCopy(BANK_INFO.accountNumber)}
                                >
                                    <FiCopy /> คัดลอก
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-xs text-center text-base-content/60 mt-2">
                        * กรุณาตรวจสอบยอดเงินและเลขบัญชีก่อนโอน <br/>
                        เมื่อโอนเสร็จแล้ว กรุณาแนบสลิปในหน้าคำสั่งซื้อ
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-primary w-full" onClick={onClose}>ปิดหน้าต่าง</button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
};

// --- StepIndicator Component ---
const OrderStepIndicator = ({ order, statusConfig }: { order: Order, statusConfig: any }) => {
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
      if (isComplete) bgClass = 'bg-success text-success-content border-success';
      else if (isCurrent) bgClass = `bg-primary text-primary-content border-primary shadow-lg scale-110 ring-2 ring-primary/30`;

      return (
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10 ${bgClass}`}>
            {React.createElement(icon, { className: 'w-5 h-5' })}
        </div>
      );
  };

  if (happyStepIndex > -1) {
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
        {happyPath.map((step, index) => {
          const statusInfo = statusConfig[step];
          if (!statusInfo) return null; 
          const isComplete = index < happyStepIndex;
          const isCurrent = index === happyStepIndex;
          const stepColor = isComplete ? 'step-success' : isCurrent ? 'step-primary' : '';
          return (
            <li key={step} className={`step ${stepColor} overflow-visible`} data-content="">
              <div className="flex flex-col items-center relative">
                {isCurrent && renderArrow()}
                {renderIconCircle(statusInfo.icon, isCurrent, isComplete)}
                <span className={`text-xs sm:text-sm mt-3 font-medium ${isCurrent ? 'text-primary font-bold' : 'text-base-content/70'}`}>
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
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
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
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 py-4 text-center px-4 overflow-visible">
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
                    {React.createElement(statusConfig[currentStatus].icon, { className: 'w-5 h-5' })}
                </div>
                <span className={`text-xs sm:text-sm mt-3 font-bold ${isReq ? 'text-warning' : 'text-error'}`}>
                    {statusConfig[currentStatus].label}
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

    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  const handleConfirmReceive = async (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsConfirming(true);
      await confirmReceiveHook(e, orderId);
      await fetchOrderDetails();
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
    } catch (err: any) { showAlert(err.message, 'error'); } finally { setIsUploading(false); }
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
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  const targetStatusInfo = useMemo(() => {
    if (!order) return null;
    const result = getCancelTarget(order);
    if (!result) return null;
    return {
        config: statusConfig[result.targetStatus], 
        description: result.description
    };
  }, [order, getCancelTarget]);

  const orderStatusNote = useMemo(() => getOrderStatusNote(order), [order, getOrderStatusNote]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container mx-auto p-4 text-center text-error"><h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1><p>{error}</p><button onClick={() => router.back()} className="btn btn-primary mt-4">กลับ</button></div>;
  if (!order) return <div className="text-center p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;
  if (order.User_ID !== Number(session?.user.id)) return <AccessDeniedPage url="/"/>

  const canUploadSlip = order.Payment_Type === 'bank_transfer' && (order.Status === 'waiting_payment' || (order.Status === 'pending' && order.Is_Payment_Checked === false));
  const canCancel = ['waiting_payment', 'pending', 'preparing'].includes(order.Status);
  const subtotalBeforeDiscount = order.Products.reduce((sum, product) => sum + (product.Product_Sale_Price * product.Quantity), 0);

  // Check if we should show the switch buttons
  const showRefundContext = order.Status === 'refunding' || !!order.Refund_Slip || order.Status === 'refunded';

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
                <p className="text-base-content/60 mt-1 ml-12 text-sm">วันที่สั่งซื้อ: {formatDateTime(order.Order_Date)}</p>
            </div>
            <div className={`badge border-none px-4 py-3 rounded-lg font-medium flex items-center gap-2 ${statusConfig[order.Status]?.bgColor} ${statusConfig[order.Status]?.textColor}`}>
                {statusConfig[order.Status]?.icon && React.createElement(statusConfig[order.Status].icon)}
                {statusConfig[order.Status]?.label}
            </div>
        </div>

        {/* Step Indicator */}
        <OrderStepIndicator order={order} statusConfig={statusConfig} />

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
                            <div><p className="font-semibold text-base-content/60 mb-1">ประเภทการชำระเงิน</p><p className="font-medium">{order.Payment_Type === 'bank_transfer' ? 'โอนผ่านธนาคาร' : 'ชำระเงินปลายทาง (COD)'}</p></div>
                            <div><p className="font-semibold text-base-content/60 mb-1">บริษัทขนส่ง</p><p className="font-medium">{order.Shipping_Method || '-'}</p></div>
                            <div><p className="font-semibold text-base-content/60 mb-1">หมายเลขพัสดุ</p><p className="font-medium tracking-wide select-all bg-base-200 px-2 py-1 rounded w-fit">{order.Tracking_Number || '-'}</p></div>
                            <div><p className="font-semibold text-base-content/60 mb-1">วันที่จัดส่ง</p><p className="font-medium">{order.Shipping_Date ? formatDateTime(order.Shipping_Date) : '-'}</p></div>
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
                                    {order.Transaction_Slip ? (
                                        <div 
                                            className="relative group w-full rounded-xl overflow-hidden border border-base-300 shadow-sm cursor-pointer bg-base-200"
                                            onClick={() => window.open(order.Transaction_Slip!, '_blank')}
                                        >
                                            <img 
                                                src={order.Transaction_Slip} 
                                                alt="Transfer Slip" 
                                                className="w-full h-auto max-h-60 object-contain transition-transform duration-300 group-hover:scale-105" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="text-white text-xs font-medium flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/20">
                                                    <FiZoomIn /> คลิกเพื่อขยาย
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full min-h-[150px] flex flex-col items-center justify-center bg-base-200/50 rounded-xl border-2 border-dashed border-base-300 p-6 text-base-content/40">
                                            <FiUploadCloud className="w-10 h-10 mb-2" />
                                            <p className="text-sm text-center">
                                                {order.Payment_Type === 'bank_transfer' ? 'ยังไม่มีสลิปการโอนเงิน' : 'ชำระเงินปลายทาง'}
                                            </p>
                                            
                                            {/* +++ ปุ่มดูช่องทางชำระเงิน (เฉพาะเมื่อยังไม่มีสลิป และเป็นโอนเงิน) +++ */}
                                        </div>
                                    )}

                                                    {/* File Info */}
                                                    {selectedFile && (
                                                        <div className="text-sm text-center text-success mt-2">
                                                            ไฟล์ที่เลือก : {selectedFile.name}
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-base-content/60 text-center mt-2">
                                                        รองรับไฟล์ JPG, JPEG, PNG (ขนาดไฟล์สูงสุด 5MB)
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
                                            ) : (
                                                <div className="w-full min-h-[150px] flex flex-col items-center justify-center bg-base-200/50 rounded-xl border-2 border-dashed border-base-300 p-6 text-base-content/40">
                                                    <p className="text-sm text-center mt-9">ชำระเงินปลายทาง</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    
                                </>
                            ) : (
                                // --- REFUND TAB CONTENT ---
                                <div className="w-full animate-fadeIn">
                                    {order.Refund_Slip ? (
                                        <div 
                                            className="relative group w-full rounded-xl overflow-hidden border border-base-300 shadow-sm cursor-pointer bg-base-200"
                                            onClick={() => window.open(order.Refund_Slip!, '_blank')}
                                        >
                                            <img 
                                                src={order.Refund_Slip} 
                                                alt="Refund Slip" 
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
                                                                    <button 
                                                    onClick={() => setIsPaymentModalOpen(true)}
                                                    className="btn btn-sm btn-ghost text-primary mt-4"
                                                >
                                                    ดูช่องทางการชำระเงิน
                                                </button>
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
                                                        <img src={product.Product_Image_URL || 'https://placehold.co/100x100?text=No+Image'} alt={product.Product_Name} />
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
                        <div className="flex justify-between text-sm text-base-content/70"><span>รวมเป็นเงิน</span><span>{formatPrice(subtotalBeforeDiscount)}</span></div>
                        <div className="flex justify-between text-sm text-error"><span>ส่วนลด</span><span>- {formatPrice(subtotalBeforeDiscount - order.Total_Amount)}</span></div>
                        <div className="flex justify-between text-sm text-success"><span>ค่าจัดส่ง</span><span>ฟรี</span></div>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between items-center"><span className="font-bold text-lg">ยอดสุทธิ</span><span className="font-extrabold text-2xl text-success underline-offset-1 underline">{formatPrice(order.Total_Amount)}</span></div>
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
                <div className="mt-6 flex justify-center sm:justify-end">
                    <button onClick={() => { setCancelReason(''); setIsCancelModalOpen(true); }} className="btn btn-ghost text-error hover:bg-error/10 btn-sm"><FiTrash2 className="mr-1"/> ขอยกเลิกคำสั่งซื้อ</button>
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
                        <div className={`alert ${targetStatusInfo.config.bgColor} border ${targetStatusInfo.config.color.replace('text-', 'border-')} mt-4 flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg`}>
                            <div className={`p-2 rounded-full bg-white/50 ${targetStatusInfo.config.color}`}>{React.createElement(targetStatusInfo.config.icon, { className: "w-5 h-5" })}</div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-sm ${targetStatusInfo.config.color}`}>ผลการดำเนินการ</h3>
                                <p className="text-xs opacity-80 mt-1">{targetStatusInfo.description}</p>
                                <div className={`badge ${targetStatusInfo.config.color.replace('text-', 'badge-')} gap-1 mt-2 border-none text-white`}>สถานะใหม่: {targetStatusInfo.config.label}</div>
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
        />

      </div>
    </div>
  );
}