import { Order } from "@/types";
import { FiCreditCard, FiUploadCloud } from "react-icons/fi";
import { useState } from "react";

type OrderRefundProps = {
    order: Order;
    selectedFile: File | null;
    isUploading: boolean;
    handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadSlip?: () => void;
};

export default function OrderRefundInfo({ 
    order,
    selectedFile,
    isUploading,
    handleFileChange = () => {},
    handleUploadSlip = () => {}
}: OrderRefundProps) {
    const [showImageModal, setShowImageModal] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const canUploadSlip = order.Payment_Type === 'bank_transfer' && order.Status === 'refunding' && !order.Refund_Slip;

    return (
        <>
            {/* Main Container */}
            <div className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-2xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <FiCreditCard className="text-primary w-6 h-6" />
                    <h2 className="font-bold text-lg">รายละเอียดการชำระเงิน / การคืนเงิน</h2>
                </div>

                {/* 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ================= LEFT : REFUND ================= */}
                    <div className="flex flex-col gap-4">
                        {/* Payment Slip */}
                        <div className="relative group flex justify-center items-center bg-base-200 rounded-xl border border-base-300 shadow-inner p-4 cursor-pointer hover:shadow-xl transition">
                            {order.Transaction_Slip ? (
                            <>
                                <img
                                    src={order.Transaction_Slip}
                                    alt="Transaction Slip"
                                    className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                                    onClick={() => {
                                        if (!order.Transaction_Slip) return;
                                        setPreviewImage(order.Transaction_Slip);
                                        setShowImageModal(true);
                                }}
                                />

                                {/* Zoom Icon */}
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition">
                                    คลิกเพื่อขยาย
                                </div>
                            </>
                            ) : (
                                <p className="opacity-70 text-center">ยังไม่มีหลักฐานการชำระเงิน</p>
                            )}
                        </div>

                        {/* Payment Info */}
                        <div className="bg-base-200 p-4 rounded-xl border border-base-300 shadow-inner">
                            <p className="text-sm opacity-60">วันที่ – เวลาที่แนบหลักฐาน</p>
                            <p className="font-bold">{order.Transaction_Date || "-"}</p>

                            <p className="text-sm opacity-60 mt-3">วันที่ – เวลาที่ตรวจสอบ</p>
                            <p className="font-bold">{order.Checked_At || "-"}</p>

                            <p className="text-sm opacity-60 mt-3">ผู้ตรวจสอบ</p>
                            <p className="font-bold">{order.Checked_By || "-"}</p>
                        </div>
                    </div>

                    {/* ================= RIGHT : PAYMENT ================= */}
                    <div className="flex flex-col gap-4">
                        {/* Refund Slip */}
                        <div className="relative group flex justify-center items-center bg-base-200 rounded-xl border border-base-300 shadow-inner p-4 cursor-pointer hover:shadow-xl transition">
                            {order.Refund_Slip ? (
                            <>
                                <img
                                    src={order.Refund_Slip}
                                    alt="Refund Slip"
                                    className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                                    onClick={() => {
                                        if (!order.Refund_Slip) return;
                                        setPreviewImage(order.Refund_Slip);
                                        setShowImageModal(true);
                                }}
                                />

                                {/* Zoom Icon */}
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition">
                                คลิกเพื่อขยาย
                                </div>
                            </>
                            ) : (
                                <p className="opacity-70 text-center">ยังไม่มีหลักฐานการคืนเงิน</p>
                            )}
                        </div>

                        {/* Refund Info */}
                        <div className="bg-base-200 p-4 rounded-xl border border-base-300 shadow-inner">
                            <p className="text-sm opacity-60">วันที่ – เวลาการคืนเงิน</p>
                            <p className="font-bold">{order.Refund_At || "-"}</p>

                            <p className="text-sm opacity-60 mt-3">ผู้บันทึกหลักฐานการคืนเงิน</p>
                            <p className="font-bold">{order.Refund_By || "-"}</p>
                        </div>

                        {/* Upload Refund Slip */}
                        {canUploadSlip && (
                            <div className="border-t border-base-300 pt-4 flex flex-col gap-3">
                                <input
                                    type="file"
                                    className="file-input file-input-bordered file-input-primary w-full"
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg, image/jpg"
                                />

                                <button
                                    onClick={handleUploadSlip}
                                    disabled={!selectedFile || isUploading}
                                    className="btn btn-primary w-full"
                                >
                                    {isUploading && <span className="loading loading-spinner"></span>}
                                        <FiUploadCloud />
                                    {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดหลักฐานการคืนเงิน"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showImageModal && (
            <div
                className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
                onClick={() => setShowImageModal(false)}
            >
                <div
                className="relative bg-base-100 rounded-xl shadow-2xl p-4 max-w-3xl w-full"
                onClick={(e) => e.stopPropagation()}
                >
                <button
                    onClick={() => setShowImageModal(false)}
                    className="btn btn-sm btn-circle absolute right-3 top-3"
                >
                    ✕
                </button>

                <img
                    src={previewImage}
                    className="max-h-[90vh] rounded-lg shadow-lg object-contain"
                />
                </div>
            </div>
            )}
        </>
    );
}