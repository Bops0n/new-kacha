'use client';

import { useCallback, useEffect, useState } from "react";
import { StepFlowBar } from "@/app/[admin]/components/order-management/StepFlowComponent";
import { useAlert } from "@/app/context/AlertModalContext";
import { OrderNavigation } from "@/app/[admin]/components/order-management/OrderNavigation";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import OrderHeaderInfo from "@/app/[admin]/components/order-management/OrderHeaderInfo";
import OrderShippingInfo from "@/app/[admin]/components/order-management/OrderShippingInfo";

export default function ShippingPage() {
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

                const order : Order = orders[0];
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
                    })
                    await loadNextStep(order.Order_ID);
                }
            } finally {
                setLoading(false);
            }
        }

        async function loadNextStep(orderId: number) {
            const response = await fetch(`/api/admin/order/next-step?controller=shipping&orderId=${orderId}`);
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
        if (!isSaved) return;
  
        try {
            const response = await fetch('/api/admin/order/shipping-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Order_ID: orderId, ...form }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            await fetchOrderData();
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

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        let finalValue: any = value;

        if (type === 'checkbox') finalValue = checked;
        else if (type === 'number') finalValue = value === '' ? null : Number(value);
        
        setForm(prev => ({ ...prev, [name]: finalValue }));
    }, []);

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
                    <StepFlowBar currentStep={2} orderId={order.Order_ID} refund={false}/>
                </div>

                <OrderHeaderInfo order={order} />

                <OrderShippingInfo 
                    IsReadOnly={order.Status !== 'preparing'}
                    order={order}
                    form={form} 
                    handleFormChange={handleFormChange}
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