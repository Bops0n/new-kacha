import { formatPrice } from "@/app/utils/formatters";
import { Order, OrderProductDetail, SimpleProductDetail } from "@/types";
import { FiAlertTriangle, FiArchive, FiCreditCard, FiImage, FiShoppingBag } from "react-icons/fi";
import { useAlert } from "@/app/context/AlertModalContext";
import { useSession } from "next-auth/react";
import { calculateAvailableStock } from "@/app/utils/calculations";
import { useState } from "react";

const OrderItemDetail: React.FC<{ orderProduct: OrderProductDetail; liveProduct: SimpleProductDetail; }> = ({ orderProduct, liveProduct }) => {
  const name = liveProduct?.Name || orderProduct.Product_Name;
  const imageUrl = liveProduct?.Image_URL || orderProduct.Product_Image_URL;
  const availableStock = calculateAvailableStock(liveProduct);
  const isStockInsufficient = typeof availableStock !== 'undefined' && availableStock < orderProduct.Quantity;
  const hasDiscount = orderProduct.Product_Discount_Price !== null && orderProduct.Product_Discount_Price < orderProduct.Product_Sale_Price;
  const pricePaidPerItem = orderProduct.Product_Discount_Price ?? orderProduct.Product_Sale_Price;
  const subtotal = pricePaidPerItem * orderProduct.Quantity;

  return (
    <div className="card card-side bg-base-100 shadow-sm rounded-xl border border-base-300 p-2">
      <figure className="pl-2 flex-shrink-0">
        <div className="avatar w-20 h-20">
          <div className="w-20 rounded-lg bg-base-200 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
            ) : (
              <FiImage className="w-10 h-10 text-base-content/30" />
            )}
          </div>
        </div>
      </figure>

      <div className="card-body p-3 flex-grow">
        <h2 className="card-title text-base font-bold leading-tight" title={name}>
          {name}
        </h2>

        <div className="text-sm space-y-1 mt-1">
          <div className="flex items-center gap-2 text-base-content/80">
            <FiShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span>จำนวนที่สั่ง: <span className="font-bold text-primary">{orderProduct.Quantity}</span> {orderProduct.Product_Unit}</span>
          </div>

          {typeof availableStock !== 'undefined' && (
            <div className={`flex items-center gap-2 ${isStockInsufficient ? 'text-error' : 'text-success'}`}>
              <FiArchive className="w-4 h-4 flex-shrink-0" />
              <span>คงเหลือในคลัง: <span className="font-bold">{availableStock}</span> ชิ้น</span>
            </div>
          )}
        </div>

        {isStockInsufficient && (
          <div className="badge badge-error gap-1 mt-2">
            <FiAlertTriangle className="w-3 h-3" /> สินค้าไม่พอ
          </div>
        )}
      </div>

      <div className="flex-shrink-0 text-right pr-4">
        {hasDiscount && (
          <p className="text-sm text-base-content/50 line-through">
            {formatPrice(orderProduct.Product_Sale_Price)}
          </p>
        )}

        <p className="text-base font-semibold">{formatPrice(pricePaidPerItem)}</p>
        <p className="text-xs text-base-content/70">x {orderProduct.Quantity}</p>

        <div className="divider my-0"></div>

        <p className="text-lg font-bold text-primary">{formatPrice(subtotal)}</p>
      </div>
    </div>
  );
};

type OrderCheckProps = {
    order: Order;
    liveDetails: Map<number, SimpleProductDetail>;
    btnSpecial: boolean;
    fetchOrderData?: () => void;
};

