import { PAYMENT_METHOD_CONFIG, ORDER_STATUS_CONFIG } from "@/app/utils/client";
import { formatDateTimeShort } from "@/app/utils/formatters";
import { Order } from "@/types";
import { FiFileText, FiMapPin, FiUser } from "react-icons/fi";

export default function OrderHeaderInfo({ order }: { order: Order }) {
    const paymentMethod = PAYMENT_METHOD_CONFIG[order.Payment_Type];
    const statusInfo = ORDER_STATUS_CONFIG[order.Status];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div id="customer_info" className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <FiUser className="text-primary w-5 h-5" />
                    <h2 className="font-bold text-lg">ข้อมูลลูกค้า</h2>
                </div>

                <div className="text-sm space-y-1">
                    <p><strong>ชื่อ :</strong> {order.Customer_Name}</p>
                    <p><strong>เบอร์โทรติดต่อ :</strong> {order.Phone || '-'}</p>
                    <p><strong>อีเมล :</strong> {order.Customer_Email || '-'}</p>
                    <br />
                    <p className="flex gap-1">
                        <FiMapPin className="mt-1" />
                        <span>
                        {order.Address_1} {order.Address_2} {order.Sub_District} {order.District}, {order.Province} {order.Zip_Code}
                        </span>
                    </p>
                </div>
            </div>

            {/* Order Info */}
            <div  id="order_info" className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <FiFileText className="text-primary w-5 h-5" />
                    <h2 className="font-bold text-lg">ข้อมูลคำสั่งซื้อ</h2>
                </div>

                <div className="text-sm space-y-1">
                    <p><strong>หมายเลขคำสั่งซื้อ :</strong> {order.Order_ID}</p>
                    <p><strong>วันที่สั่ง :</strong> {formatDateTimeShort(order.Order_Date)}</p>
                    <p><strong>ประเภทการชำระเงิน : </strong>
                        <span className={`badge ${paymentMethod.textColor} ${paymentMethod.bgColor}`}>
                            <paymentMethod.icon className="inline-block w-4 h-4 mr-1" />
                            {paymentMethod?.label || order.Payment_Type}
                        </span>
                    </p>
                    <p><strong>สถานะคำสั่งซื้อ : </strong>
                        <span className={`badge ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.icon && <statusInfo.icon className="w-3 h-3 mr-1" />} 
                            {statusInfo.label}
                        </span>
                    </p>
                    {order.Received_At && (
                        <p><strong>รับสินค้าแล้วเมื่อ :</strong> {formatDateTimeShort(order.Received_At)}</p>
                    )}
                    {order.Is_Cancelled && (
                        <>
                            <div className="divider my-5"></div>
                            <p><strong>วันที่ยกเลิก :</strong> {formatDateTimeShort(order.Cancel_Date)}</p>
                            <p><strong>ยกเลิกโดย :</strong> {order.Cancel_By || '-'}</p>
                            <p><strong>เหตุผลที่ยกเลิก :</strong> {order.Cancel_Reason || '-'}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}