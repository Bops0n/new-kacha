'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Order } from '@/types';
import { useParams, useSearchParams } from 'next/navigation';
import { StepFlowBar } from '@/app/[admin]/components/order-management/StepFlowComponent';
import { useAlert } from '@/app/context/AlertModalContext';
import { OrderNavigation } from '@/app/[admin]/components/order-management/OrderNavigation';
import OrderHeaderInfo from '@/app/[admin]/components/order-management/OrderHeaderInfo';
import OrderRefundInfo from '@/app/[admin]/components/order-management/OrderRefundInfo';

// ===============================
//          MAIN PAGE
// ===============================

export default function RefundedPage() {
  const { orderId } = useParams();
  const { showAlert } = useAlert();
  const params = useSearchParams();
  const goto = params.get("goto");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [BackStep, setBackStep] = useState("");
  const [NextStep, setNextStep] = useState("");
  const [lbButtonText, setButtonText] = useState("");
  const [btnNextEnable, setBtnNextEnable] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [btnCancelOrder, setBtnCancelOrder] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Load order & live product details
  const fetchOrderData = useCallback(async () => {
    async function load() {
      try {
        setLoading(true);

        const res = await fetch(`/api/admin/order?id=${orderId}`);
        const { orders } = await res.json();

        const order = orders[0];
        if (order) {
          setOrder(order);
          await loadNextStep(order.Order_ID);
        }
      } finally {
        setLoading(false);
      }
    }

    async function loadNextStep(orderId: number) {
      const response = await fetch(`/api/admin/order/refund-step?controller=refunded&orderId=${orderId}`);
      const result = await response.json();
      if (result && result.length > 0) {
        const data = result[0];
        setBtnNextEnable(data.btnNextEnable);
        setButtonText(data.lbButtonText);
        setBackStep(data.BackStep);
        setNextStep(data.NextStep);
        setIsSaved(data.isSaved);
        setBtnCancelOrder(data.btnCancelOrder);
      }
    }

    load();
  }, [orderId]);

  async function onSaved() {
    if (!onValidate()) return;
    
    if (!isSaved) return;

    try {
      const response = await fetch('/api/admin/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Order_ID: orderId, Status: 'cancelled' } as Partial<Order>),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  }

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
      showAlert('กรุณาเลือกไฟล์ก่อน', 'warning');
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('transferSlip', selectedFile);

      const response = await fetch(`/api/admin/order/refund-slip/${order.Order_ID}`, {
        method: 'PATCH',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'ไม่สามารถอัปโหลดหลักฐานได้');
      }

      await fetchOrderData(); // Re-fetch เพื่อแสดงข้อมูลล่าสุด
      setSelectedFile(null);
      showAlert('อัปโหลดหลักฐานสำเร็จ!', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error', 'เกิดข้อผิดพลาด');
    } finally {
      setIsUploading(false);
    }
  };

  function onValidate(): boolean {
    if (!order) return false;

    return order.Status !== 'refunded' || !order.Refund_Slip || order.Is_Refunded;
};

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    if (loading) return;
    if (!goto) return;

    setTimeout(() => {
      const el = document.getElementById(goto);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, [loading, goto]);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <span className="loading loading-dots loading-lg"></span>
        <p className="mt-2 opacity-70">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (!order) return <div className="p-10 text-center text-error">ไม่พบคำสั่งซื้อ</div>;

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
            <StepFlowBar currentStep={2} orderId={order.Order_ID} refund={true}/>
          </div>

          <OrderHeaderInfo order={order} />

          <OrderRefundInfo 
            order={order}
            selectedFile={selectedFile}
            isUploading={isUploading}
            handleFileChange={handleFileChange}
            handleUploadSlip={handleUploadSlip}
          />

          <OrderNavigation
            orderId={order.Order_ID}
            backHref={BackStep || undefined}
            nextHref={NextStep || undefined}
            nextLabel={lbButtonText}
            nextEnabled={btnNextEnable}
            btnCancelOrder={btnCancelOrder}
            fetchOrderData={fetchOrderData}
            onValidate={onValidate}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>
  );
}