export default function OrderCheckInfo({ 
    order,
    liveDetails,
    btnSpecial,
    fetchOrderData = () => {}
}: OrderCheckProps) {
    const { showAlert } = useAlert();

      const [showImageModal, setShowImageModal] = useState(false);
      const [previewImage, setPreviewImage] = useState("");

    async function verifyPayment(action: "confirmed" | "rejected") {
        showAlert(`ต้องการ${action === "confirmed" ? "ยืนยัน" : "ปฏิเสธ"}การชำระเงินหรือไม่?`, "info", "", async () => {
            const res = await fetch("/api/admin/order/payment-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: order.Order_ID,
                action: action
            })
            });

            const result = await res.json();
            showAlert(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                fetchOrderData();
            }
        });
    }

    return (
        <>
            {/* Product List */}
            <div id="product_list" className="card bg-base-100 shadow-md border border-base-300 p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                    <FiShoppingBag className="text-primary w-5 h-5" />
                    <h2 className="font-bold text-lg">รายการสินค้า</h2>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {order.Products.map((p, idx) => (
                        <OrderItemDetail
                        key={idx}
                        orderProduct={p}
                        liveProduct={liveDetails.get(p.Product_ID!)!}
                        />
                    ))}
                </div>
            </div>


            {/* Total */}
            <div id="total_sum" className="card bg-base-100 shadow-md border border-base-300 p-4 rounded-xl flex justify-between items-center">
                <h2 className="font-bold text-lg">ยอดรวมทั้งสิ้น</h2>
                <p className="text-3xl font-bold text-primary">{formatPrice(order.Total_Amount)}</p>
            </div>

            {/* Transfer Slip */}
            {order.Payment_Type === 'bank_transfer' && (
            <div id="transfer_slip" className="card bg-base-100 shadow-md border border-base-300 p-8 rounded-2xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                  <FiCreditCard className="text-primary w-6 h-6" />
                  <h2 className="font-bold text-lg">หลักฐานการชำระเงิน</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* LEFT — Slip Image */}
                  <div className="relative group flex justify-center items-center bg-base-200 rounded-2xl border border-base-300 shadow-inner p-5 cursor-pointer hover:shadow-xl transition">
                      {order.Transaction_Slip ? (
                      <>
                          <img
                            src={order.Transaction_Slip}
                            alt="Transaction Slip"
                            className="max-w-full max-h-[25rem] rounded-xl object-contain shadow-md transition-transform group-hover:scale-[1.05]"
                            onClick={() => {
                                setPreviewImage(order.Transaction_Slip!);
                                setShowImageModal(true);
                          }}
                          />

                          {/* Zoom Icon */}
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition">
                          คลิกเพื่อขยาย
                          </div>
                      </>
                      ) : (
                      <p className="opacity-70">ยังไม่มีหลักฐานการโอนเงิน</p>
                      )}
                  </div>

                  {/* RIGHT — Details */}
                  <div className="p-7 flex flex-col justify-between bg-base-200 rounded-2xl border border-base-300 shadow-inner">

                      {/* Info Section */}
                      <div className="space-y-4">

                        <div>
                            <p className="text-sm opacity-60">วันที่ – เวลาที่แนบหลักฐาน</p>
                            <p className="text-xl font-bold mt-1">{order.Transaction_Date || "-"}</p>
                        </div>

                        <div>
                            <p className="text-sm opacity-60">วันที่ – เวลาที่ตรวจสอบ</p>
                            <p className="text-xl font-bold mt-1">{order.Checked_At || "-"}</p>
                        </div>

                        <div>
                            <p className="text-sm opacity-60">ผู้ตรวจสอบ</p>
                            <p className="text-xl font-bold mt-1">{order.Checked_By || "-"}</p>
                        </div>

                        <div className="divider my-5"></div>

                        <div>
                            <p className="text-sm opacity-60">หมายเหตุ</p>
                            <p className="text-sm text-base-content/80">กรุณาตรวจสอบว่าข้อมูลตรงกับสลิป</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-8 bg-base-200 rounded-xl border border-base-200">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-3">

                            {/* ปุ่มปฏิเสธ */}
                            <button
                            className={`
                                btn w-full md:w-40 btn-outline btn-error 
                                ${btnSpecial ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
                            `}
                            onClick={() => verifyPayment("rejected")}
                            disabled={!btnSpecial}
                            >
                            ✘ ปฏิเสธ
                            </button>

                            {/* ปุ่มยืนยัน */}
                            <button
                            className={`
                                btn w-full md:w-40 btn-success 
                                ${btnSpecial ? '' : 'btn-disabled opacity-50 cursor-not-allowed'}
                            `}
                            onClick={() => verifyPayment("confirmed")}
                            disabled={!btnSpecial}
                            >
                            ✔ ยืนยัน
                            </button>

                        </div>
                      </div>
                  </div>
                </div>

                {/* Confirmed By */}
                <div className="mt-8 p-7 flex flex-col justify-between bg-base-200 rounded-2xl border border-base-300 shadow-inner">
                  <div className="space-y-4">
                      <div>
                          <p className="text-sm opacity-60">วันที่ – เวลาที่ยืนยันคำสั่งซื้อ</p>
                          <p className="text-xl font-bold mt-1">{order.Confirmed_At || "-"}</p>
                      </div>

                      <div>
                          <p className="text-sm opacity-60">ผู้ยืนยันคำสั่งซื้อ</p>
                          <p className="text-xl font-bold mt-1">{order.Confirmed_By || "-"}</p>
                      </div>
                  </div>
                </div>
            </div>
            )}

            {/* Refund Slip */}
            {order.Payment_Type === 'bank_transfer' && order.Is_Refunded && order.Status === 'cancelled' && (
            <div id="refund_slip" className="card bg-base-100 shadow-md border border-base-300 p-8 rounded-2xl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                  <FiCreditCard className="text-primary w-6 h-6" />
                  <h2 className="font-bold text-lg">หลักฐานการคืนเงิน</h2>
                </div>

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
                    <p className="opacity-70">ยังไม่มีหลักฐานการโอนเงิน</p>
                  )}
                </div>

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