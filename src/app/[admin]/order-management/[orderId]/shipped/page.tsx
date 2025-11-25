'use client';

import { useEffect, useState, useCallback } from "react";
import { StepFlowBar } from "@/app/[admin]/components/order-management/StepFlowComponent";
import { useParams, useSearchParams } from "next/navigation";
import { Order } from "@/types";
import { OrderNavigation } from "@/app/[admin]/components/order-management/OrderNavigation";
import { BiCheck, BiX } from "react-icons/bi";
import { useAlert } from "@/app/context/AlertModalContext";
import { FiCheckCircle, FiCreditCard, FiInfo } from "react-icons/fi";
import { paymentTypeLabels, statusTypeLabels } from "@/app/utils/client";
import { MdOutlineLocalShipping } from "react-icons/md";

export default function ShippedPage() {
    const { orderId } = useParams();
    const { showAlert } = useAlert();
    const params = useSearchParams();
    const goto = params.get("goto");

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAllValid, setIsAllValid] = useState(false);

    const [BackStep, setBackStep] = useState("");
    const [NextStep, setNextStep] = useState("");
    const [lbButtonText, setButtonText] = useState("");
    const [btnNextEnable, setBtnNextEnable] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [btnCancelOrder, setBtnCancelOrder] = useState(false);

    const fetchOrderData = useCallback(async () => {
        async function load() {
            try {
                setLoading(true);

                const res = await fetch(`/api/admin/order?id=${orderId}`);
                const { orders } = await res.json();

                const order : Order = orders[0];
                if (order) {
                    setOrder(order);
                    await loadNextStep(order.Order_ID);
                }
            } finally {
                setLoading(false);
            }
        }

        async function loadNextStep(orderId: number) {
            const response = await fetch(`/api/admin/order/next-step?controller=shipped&orderId=${orderId}`);
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
            body: JSON.stringify({ Order_ID: orderId, Status: 'shipped' } as Partial<Order>),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
        } catch (err: any) {
            showAlert(err.message, 'error');
        }
    }

    function onValidate(): boolean {

        if (!order) return false;

        const IsCOD = order.Payment_Type === "cash_on_delivery";

        const STEP_1_VALID = IsCOD ? 
            order.Status !== 'waiting_payment' : 
            (order.Transaction_Slip && 
                order.Is_Payment_Checked && 
                order.Transaction_Status === 'confirmed' && 
                order.Status === 'preparing') as boolean;

        const requiredShippingFields = [
            "Shipping_Method",
            "Shipping_Provider",
            "Shipping_Date",
            "Vehicle_Type",
            "Driver_Name",
            "Driver_Phone",
        ];

        const STEP_2_VALID = requiredShippingFields.every((x) => order[x as keyof Order] && order[x as keyof Order] !== "");

        setIsAllValid(STEP_1_VALID && STEP_2_VALID);

        return isAllValid;
    };

    useEffect(() => {
        fetchOrderData();
    }, [fetchOrderData]);

    useEffect(() => {
        onValidate();
    }, [order, onValidate]);

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

    if (loading || !order) {
        return (
            <div className="p-20 text-center">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    const InfoRow = ({ label, valid }: { label: string; valid: boolean }) => (
        <div className="flex items-center justify-between py-2 border-b border-base-300">
        <span>{label}</span>
        {valid ? (
            <BiCheck className="text-success w-5 h-5" />
        ) : (
            <BiX className="text-error w-5 h-5" />
        )}
        </div>
    );

    // Step 1 validation
    const STEP_1_CHECKORDER = {
        Transaction_Slip: !!order.Transaction_Slip && order.Transaction_Status !== 'rejected',
        Checked: order.Transaction_Status === 'confirmed',
        Confirmed: order.Is_Confirmed
    };

    // Step 2 validation
    const STEP_2_SHIPPING = {
        Shipping_Method: !!order.Shipping_Method,
        Shipping_Provider: !!order.Shipping_Provider,
        Shipping_Date: !!order.Shipping_Date,
        Vehicle_Type: !!order.Vehicle_Type,
        Driver_Name: !!order.Driver_Name,
        Driver_Phone: !!order.Driver_Phone,
    };

    const currentStatus = statusTypeLabels[order.Status];
    const shipped = statusTypeLabels['shipped'];

    const paymentLabel = paymentTypeLabels[order.Payment_Type];
    
    return (
    <div className="min-h-screen bg-base-200 p-4">
        <div className="max-w-7xl mx-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
                    <StepFlowBar currentStep={4} orderId={order.Order_ID}refund={false}/>
                </div>

                {/* Step 1 Section */}
                <div className="bg-base-100 p-6 rounded-xl shadow space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <FiCreditCard className="text-primary w-5 h-5" />
                        <h2 className="font-bold text-lg">การชำระเงิน (
                            <span className={`badge ${paymentLabel.color}`}>
                                <paymentLabel.icon className="inline-block w-4 h-4 mr-1" />
                                {paymentLabel.label || order.Payment_Type}
                            </span>)
                        </h2>
                    </div>
                    { order.Payment_Type !== "cash_on_delivery" && 
                        <>
                            <InfoRow label="ลูกค้าแนบหลักฐานการโอนเงิน" valid={STEP_1_CHECKORDER.Transaction_Slip} />
                            <InfoRow label="ตรวจสอบหลักฐานการชำระเงิน" valid={STEP_1_CHECKORDER.Checked} />
                        </>
                    }
                    <InfoRow label="ยืนยันคำสั่งซื้อ" valid={STEP_1_CHECKORDER.Confirmed} />
                </div>

                {/* Step 2 Section */}
                <div className="bg-base-100 p-6 rounded-xl shadow space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <MdOutlineLocalShipping className="text-primary w-5 h-5" />
                        <h2 className="font-bold text-lg">ข้อมูลการจัดส่ง</h2>
                    </div>
                    <InfoRow label="วิธีการจัดส่ง" valid={STEP_2_SHIPPING.Shipping_Method} />
                    <InfoRow label="ผู้ให้บริการขนส่ง" valid={STEP_2_SHIPPING.Shipping_Provider} />
                    <InfoRow label="วันที่จัดส่ง" valid={STEP_2_SHIPPING.Shipping_Date} />
                    <InfoRow label="ประเภทยานพาหนะ" valid={STEP_2_SHIPPING.Vehicle_Type} />
                    <InfoRow label="ชื่อคนขับ" valid={STEP_2_SHIPPING.Driver_Name} />
                    <InfoRow label="เบอร์โทรคนขับ" valid={STEP_2_SHIPPING.Driver_Phone} />
                </div>

                {order.Status !== 'shipped' && isAllValid &&
                    <>
                        {/* Confirm Card */}
                        <div className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-xl h-fit">
                            <div className="flex items-center gap-3 mb-4">
                                <FiCheckCircle className="w-7 h-7 text-success" />
                                <div>
                                    <h2 className="font-bold text-lg">ยืนยันการจัดส่งสินค้า</h2>
                                    <p className="text-sm text-base-content/70">
                                    โปรดยืนยันว่าข้อมูลการจัดส่งถูกต้อง และสินค้าถูกส่งออกจากคลังเรียบร้อยแล้ว
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="badge badge-lg badge-outline">
                                    สถานะปัจจุบัน : 
                                    <span className={`badge ${currentStatus.color}`}>
                                        <currentStatus.icon className="inline-block w-4 h-4 mr-1" />
                                        {currentStatus.label}
                                    </span>
                                </div>
                                <div className="rounded-xl bg-base-200 border border-base-300 p-4 flex gap-3">
                                    <FiInfo className="w-5 h-5 mt-1 text-info" />
                                    <div className="text-sm text-base-content/80 space-y-1">
                                    <p>
                                        หลังจากกด <span className="font-semibold">"{lbButtonText}"</span>{" "}
                                        ระบบจะเปลี่ยนสถานะคำสั่งซื้อเป็น{" "}
                                        <span className={`badge ${shipped.color }`}>
                                            <shipped.icon className="inline-block w-4 h-4 mr-1" />
                                            {shipped.label}
                                        </span>{" "} และจะไม่สามารถยกเลิกคำสั่งซื้อนี้ได้แล้ว
                                    </p>
                                    <p className="text-xs opacity-70">
                                        แนะนำให้ตรวจสอบข้อมูล{" "}
                                        <span className="font-semibold">วันที่จัดส่ง, เบอร์โทรคนขับ, Tracking Number, Tracking URL</span>{" "}
                                        ให้ถูกต้องก่อนยืนยัน
                                    </p>
                                    </div>
                                </div>

                                <div className="mt-4 text-xs text-base-content/60">
                                    * หากต้องการแก้ไขข้อมูลการจัดส่ง ให้กลับไปที่ขั้นตอน{" "}
                                    <span className="font-semibold">"กรอกข้อมูลการจัดส่ง"</span> ก่อนยืนยัน
                                </div>
                            </div>
                        </div>
                    </>
                }
                
                <OrderNavigation
                    orderId={order.Order_ID}
                    backHref={BackStep || undefined}
                    nextHref={NextStep || undefined}
                    nextLabel={lbButtonText}
                    nextEnabled={isAllValid ? btnNextEnable : false}
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
