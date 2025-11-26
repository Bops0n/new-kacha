'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, FiDollarSign, 
  FiRefreshCw, FiTrash2, FiAlertTriangle, FiFileText, FiInfo, FiCreditCard
} from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import AccessDeniedPage from '@/app/components/AccessDenied';
import { useOrderHistory } from '@/app/hooks/useOrderHistory';
import { statusConfig } from '@/app/utils/client';

// --- Configuration ---
const PAYMENT_TIMEOUT_HOURS = 24;

// Status Config พร้อมสีที่สวยงาม

// --- StepIndicator Component ---
const OrderStepIndicator = ({ order, statusConfig }: { order: Order, statusConfig: any }) => {
  const currentStatus = order.Status;
  
  const happyPath: OrderStatus[] = (order.Payment_Type === 'bank_transfer')
    ? ['waiting_payment', 'pending', 'preparing', 'shipped', 'delivered']
    : ['pending', 'preparing', 'shipped', 'delivered'];
    
  const refundPath: OrderStatus[] = ['refunding', 'refunded'];
  
  const happyStepIndex = happyPath.indexOf(currentStatus);

  if (happyStepIndex > -1) {
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 text-center px-4">
        {happyPath.map((step, index) => {
          const statusInfo = statusConfig[step];
          if (!statusInfo) return null; 
          const isComplete = index < happyStepIndex;
          const isCurrent = index === happyStepIndex;
          // ปรับสี Step ให้สวยงาม
          const stepClass = isComplete ? 'step-success' : isCurrent ? 'step-primary' : '';
          return (
            <li key={step} className={`step ${stepClass} text-sm font-medium`}>
                {statusInfo.label}
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
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 text-center px-4">
        <li className={`step ${refundComplete ? 'step-secondary' : ''}`}>กำลังคืนเงิน</li>
        <li className={`step ${refundedComplete ? 'step-neutral' : ''}`}>คืนเงินสำเร็จ</li>
      </ul>
    );
  }

  // Cancelled Path
  if (currentStatus === 'cancelled' || currentStatus === 'req_cancel') {
    return (
      <ul className="steps steps-vertical md:steps-horizontal w-full my-8 text-center px-4">
        <li className="step step-primary">สั่งสินค้า</li>
        <li className="step step-error" data-content="✕">{statusConfig[currentStatus].label}</li>
      </ul>
    );
  }

  return (
    <div className="text-center p-6">
      <span className={`badge badge-lg gap-2 px-4 py-3 h-auto ${statusConfig[currentStatus]?.bgColor} ${statusConfig[currentStatus]?.textColor}`}>
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
  
  // ใช้ Hook ยืนยันรับของ
  // const { handleConfirmReceive: confirmReceiveHook, } = useOrderHistory();
  
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
      console.log(data.order)
      setOrder(data.order);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);

  // Wrapper สำหรับเรียก confirmReceive แล้วโหลดข้อมูลใหม่
  const handleConfirmReceive = async (e: React.MouseEvent<HTMLButtonElement>) => {
      // await confirmReceiveHook(e, orderId);
      fetchOrderDetails();
  }

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

  // +++ Helper: ฟอร์แมตวันที่และเวลา +++
  const formatDateTime = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
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
    if (hasSlip && !isChecked && order.Transaction_Status !== 'rejected') {
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

  // +++ Logic คำนวณข้อความแจ้งเตือนและเวลา +++
  const orderStatusNote = useMemo(() => {
    if (!order) return null;
    console.log(order)
    
    const { Status, Payment_Type, Is_Payment_Checked, Transaction_Slip, Transaction_Status, Transaction_Date, Order_Date } = order;

    const baseDate = Transaction_Date ? new Date(Transaction_Date) : new Date(Order_Date);
    const expireDate = new Date(baseDate.getTime() + (PAYMENT_TIMEOUT_HOURS * 60 * 60 * 1000));
    const formattedExpire = formatDateTime(expireDate);
    
    // 1. Pending + Rejected (สลิปถูกปฏิเสธ)
    if (Status === 'waiting_payment' && Transaction_Status === 'rejected') {
        return {
            icon: FiAlertTriangle,
            color: 'text-error',
            bgColor: 'bg-error/10',
            borderColor: 'border-error/20',
            title: 'สลิปการโอนเงินถูกปฏิเสธ',
            message: `เจ้าหน้าที่ได้ปฏิเสธสลิปการโอนเงินของท่าน กรุณาตรวจสอบความถูกต้องและอัพโหลดหลักฐานการโอนเงินใหม่อีกครั้งภายในวันที่ \n ${formattedExpire} `
        };
    }

    // 2. Pending + มีสลิป (ตรวจสอบสถานะการเช็ค)
    if (Status === 'pending' && Payment_Type === 'bank_transfer' && Transaction_Slip) {
        if (!Is_Payment_Checked) {
            return {
                icon: FiClock,
                color: 'text-warning',
                bgColor: 'bg-warning/10',
                borderColor: 'border-warning/20',
                title: 'มีการอัปโหลดสลิปแล้ว',
                message: 'ระบบได้รับสลิปของท่านแล้ว ทีมงานกำลังตรวจสอบความถูกต้อง (รอเจ้าหน้าที่ตรวจสอบ)'
            };
        } else {
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
            message: `กรุณาชำระเงินและแนบหลักฐานภายใน ${formattedExpire} หากเกินกำหนดระบบจะยกเลิกคำสั่งซื้ออัตโนมัติ`
        };
    }

    // 4. Refunding
    if (Status === 'refunding') {
        return {
            icon: FiRefreshCw,
            color: 'text-secondary', 
            bgColor: 'bg-secondary/10',
            borderColor: 'border-secondary/20',
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

    // 6. กรณีอื่นๆ (เช่น Shipped, Delivered)
    const config = statusConfig[Status] || statusConfig.pending;
    // สำหรับ Shipped ให้แสดงข้อความแนะนำให้กดรับ
    if (Status === 'shipped') {
        return {
            icon: FiTruck,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
            borderColor: 'border-primary/20',
            title: 'สินค้าอยู่ระหว่างการจัดส่ง',
            message: 'เมื่อได้รับสินค้าแล้ว กรุณาตรวจสอบความเรียบร้อยและกดปุ่ม "ยืนยันรับสินค้า" ด้านล่าง'
        };
    }

    return {
        icon: config.icon,
        color: config.textColor,
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
      <div className="max-w-5xl mx-auto bg-base-100 rounded-2xl shadow-xl p-6 md:p-10 overflow-hidden border border-base-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-base-300 pb-6">
            <div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn btn-circle btn-ghost btn-sm text-base-content/70 hover:bg-base-200">
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">คำสั่งซื้อ #{order.Order_ID}</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Customer & Shipping */}
            <div className="lg:col-span-2 space-y-6">
                {/* Customer Info Card */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-6">
                        <h3 className="card-title text-lg flex items-center gap-2 mb-2">
                            <FiMapPin className="text-primary" /> ที่อยู่จัดส่ง
                        </h3>
                        <div className="text-base-content/80 space-y-1 pl-7">
                            <p className="font-medium text-base-content">{order.Customer_Name}</p>
                            <p>{order.Address_1} {order.Address_2}</p>
                            <p>{order.Sub_District} {order.District}</p>
                            <p>{order.Province} {order.Zip_Code}</p>
                            <p className="mt-2 flex items-center gap-2 text-sm"><span className="font-semibold">โทร:</span> {order.Phone}</p>
                        </div>
                    </div>
                </div>

                {/* Shipping Info Card */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-6">
                        <h3 className="card-title text-lg flex items-center gap-2 mb-2">
                            <FiTruck className="text-primary" /> ข้อมูลการจัดส่ง
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7 text-sm text-base-content/80">
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">ประเภทการชำระเงิน</p>
                                <p className="font-medium">{order.Payment_Type === 'bank_transfer' ? 'โอนผ่านธนาคาร' : 'ชำระเงินปลายทาง (COD)'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">บริษัทขนส่ง</p>
                                <p className="font-medium">{order.Shipping_Method || '-'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">หมายเลขพัสดุ (Tracking)</p>
                                <p className="font-medium tracking-wide">{order.Tracking_Number || '-'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base-content/60 mb-1">วันที่จัดส่ง</p>
                                <p className="font-medium">{order.Shipping_Date ? formatDateTime(order.Shipping_Date) : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Payment & Slip */}
{/* Right Column: Payment & Slip */}
            <div className="space-y-6">
                {/* Slip Upload & View Section */}
                {(order.Payment_Type === 'bank_transfer' || order.Transaction_Slip) && (
                /* --- แก้ไข: ลบ h-full ออกจาก className --- */
                <div className="card bg-base-100 border border-base-200 shadow-sm"> 
                    <div className="card-body p-6 flex flex-col">
                        <h3 className="card-title text-lg flex items-center gap-2 mb-4">
                            <FiCreditCard className="text-primary" /> หลักฐานการชำระเงิน
                        </h3>
                        
                        <div className="flex-1 flex flex-col items-center justify-center bg-base-200/50 rounded-xl border-2 border-dashed border-base-300 min-h-[200px] p-4 relative overflow-hidden">
                            {order.Transaction_Slip ? (
                                <img 
                                    src={order.Transaction_Slip} 
                                    alt="Transfer Slip" 
                                    className="w-full h-auto object-contain rounded-lg shadow-sm hover:scale-105 transition-transform cursor-pointer" 
                                    onClick={() => window.open(order.Transaction_Slip!, '_blank')}
                                />
                            ) : (
                                <div className="text-center text-base-content/50 py-8">
                                    <FiUploadCloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>{order.Payment_Type === 'bank_transfer' ? 'ยังไม่มีสลิปการโอนเงิน' : 'ไม่จำเป็น (ชำระเงินปลายทาง)'}</p>
                                </div>
                            )}
                        </div>
                        
                        {canUploadSlip && (
                            <div className="mt-4 w-full">
                                <label className="btn btn-outline btn-primary w-full mb-2">
                                    เลือกไฟล์รูปภาพ
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                                </label>
                                {selectedFile && <p className="text-xs text-center text-base-content/70 mb-2 truncate">ไฟล์ที่เลือก: {selectedFile.name}</p>}
                                <button 
                                    onClick={handleUploadSlip} 
                                    disabled={!selectedFile || isUploading} 
                                    className="btn btn-primary w-full"
                                >
                                    {isUploading && <span className="loading loading-spinner loading-xs"></span>}
                                    {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                                </button>
                                <p className="text-[10px] text-center text-base-content/50 mt-2">รองรับ .jpg, .png ขนาดไม่เกิน 5MB</p>
                            </div>
                        )}
                    </div>
                </div>
                )}
                
                {/* Refund Slip (ถ้ามี) */}
                {order.Refund_Slip && (
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body p-6">
                            <h3 className="card-title text-lg flex items-center gap-2 mb-4 text-secondary">
                                <FiRefreshCw /> หลักฐานการคืนเงิน
                            </h3>
                            <div className="flex items-center justify-center bg-secondary/5 rounded-xl border border-secondary/20 p-2">
                                <img src={order.Refund_Slip} alt="Refund Slip" className="w-full h-auto rounded-lg" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Product List & Summary */}
        <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiShoppingCart className="text-primary" /> รายการสินค้า
            </h3>
            <div className="bg-base-100 border border-base-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead className="bg-base-200/50">
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
                                    <tr key={index} className="hover:bg-base-50 transition-colors">
                                        <td className="pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="avatar">
                                                    <div className="mask mask-squircle w-12 h-12 bg-base-200">
                                                        <img src={product.Product_Image_URL || 'https://placehold.co/100x100?text=No+Image'} alt={product.Product_Name} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">{product.Product_Name}</div>
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
                                                <span>{formatPrice(product.Product_Sale_Price)}</span>
                                            )}
                                        </td>
                                        <td className="text-center font-medium">x {product.Quantity} {product.Product_Unit}</td>
                                        <td className="text-right pr-6 font-bold">{formatPrice(product.Subtotal || 0)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Total Summary */}
                <div className="bg-base-50 p-6 border-t border-base-200">
                    <div className="flex flex-col gap-2 max-w-xs ml-auto">
                        <div className="flex justify-between text-sm text-base-content/70">
                            <span>รวมเป็นเงิน</span>
                            <span>{formatPrice(subtotalBeforeDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-error">
                            <span>ส่วนลด</span>
                            <span>- {formatPrice(subtotalBeforeDiscount - order.Total_Amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-success">
                            <span>ค่าจัดส่ง</span>
                            <span>ฟรี</span>
                        </div>
                        <div className="divider my-1"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">ยอดสุทธิ</span>
                            <span className="font-extrabold text-2xl text-primary">{formatPrice(order.Total_Amount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alert & Actions Area */}
        <div className="mt-8">
            {orderStatusNote && (
                <div className={`alert ${orderStatusNote.bgColor} border ${orderStatusNote.borderColor} shadow-sm rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-white/80 ${orderStatusNote.color} shadow-sm`}>
                            {React.createElement(orderStatusNote.icon, { className: 'w-6 h-6' })}
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${orderStatusNote.color}`}>{orderStatusNote.title}</h3>
                            <p className="text-sm opacity-90 mt-1">{orderStatusNote.message}</p>
                        </div>
                    </div>

                    {/* Action Buttons inside Alert Box */}
                    <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        {order.Status === 'shipped' && (
                            <button 
                                className="btn btn-success text-white shadow-md border-none px-6"
                                onClick={handleConfirmReceive}
                            >
                                <FiCheckCircle className="w-5 h-5 mr-1" /> ยืนยันรับสินค้า
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Button (Outside Alert) */}
            {canCancel && (
                <div className="mt-6 flex justify-center sm:justify-end">
                    <button 
                        onClick={() => {
                            setCancelReason('');
                            setIsCancelModalOpen(true);
                        }} 
                        className="btn btn-ghost text-error hover:bg-error/10 btn-sm"
                    >
                        <FiTrash2 className="mr-1"/> ขอยกเลิกคำสั่งซื้อ
                    </button>
                </div>
            )}
        </div>

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
                            className="textarea textarea-bordered textarea-error h-24 w-full bg-base-50 focus:outline-none focus:ring-2 focus:ring-error/50" 
                            placeholder="เช่น เปลี่ยนใจ, สั่งผิด, ต้องการเปลี่ยนที่อยู่..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            disabled={isCancelling}
                        ></textarea>
                    </div>

                    {/* กล่องแจ้งเตือนสถานะที่จะเปลี่ยนไป */}
                    {targetStatusInfo && (
                        <div className={`alert ${targetStatusInfo.config.bgColor} border ${targetStatusInfo.config.color.replace('text-', 'border-')} mt-4 flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg`}>
                            <div className={`p-2 rounded-full bg-white/50 ${targetStatusInfo.config.color}`}>
                                {React.createElement(targetStatusInfo.config.icon, { className: "w-5 h-5" })}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-sm ${targetStatusInfo.config.color}`}>ผลการดำเนินการ</h3>
                                <p className="text-xs opacity-80 mt-1">{targetStatusInfo.description}</p>
                                <div className={`badge ${targetStatusInfo.config.color.replace('text-', 'badge-')} gap-1 mt-2 border-none ${targetStatusInfo.config.textColor}`}>
                                    สถานะใหม่: {targetStatusInfo.config.label}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action bg-base-100 pt-0">
                    <button 
                        className="btn btn-ghost" 
                        onClick={() => setIsCancelModalOpen(false)}
                        disabled={isCancelling}
                    >
                        ปิด
                    </button>
                    <button 
                        className="btn btn-error text-white shadow-md" 
                        onClick={handleCancelOrder}
                        disabled={isCancelling || !cancelReason.trim()}
                    >
                        {isCancelling ? <span className="loading loading-spinner"></span> : 'ยืนยันการยกเลิก'}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm">
                <button onClick={() => !isCancelling && setIsCancelModalOpen(false)}>close</button>
            </form>
        </dialog>

      </div>
    </div>
  );
}