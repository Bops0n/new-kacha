'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, 
  FiArrowLeft, FiMapPin, FiShoppingCart, FiUploadCloud, FiDollarSign 
} from 'react-icons/fi';
import { Order, OrderStatus, StatusConfig } from '@/types';
import { useAlert } from '@/app/context/AlertModalContext';
import { formatPrice, formatDate } from '@/app/utils/formatters';
import LoadingSpinner from '@/app/components/LoadingSpinner';

// --- UI Configuration ---
// (สามารถย้ายไปรวมไว้ที่ไฟล์กลาง /types/ui.types.ts ได้)
const statusConfig: StatusConfig = {
  pending: { label: 'รอดำเนินการ', color: 'text-yellow-600', icon: FiClock, bgColor: 'bg-yellow-100' },
  processing: { label: 'กำลังจัดเตรียม', color: 'text-blue-600', icon: FiPackage, bgColor: 'bg-blue-100' },
  shipped: { label: 'จัดส่งแล้ว', color: 'text-indigo-600', icon: FiTruck, bgColor: 'bg-indigo-100' },
  delivered: { label: 'จัดส่งสำเร็จ', color: 'text-green-600', icon: FiCheckCircle, bgColor: 'bg-green-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', icon: FiXCircle, bgColor: 'bg-red-100' },
};


