'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getOrderNextStep, Order, OrderShipping, SimpleProductDetail } from '@/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { STEP_TYPE, StepFlowBar } from '@/app/[admin]/components/order-management/StepFlowComponent';
import { useAlert } from '@/app/context/AlertModalContext';
import { OrderNavigation } from '@/app/[admin]/components/order-management/OrderNavigation';
import OrderHeaderInfo from '@/app/[admin]/components/order-management/OrderHeaderInfo';
import OrderCheckInfo from '@/app/[admin]/components/order-management/OrderCheckInfo';
import OrderShippingInfo from '../../components/order-management/OrderShippingInfo';
import OrderShippedInfo from '../../components/order-management/OrderShippedInfo';
import OrderRefundInfo from '../../components/order-management/OrderRefundInfo';
import Link from 'next/link';
import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';

const Breadcrumbs = ({ orderId }: { orderId: number }) => {
    if (!orderId) return <div className="h-6 mb-6"></div>;
    return (
        <div className="text-sm breadcrumbs mb-6 text-base-content/70">
            <ul>
                <li><Link href="/admin/order-management" className="hover:text-primary">จัดการคำสั่งซื้อ</Link></li>
                <li><Link href={`/admin/order-management/${orderId}`} className="hover:text-primary">หมายเลขคำสั่งซื้อ: {orderId}</Link></li>
            </ul>
        </div>
    );
};

export default function OrderStepPage() {
    const { orderId } = useParams();
    const { showAlert } = useAlert();
    const { replace } = useRouter();
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

    const [form, setForm] = useState<OrderShipping>({
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

    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

    const [previewImage, setPreviewImage] = useState<string | null>(null);

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

                    const { 
                        btnNextEnable, 
                        lbButtonText, 
                        BackStep, 
                        NextStep, 
                        btnSpecial, 
                        isSaved, 
                        btnCancelOrder 
                    } = getOrderNextStep(order, controller);

                    setBtnNextEnable(btnNextEnable);
                    setButtonText(lbButtonText);
                    setBackStep(BackStep);
                    setNextStep(NextStep);
                    setBtnSpecial(btnSpecial);
                    setIsSaved(isSaved);
                    setBtnCancelOrder(btnCancelOrder);

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

    }, [orderId, controller, IsCheckOrder, IsRefunding, IsShipping, IsSummary]);

    async function onSaved(): Promise<boolean> {
        if (!onValidate()) return false;
        if (!isSaved) return false;

        if (IsCheckOrder) {
            try {
                const response = await fetch('/api/admin/order/confirm-order', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Order_ID: orderId } as Partial<Order>),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                return true;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
                showAlert(message, 'error');
            }
        } else if (IsShipping) {
            if (isReadOnly) return false;

            try {
                const response = await fetch('/api/admin/order/shipping-update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Order_ID: orderId, ...form }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                return true;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
                showAlert(message, 'error');
            }
        } else if (IsShipped || IsRefunding) {
            try {
                const pStatus = IsShipped ? 'shipped' : IsRefunding ? 'refunded' : null;

                if (!pStatus) return false;

                const response = await fetch('/api/admin/order', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Order_ID: orderId, Status: pStatus } as Partial<Order>),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                return true;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
                showAlert(message, 'error');
            }
        }
        return false;
    }

    const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        let finalValue: string | number | boolean | null = value;

        if (type === 'checkbox') finalValue = checked;
        else if (type === 'number') finalValue = value === '' ? null : Number(value);

        setForm(prev => ({ ...prev, [name]: finalValue }));
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        handleFileChangeManual(file);
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
            showAlert(message, 'error', 'เกิดข้อผิดพลาด');
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
        if (!order) return;
        if (controller) return;

        let url = "";

        if (order.Status === "refunding" || order.Status === "refunded") {
            url = `/admin/order-management/${order.Order_ID}?controller=refunding`;
        } else if (order.Status === "req_cancel") {
            url = `/admin/order-management/${order.Order_ID}?controller=req_cancel&goto=transfer_slip`;
        } else {
            url = `/admin/order-management/${order.Order_ID}?controller=checkorder`;
        }

        replace(url);
    }, [order, controller, replace]);

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

                    <Breadcrumbs orderId={order.Order_ID} />

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
                            setPreviewImage={setPreviewImage}
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
                            isDragging={isDragging}
                            setIsDragging={setIsDragging}
                            handleFileChange={handleFileChange}
                            handleUploadSlip={handleUploadSlip}
                            handleFileChangeManual={handleFileChangeManual}
                            setPreviewImage={setPreviewImage}
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

            <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        </div>
    );
}
