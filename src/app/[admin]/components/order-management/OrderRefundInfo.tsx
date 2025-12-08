import { Order } from "@/types";
import { FiCreditCard, FiUploadCloud, FiZoomIn } from "react-icons/fi";

type OrderRefundProps = {
    order: Order;
    selectedFile: File | null;
    isUploading: boolean;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadSlip?: () => void;
    handleFileChangeManual?: (file: File) => void;
    previewImage: string | null;
    setPreviewImage: (url: string | null) => void;
};

export default function OrderRefundInfo({ 
    order,
    selectedFile,
    isUploading,
    isDragging,
    setIsDragging = () => {},
    handleFileChange = () => {},
    handleUploadSlip = () => {},
    handleFileChangeManual = () => {},
    previewImage,
    setPreviewImage = () => {}
}: OrderRefundProps) {
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
                        <div 
                            className="relative group flex justify-center items-center bg-base-200 rounded-xl border border-base-300 shadow-inner p-4 cursor-zoom-in hover:shadow-xl transition"
                            onClick={() => setPreviewImage(order.Transaction_Slip!)}
                        >
                            {order.Transaction_Slip ? (
                            <>
                                <img
                                    src={order.Transaction_Slip}
                                    alt="Transaction Slip"
                                    className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                                />

                                {/* Zoom Icon */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                                    </span>
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
                        <div 
                            className="relative group flex justify-center items-center bg-base-200 rounded-xl border border-base-300 shadow-inner p-4 cursor-zoom-in hover:shadow-xl transition"
                            onClick={() => setPreviewImage(order.Refund_Slip!)}
                        >
                            {order.Refund_Slip ? (
                            <>
                                <img
                                    src={order.Refund_Slip}
                                    alt="Refund Slip"
                                    className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                                />

                                {/* Zoom Icon */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                                    </span>
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
                            <div className="mt-4 p-4 rounded-xl border border-base-300 bg-base-100 shadow-sm">

                                {/* Title */}
                                <h3 className="font-bold text-lg mb-2">อัปโหลดหลักฐานการคืนเงิน</h3>
                                <p className="text-xs text-base-content/60 mb-4">
                                    รองรับไฟล์ JPG, JPEG, PNG (ขนาดไฟล์สูงสุด 5MB)
                                </p>

                                {/* Drag & Drop Upload Box */}
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);

                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleFileChangeManual(file);
                                    }}
                                    className={`
                                        w-full h-52 border-2 border-dashed rounded-xl 
                                        flex flex-col justify-center items-center cursor-pointer transition
                                        ${isDragging ? "bg-primary/10 border-primary" : "bg-base-200 border-base-300 hover:border-primary"}
                                    `}
                                    onClick={() => {
                                        document.getElementById("refund-slip-upload")?.click();
                                    }}
                                >
                                    <FiUploadCloud className="w-10 h-10 text-base-content/60" />

                                    <p className="mt-2 text-base-content/70">คลิกเพื่อเลือกไฟล์</p>
                                    <p className="text-sm text-base-content/50">หรือวางไฟล์ลงบริเวณนี้</p>

                                    <button className="btn btn-sm mt-3">เลือกไฟล์รูปภาพ</button>

                                    <input
                                        id="refund-slip-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* File Info */}
                                {selectedFile && (
                                    <div className="mt-3 text-sm text-center text-success">
                                        ไฟล์ที่เลือก : {selectedFile.name}
                                    </div>
                                )}

                                {/* Upload Button */}
                                <button
                                    className="btn btn-primary w-full mt-4 flex gap-2 justify-center items-center"
                                    disabled={!selectedFile || isUploading}
                                    onClick={handleUploadSlip}
                                >
                                    {isUploading && <span className="loading loading-spinner"></span>}
                                    {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดหลักฐานการคืนเงิน"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}