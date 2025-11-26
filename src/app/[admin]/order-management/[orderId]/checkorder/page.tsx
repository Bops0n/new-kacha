'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Order, SimpleProductDetail } from '@/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { StepFlowBar } from '@/app/[admin]/components/order-management/StepFlowComponent';
import { useAlert } from '@/app/context/AlertModalContext';
import { OrderNavigation } from '@/app/[admin]/components/order-management/OrderNavigation';
import OrderHeaderInfo from '@/app/[admin]/components/order-management/OrderHeaderInfo';
import OrderCheckInfo from '@/app/[admin]/components/order-management/OrderCheckInfo';
import { Router } from 'next/router';

// ===============================
//          MAIN PAGE
// ===============================

export default function CheckOrderPage() {
  const { orderId } = useParams();
  const { showAlert } = useAlert();
  const params = useSearchParams();
  const goto = params.get("goto");

  const [order, setOrder] = useState<Order | null>(null);
  const [liveDetails, setLiveDetails] = useState<Map<number, SimpleProductDetail>>(new Map());
  const [loading, setLoading] = useState(true);
  const [BackStep, setBackStep] = useState("");
  const [NextStep, setNextStep] = useState("");
  const [lbButtonText, setButtonText] = useState("");
  const [btnNextEnable, setBtnNextEnable] = useState(false);
  const [btnSpecial, setBtnSpecial] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [btnCancelOrder, setBtnCancelOrder] = useState(false);

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
          await loadProductDetails(order);
          await loadNextStep(order.Order_ID);
        }
      } finally {
        setLoading(false);
      }
    }

    async function loadProductDetails(order: Order) {
      if (!order || order.Products.length < 1) return;

      const productIds = order.Products.map(p => p.Product_ID!);

      const response = await fetch('/api/admin/products/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      });


      const details: SimpleProductDetail[] = await response.json();
      setLiveDetails(new Map(details.map(p => [p.Product_ID, p])));
    }

    async function loadNextStep(orderId: number) {
      const response = await fetch(`/api/admin/order/next-step?controller=checkorder&orderId=${orderId}`);
      const result = await response.json();
      if (result && result.length > 0) {
        const data = result[0];
        setBtnNextEnable(data.btnNextEnable);
        setButtonText(data.lbButtonText);
        setBackStep(data.BackStep);
        setNextStep(data.NextStep);
        setBtnSpecial(data.btnSpecial);
        setIsSaved(data.isSaved);
        setBtnCancelOrder(data.btnCancelOrder);
      }
    }

    load();
  }, [orderId]);

  async function onSaved() {
    if (!isSaved) return;

    try {
      const response = await fetch('/api/admin/order/confirm-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Order_ID: orderId } as Partial<Order>),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  }

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
            <StepFlowBar currentStep={1} orderId={order.Order_ID} refund={false}/>
          </div>

          <OrderHeaderInfo order={order} />

          <OrderCheckInfo 
            order={order}
            liveDetails={liveDetails}
            btnSpecial={btnSpecial}
            fetchOrderData={fetchOrderData}
          />

          <OrderNavigation
            orderId={order.Order_ID}
            backHref={BackStep || undefined}
            nextHref={NextStep || undefined}
            nextLabel={lbButtonText}
            nextEnabled={btnNextEnable}
            btnCancelOrder={btnCancelOrder}
            fetchOrderData={fetchOrderData}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>
  );
}
