'use client';

import { useCallback, useEffect, useState } from "react";
import { StepFlowBar } from "@/app/[admin]/components/order-management/StepFlowComponent";
import { OrderNavigation } from "@/app/[admin]/components/order-management/OrderNavigation";
import { useParams } from "next/navigation";
import { Order, SimpleProductDetail } from "@/types";
import OrderHeaderInfo from "@/app/[admin]/components/order-management/OrderHeaderInfo";
import OrderCheckInfo from "@/app/[admin]/components/order-management/OrderCheckInfo";
import OrderShippingInfo from "@/app/[admin]/components/order-management/OrderShippingInfo";

export default function SummaryPage() {
    const { orderId } = useParams();

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

    const [form, setForm] = useState({
        Shipping_Method: "",
        Shipping_Provider: "",
        Shipping_Date: "",
        Shipping_Cost: 0,
        Vehicle_Type: "",
        Driver_Name: "",
        Driver_Phone: "",
        Tracking_Number: "",
        Tracking_URL: "",
        Internal_Note: "",
        Customer_Note: "",
        Is_Auto_Update_Status: false,
    });
  
    const fetchOrderData = useCallback(async () => {
        async function load() {
            try {
                setLoading(true);

                const res = await fetch(`/api/admin/order?id=${orderId}`);
                const { orders } = await res.json();

                const order = orders[0];
                if (order) {
                    setOrder(order);
                    setForm({
                        Shipping_Method: order.Shipping_Method || "",
                        Shipping_Provider: order.Shipping_Provider || "",
                        Shipping_Date: order.Shipping_Date || "",
                        Shipping_Cost: order.Shipping_Cost ?? 0,
                        Vehicle_Type: order.Vehicle_Type || "",
                        Driver_Name: order.Driver_Name || "",
                        Driver_Phone: order.Driver_Phone || "",
                        Tracking_Number: order.Tracking_Number || "",
                        Tracking_URL: order.Tracking_URL || "",
                        Internal_Note: order.Internal_Note || "",
                        Customer_Note: order.Customer_Note || "",
                        Is_Auto_Update_Status: order.Is_Auto_Update_Status ?? false
                    });
                    await loadProductDetails(order);
                    await loadNextStep(order.Order_ID);
                }
            } finally {
                setLoading(false);
            }
        }

        async function loadNextStep(orderId: number) {
            const response = await fetch(`/api/admin/order/next-step?controller=summary&orderId=${orderId}`);
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

        async function loadProductDetails(order: Order) {
            if (!order || order.Products.length < 1) return;
    
            const productIds = order.Products.map(p => p.Product_ID!);
    
            const response = await fetch('/api/admin/products/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds }),
            });
    
            const details: SimpleProductDetail[] = await response.json();
            setLiveDetails(new Map(details.map(p => [p.Product_ID, p])));
        }

        load();

    }, [orderId]);
  
    async function onSaved() {
        if (!isSaved) return;
    }
  
    useEffect(() => {
        fetchOrderData();
    }, [fetchOrderData]);

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
                    <StepFlowBar currentStep={3} orderId={order.Order_ID} refund={false}/>
                </div>

                <OrderHeaderInfo order={order} />

                <OrderCheckInfo 
                    order={order}
                    liveDetails={liveDetails}
                    btnSpecial={btnSpecial}
                    fetchOrderData={fetchOrderData}
                />

                <OrderShippingInfo 
                    IsReadOnly={true}
                    order={order}
                    form={form}
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