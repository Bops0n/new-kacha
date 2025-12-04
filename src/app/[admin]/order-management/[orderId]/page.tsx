'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Order, SimpleProductDetail } from '@/types';
import { useParams, useSearchParams } from 'next/navigation';
import { STEP_TYPE, StepFlowBar } from '@/app/[admin]/components/order-management/StepFlowComponent';
import { useAlert } from '@/app/context/AlertModalContext';
import { OrderNavigation } from '@/app/[admin]/components/order-management/OrderNavigation';
import OrderHeaderInfo from '@/app/[admin]/components/order-management/OrderHeaderInfo';
import OrderCheckInfo from '@/app/[admin]/components/order-management/OrderCheckInfo';
import OrderShippingInfo from '../../components/order-management/OrderShippingInfo';
import OrderShippedInfo from '../../components/order-management/OrderShippedInfo';
import OrderRefundInfo from '../../components/order-management/OrderRefundInfo';

export default function OrderStepPage() {
    const { orderId } = useParams();
    const { showAlert } = useAlert();
    const params = useSearchParams();
    const controller = params.get("controller");
    const goto = params.get("goto");

    const IsCheckOrder = controller === 'checkorder';
    const IsShipping = controller === 'shipping';
    const IsSummary = controller === 'summary';
    const IsShipped = controller === 'shipped';
    const IsRefunding = controller === 'refunding';
    const IsReqCancel = controller === 'req_cancel';

    const [order, setOrder] = useState<Order | null>(null);
    const [liveDetails, setLiveDetails] = useState<Map<number, SimpleProductDetail>>(new Map());
    const [loading, setLoading] = useState(true);
    const [BackStep, setBackStep] = useState<string | null>("");
    const [NextStep, setNextStep] = useState<string | null>("");
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const fetchOrderData = useCallback(async () => {
        async function load() {
            try {
                setLoading(true);

                const res = await fetch(`/api/admin/order?id=${orderId}`);
                const { orders } = await res.json();

                const order = orders[0];
                if (order) {
                    setOrder(order);
                    // await loadNextStep(order.Order_ID);
                    loadNextStep(order);
                    if (IsCheckOrder || IsSummary || IsRefunding) {
                        await loadProductDetails(order);   
                    }
                    if (IsShipping || IsSummary) {
                        setIsReadOnly(order.Status !== 'preparing' || IsSummary);
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
                    }
                }
            } finally {
                setLoading(false);
            }
        }

        // async function loadNextStep(orderId: number) {
        //     const response = await fetch(`/api/admin/order/next-step?controller=${controller}&orderId=${orderId}`);
        //     const result = await response.json();
        //     if (result && result.length > 0) {
        //         const data = result[0];
        //         setBtnNextEnable(data.btnNextEnable);
        //         setButtonText(data.lbButtonText);
        //         setBackStep(data.BackStep);
        //         setNextStep(data.NextStep);
        //         setBtnSpecial(data.btnSpecial);
        //         setIsSaved(data.isSaved);
        //         setBtnCancelOrder(data.btnCancelOrder);
        //     }
        // }

        function loadNextStep(order: Order) {
            if (IsRefunding) {
                if (order.Status === 'refunding') {
                    setBtnNextEnable(order.Refund_Slip !== null && order.Is_Refunded);
                    setButtonText('ยืนยันการคืนเงิน');
                    setBackStep(`/admin/order-management/${order.Order_ID}?controller=checkorder`);
                    setNextStep(`/admin/order-management/${order.Order_ID}?controller=refunding`);
                    setBtnSpecial(false);
                    setIsSaved(true);
                    setBtnCancelOrder(false);
                    return;
                }

                setBtnNextEnable(true);
                setButtonText('จัดการคำสั่งซื้อ');
                setBackStep(`/admin/order-management`);
                setNextStep(null);
                setBtnSpecial(false);
                setIsSaved(false);
                setBtnCancelOrder(false);
                return;
            }

            if (IsReqCancel && order.Status === 'req_cancel') {
                setBtnNextEnable(true);
                setButtonText('จัดการคำสั่งซื้อ');
                setBackStep(`/admin/order-management`);
                setNextStep(null);
                setBtnSpecial(true);
                setIsSaved(false);
                setBtnCancelOrder(false);
                return;
            }

            const v_isRefunding = order.Status === 'refunding' && order.Is_Cancelled;

            if ((order.Status === 'cancelled' || order.Status === 'refunding' || order.Status === 'refunded') || order.Is_Cancelled) {
                setBtnNextEnable(v_isRefunding);
                setButtonText(v_isRefunding ? 'ดำเนินการคืนเงิน' : 'คำสั่งซื้อถูกยกเลิก');
                setBackStep('/admin/order-management');
                setNextStep(v_isRefunding ? `/admin/order-management/${order.Order_ID}?controller=refunding` : `/admin/order-management/${order.Order_ID}?controller=checkorder`);
                setBtnSpecial(false);
                setIsSaved(false);
                setBtnCancelOrder(false);
                return;
            }

            const v_btnCancel = order.Status !== 'shipped' && order.Status !== 'delivered';

            if (IsCheckOrder) {
                const v_isPaymentChecked = order.Payment_Type === 'bank_transfer' && order.Status === 'pending' && order.Transaction_Slip !== null && order.Transaction_Status === 'pending';

                setBtnNextEnable(true);
                setButtonText(!order.Is_Confirmed && ((!v_isPaymentChecked && order.Status !== 'waiting_payment') || order.Payment_Type === 'cash_on_delivery') ? 'ยืนยันคำสั่งซื้อ' : 'ถัดไป');
                setBackStep('/admin/order-management');
                setNextStep(`/admin/order-management/${order.Order_ID}?controller=shipping`);
                setBtnSpecial(v_isPaymentChecked);
                setIsSaved(!order.Is_Confirmed && order.Status === 'pending' && (order.Payment_Type === 'cash_on_delivery' || order.Transaction_Status === 'confirmed'));
                setBtnCancelOrder(v_btnCancel);
                return;
            }

            if (IsShipping) {
                setBtnNextEnable(true);
                setButtonText('ถัดไป');
                setBackStep(`/admin/order-management/${order.Order_ID}?controller=checkorder`);
                setNextStep(`/admin/order-management/${order.Order_ID}?controller=summary`);
                setBtnSpecial(false);
                setIsSaved(true);
                setBtnCancelOrder(v_btnCancel);
                return;
            }

            if (IsSummary) {
                setBtnNextEnable(true);
                setButtonText('ถัดไป');
                setBackStep(`/admin/order-management/${order.Order_ID}?controller=shipping`);
                setNextStep(`/admin/order-management/${order.Order_ID}?controller=shipped`);
                setBtnSpecial(false);
                setIsSaved(false);
                setBtnCancelOrder(v_btnCancel);
                return;
            }

            if (IsShipped) {
                if (order.Status === 'preparing') {
                    setBtnNextEnable(true);
                    setButtonText('ยืนยันการจัดส่ง');
                    setBackStep(`/admin/order-management/${order.Order_ID}?controller=summary`);
                    setNextStep(`/admin/order-management/${order.Order_ID}?controller=shipped`);
                    setBtnSpecial(false);
                    setIsSaved(true);
                    setBtnCancelOrder(v_btnCancel);
                    return;
                }

                setBtnNextEnable(true);
                setButtonText('จัดการคำสั่งซื้อ');
                setBackStep(`/admin/order-management/${order.Order_ID}?controller=summary`);
                setNextStep(null);
                setBtnSpecial(false);
                setIsSaved(false);
                setBtnCancelOrder(v_btnCancel);
                return;
            }

            setBtnNextEnable(true);
            setButtonText('จัดการคำสั่งซื้อ');
            setBackStep(`/admin/order-management`);
            setNextStep(null);
            setBtnSpecial(false);
            setIsSaved(false);
            setBtnCancelOrder(false);
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

    }, [orderId, controller]);

    async function onSaved() {
        if (!onValidate()) return;
        if (!isSaved) return;

        if (IsCheckOrder) {
            try {
                const response = await fetch('/api/admin/order/confirm-order', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Order_ID: orderId } as Partial<Order>),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                await fetchOrderData();
                } catch (err: any) {
                showAlert(err.message, 'error');
            }
        } else if (IsShipping) {
            if (isReadOnly) return;

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
        } else if (IsShipped || IsRefunding) {
            try {
                const pStatus = IsShipped ? 'shipped' : IsRefunding ? 'refunded' : null;

                if (!pStatus) return;

                const response = await fetch('/api/admin/order', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Order_ID: orderId, Status: pStatus } as Partial<Order>),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                await fetchOrderData();
            } catch (err: any) {
                showAlert(err.message, 'error');
            }
        }
    }

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        let finalValue: any = value;

        if (type === 'checkbox') finalValue = checked;
        else if (type === 'number') finalValue = value === '' ? null : Number(value);

        setForm(prev => ({ ...prev, [name]: finalValue }));
    }, []);

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

        if (IsShipped) {
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
    
            return STEP_1_VALID && STEP_2_VALID;
        } else if (IsRefunding) {
            return order.Status !== 'refunded' || !order.Refund_Slip || order.Is_Refunded;
        }
        return true;
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

    const IsValidate = onValidate();

    const Type : STEP_TYPE = IsRefunding ? 'refund' : IsReqCancel ? 'req_cancel' : 'normal';

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="max-w-5xl mx-auto p-6 space-y-8">
                    <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
                        <StepFlowBar 
                            controller={controller || ''}
                            type={Type}
                        />
                    </div>

                    <OrderHeaderInfo order={order} />

                    {(IsCheckOrder || IsSummary || IsReqCancel) && 
                        <OrderCheckInfo 
                            order={order}
                            liveDetails={liveDetails}
                            btnSpecial={btnSpecial}
                            isReqCancel={IsReqCancel}
                            fetchOrderData={fetchOrderData}
                        />
                    }

                    {(IsShipping || IsSummary) && 
                        <OrderShippingInfo 
                            IsReadOnly={isReadOnly}
                            order={order}
                            form={form} 
                            handleFormChange={handleFormChange}
                        />
                    }

                    {IsShipped &&
                        <OrderShippedInfo 
                            isAllValid={IsValidate}
                            order={order}
                            lbButtonText={lbButtonText}
                        />
                    }

                    {IsRefunding && 
                        <OrderRefundInfo 
                            order={order}
                            selectedFile={selectedFile}
                            isUploading={isUploading}
                            handleFileChange={handleFileChange}
                            handleUploadSlip={handleUploadSlip}
                        />
                    }

                    <OrderNavigation
                        order={order}
                        backHref={BackStep || undefined}
                        nextHref={NextStep || undefined}
                        nextLabel={lbButtonText}
                        nextEnabled={IsValidate ? btnNextEnable : false}
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
