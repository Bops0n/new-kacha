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

    const canUploadSlip = order.Payment_Type === 'bank_transfer' && order.Status === 'refunding';

    return (
        <>
            {/* Slip + Payment Datetime */}
            {order.Payment_Type === 'bank_transfer' && (
            <div id="refunded" className="card bg-base-100 shadow-md border border-base-300 p-8 rounded-2xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                  <FiCreditCard className="text-primary w-6 h-6" />
                  <h2 className="font-bold text-lg">หลักฐานการคืนเงิน</h2>
                </div>

                {order.Payment_Type === 'bank_transfer' && (
                    <>
                        <div className="relative group flex justify-center items-center bg-base-200 rounded-2xl border border-base-300 shadow-inner p-5 cursor-pointer hover:shadow-xl transition">
                            {order.Refund_Slip ? (
                            <>
                                <img
                                    src={order.Refund_Slip}
                                    alt="Refund Slip"
                                    className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                                    onClick={() => {
                                        setPreviewImage(order.Refund_Slip!);
                                        setShowImageModal(true);
                                }}
                                />

                                {/* Zoom Icon */}
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition">
                                คลิกเพื่อขยาย
                                </div>
                            </>
                            ) : (
                            <p className="opacity-70">ยังไม่มีหลักฐานการคืนเงิน</p>
                            )}
                        </div>
                        {canUploadSlip && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 border-t border-base-300 pt-4">
                            <label className='flex flex-col items-center justify-center'>
                            <input type="file" className="file-input file-input-bordered file-input-primary w-full max-w-xs" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" placeholder='s'></input>
                                {'สามารถอัพโหลดไฟล์ขนาดไม่เกิน 5MB เท่านั้น'}
                            </label>
                                <button onClick={handleUploadSlip} disabled={!selectedFile || isUploading} className="btn btn-primary mb-auto">
                                    {isUploading && <span className="loading loading-spinner"></span>}
                                    <FiUploadCloud className="mr-2"/>
                                    {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดหลักฐาน'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Refund By */}
                <div className="mt-8 p-7 flex flex-col justify-between bg-base-200 rounded-2xl border border-base-300 shadow-inner">
                  <div className="space-y-4">
                      <div>
                          <p className="text-sm opacity-60">วันที่ – เวลาที่แนบหลักฐานการคืนเงิน</p>
                          <p className="text-xl font-bold mt-1">{order.Refund_At || "-"}</p>
                      </div>

                      <div>
                          <p className="text-sm opacity-60">ผู้บันทึกหลักฐานการคืนเงิน</p>
                          <p className="text-xl font-bold mt-1">{order.Refund_By || "-"}</p>
                      </div>
                  </div>
                </div>
            </div>
            )}

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