import { paymentTypeLabels, statusTypeLabels } from "@/app/utils/client";
import { Order } from "@/types";
import { BiCheck, BiX } from "react-icons/bi";
import { FiCheckCircle, FiCreditCard, FiInfo } from "react-icons/fi";
import { MdOutlineLocalShipping } from "react-icons/md";

type OrderShippedProps = {
    order: Order;
    isAllValid: boolean;
    lbButtonText: string;
};

export default function OrderShippedInfo({ isAllValid, order, lbButtonText }: OrderShippedProps) {
    const InfoRow = ({ label, valid }: { label: string; valid: boolean }) => (
        <div className="flex items-center justify-between py-2 border-b border-base-300">
        <span>{label}</span>
        {valid ? (
            <BiCheck className="text-green-600 w-5 h-5" />
        ) : (
            <BiX className="text-error w-5 h-5" />
        )}
        </div>
    );
    
    const STEP_1_CHECKORDER = {
        Transaction_Slip: !!order.Transaction_Slip && order.Transaction_Status !== 'rejected',
        Checked: order.Transaction_Status === 'confirmed',
        Confirmed: order.Is_Confirmed
    };
    
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
        <>
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
                            <FiCheckCircle className="w-7 h-7 text-green-600" />
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
                                    หลังจากกด <span className="font-semibold">{'"'}{lbButtonText}{'"'}</span>{" "}
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
                                <span className="font-semibold">{'"'}กรอกข้อมูลการจัดส่ง{'"'}</span> ก่อนยืนยัน
                            </div>
                        </div>
                    </div>
                </>
            }
        </>
    );
}