// --- Main Page Component ---
export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { showAlert } = useAlert();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // ดึง orderId จาก URL และแปลงเป็น number
  const orderId = typeof params.orderId === 'string' ? parseInt(params.orderId, 10) : NaN;

  // --- Logic การดึงข้อมูล ---
  const fetchOrderDetails = useCallback(async () => {
    if (isNaN(orderId)) {
      setError('Order ID ไม่ถูกต้อง');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/main/orders/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      }
      const data = await response.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // --- Logic การอัปโหลดสลิป ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {

      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        setSelectedFile(null);
        showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB', 'warning');
        return 
      }
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        setSelectedFile(null);
        showAlert('ไฟล์ต้องเป็นรูปภาพ (JPEG หรือ PNG)', 'warning');
        return
      }

      setSelectedFile(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!order || !selectedFile) {
      showAlert('กรุณาเลือกไฟล์สลิปก่อน', 'warning');
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('transferSlip', selectedFile);

      const response = await fetch(`/api/main/orders/${order.Order_ID}`, {
        method: 'PATCH',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'ไม่สามารถอัปโหลดสลิปได้');
      }

      await fetchOrderDetails(); // Re-fetch เพื่อแสดงข้อมูลล่าสุด
      setSelectedFile(null);
      showAlert('อัปโหลดสลิปสำเร็จ!', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Render Logic ---
  if (loading) return <LoadingSpinner />;
  if (error) return (
      <div className="container mx-auto p-4 text-center text-error">
          <h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1>
          <p>{error}</p>
          <button onClick={() => router.back()} className="btn btn-primary mt-4">กลับ</button>
      </div>
  );
  if (!order) return <div className="text-center p-8">ไม่พบข้อมูลคำสั่งซื้อ</div>;

  const statusInfo = statusConfig[order.Status as OrderStatus];
  const canUploadSlip = order.Payment_Type === 'bank_transfer' && order.Status === 'pending';

  // คำนวณยอดรวมก่อนหักส่วนลด (ถ้ามี)
  const subtotalBeforeDiscount = order.Products.reduce((sum, product) => {
      return sum + (product.Product_Sale_Price * product.Quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 border-b pb-4 flex-wrap gap-4">
          <button onClick={() => router.back()} className="btn btn-ghost">
            <FiArrowLeft className="mr-2" /> กลับไปหน้ารายการ
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-base-content text-right">รายละเอียดคำสั่งซื้อ #{order.Order_ID}</h1>
        </div>

        <div className="bg-primary/5 text-primary-content p-4 rounded-lg flex flex-wrap items-center justify-around gap-y-2 mb-6 shadow-sm text-sm sm:text-base">
            <p><strong>วันที่สั่ง:</strong> {formatDate(order.Order_Date)}</p>
            <span className={`badge ${statusInfo?.bgColor.replace('bg-', 'badge-')} badge-lg gap-2`}>
              {statusInfo?.icon && React.createElement(statusInfo.icon)}
              {statusInfo?.label || order.Status}
            </span>
            {order.Invoice_ID && <p><strong>ใบแจ้งหนี้:</strong> {order.Invoice_ID}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-200 p-6">
                <h2 className="card-title text-xl mb-4"><FiMapPin className="mr-2"/>ที่อยู่จัดส่ง</h2>
                <div className="space-y-1 text-base-content/90">
                    <p>{order.Address}</p>
                    <p><strong>โทร:</strong> {order.Phone}</p>
                </div>
            </div>
            <div className="card bg-base-200 p-6">
                <h2 className="card-title text-xl mb-4"><FiTruck className="mr-2"/>ข้อมูลการจัดส่ง</h2>
                <div className="space-y-1 text-base-content/90">
                    <p><strong>ประเภทชำระเงิน:</strong> {order.Payment_Type}</p>
                    <p><strong>บริษัทขนส่ง:</strong> {order.Shipping_Carrier || '-'}</p>
                    <p><strong>Tracking ID:</strong> {order.Tracking_ID || '-'}</p>
                    <p><strong>วันที่จัดส่ง (คาดการณ์):</strong> {order.DeliveryDate ? formatDate(order.DeliveryDate) : '-'}</p>
                </div>
            </div>
        </div>

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
                            {/* --- START: ส่วนแสดงราคาสินค้าที่ปรับปรุงใหม่ --- */}
                            <div className="text-sm text-base-content/70">
                                {hasDiscount ? (
                                    <span>
                                        <span className="line-through">{formatPrice(product.Product_Sale_Price)}</span>
                                        <span className="text-primary font-bold ml-2">{formatPrice(product.Product_Discount_Price!)}</span>
                                    </span>
                                ) : (
                                    <span>{formatPrice(product.Product_Sale_Price)}</span>
                                )}
                                <span className="ml-2">x {product.Quantity} {product.Product_Unit}</span>
                            </div>
                            {/* --- END: ส่วนแสดงราคาสินค้าที่ปรับปรุงใหม่ --- */}
                        </div>
                        <p className="font-bold text-lg text-primary">{formatPrice(product.Subtotal || 0)}</p>
                    </div>
                  );
              })}
            </div>
        </div>

        <div className="card bg-base-200 p-6 mt-6">
            <h2 className="card-title text-xl mb-4"><FiDollarSign className="mr-2"/>สรุปยอดคำสั่งซื้อ</h2>
            <div className="space-y-3 text-base-content/90">
                <div className="flex justify-between">
                    <span>ยอดรวม (ก่อนหักส่วนลด):</span>
                    <span className="font-semibold">{formatPrice(subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between text-error">
                    <span>ส่วนลดรวม:</span>
                    <span className="font-semibold">- {formatPrice(subtotalBeforeDiscount - order.Total_Amount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>ค่าจัดส่ง:</span>
                    <span className="font-semibold text-success">ฟรี</span>
                </div>
            </div>
            <div className="divider my-4"></div>
            <div className="flex justify-between items-center text-xl font-bold">
                <span>ยอดชำระทั้งหมด:</span>
                <span className="text-primary">{formatPrice(order.Total_Amount)}</span>
            </div>
        </div>
        
        {order.Payment_Type === 'bank_transfer' && (
          <div className="card bg-base-200 p-6 mt-6">
            <h2 className="card-title text-xl mb-4">หลักฐานการโอนเงิน</h2>
            <div className="text-center">
              {order.Transfer_Slip_Image_URL ? (
                <img src={order.Transfer_Slip_Image_URL} alt="Transfer Slip" className="max-w-sm h-auto rounded-md shadow-sm mx-auto mb-4" />
              ) : (
                <p className="text-base-content/70 mb-4">ยังไม่มีสลิปการโอนเงิน</p>
              )}
            </div>
            {canUploadSlip && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 border-t border-base-300 pt-4">
                <label className='flex flex-col items-center justify-center'>
                <input type="file" className="file-input file-input-bordered file-input-primary w-full max-w-xs" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" placeholder='s'></input>
                  {'สามารถอัพโหลดไฟล์ขนาดไม่เกิน 5MB เท่านั้น '}
                </label>
                  <button onClick={handleUploadSlip} disabled={!selectedFile || isUploading} className="btn btn-primary mb-auto">
                      {isUploading && <span className="loading loading-spinner"></span>}
                      <FiUploadCloud className="mr-2"/>
                      {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                  </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}