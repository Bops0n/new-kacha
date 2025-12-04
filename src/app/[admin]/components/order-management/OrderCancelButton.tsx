"use client";

import { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/app/context/AlertModalContext";
import { FiInfo, FiXCircle } from "react-icons/fi";
import { paymentTypeLabels, statusTypeLabels } from "@/app/utils/client";
import { Order } from "@/types";
import { useRouter } from "next/navigation";

export default function OrderCancelButton({ order, onlyIcon, onSuccess }: {
  order: Order;
  onlyIcon: boolean;
  onSuccess?: () => void;
}) {
  const { showAlert } = useAlert();
  const { push } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [btnDisable, setBtnDisable] = useState(false);
  const [lbButtonText, setButtonText] = useState("");
  const [isNoPaymentChecked, setNoPaymentChecked] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [href, setHref] = useState<string | null>(null);

  const fetchOrderData = useCallback(async () => {
    // async function loadNextStep(orderId: number) {
    //     const response = await fetch(`/api/admin/order/req-cancel-step?orderId=${orderId}`);
    //     const result = await response.json();
    //     if (result && result.length > 0) {
    //         const data = result[0];
    //         setBtnDisable(data.btnDisable);
    //         setButtonText(data.lbButtonText);
    //         setNoPaymentChecked(data.isNoPaymentChecked);
    //         setIsRefunding(data.isRefunding);
    //         setIsCancelled(data.isCancelled);
    //         setHref(data.Href);
    //     }
    // }

    // await loadNextStep(order.Order_ID);

    const isCOD = order.Payment_Type === 'cash_on_delivery';

    const v_isNoPaymentChecked = !isCOD && 
      order.Transaction_Slip !== null && 
      !order.Is_Payment_Checked && 
      order.Transaction_Status === 'pending' &&
      order.Status === 'pending' && 
      !order.Is_Confirmed;

    if (order.Status === 'cancelled' || order.Status === 'refunding' || order.Status === 'refunded') {
      setBtnDisable(false);
      setButtonText('คำสั่งซื้อถูกยกเลิกแล้ว');
      setNoPaymentChecked(v_isNoPaymentChecked);
      setIsRefunding(false);
      setIsCancelled(false);
      setHref(null);
      return;
    }

    const v_lock = order.Status === 'shipped' || order.Status === 'delivered';

    const v_isRefunding = !isCOD && order.Transaction_Slip !== null && order.Is_Payment_Checked && order.Transaction_Status === 'confirmed' && order.Status === 'preparing' && order.Is_Confirmed;

    if (v_isRefunding) {
      setHref(`/admin/order-management/${order.Order_ID}?controller=refunding`);
    }

    setIsCancelled(v_lock ? false : !v_isRefunding);

    if (isCancelled) {
      setHref(`/admin/order-management`);
    }

    if (v_isNoPaymentChecked) {
      setBtnDisable(false);
      setHref(`/admin/order-management/${order.Order_ID}?controller=checkorder&goto=transfer_slip`);
    } else {
      setBtnDisable(v_lock);
    }

    setButtonText(btnDisable ? 'ไม่สามารถยกเลิกได้' : v_isNoPaymentChecked ? 'ดำเนินการตรวจสอบหลักฐาน' : 'ยืนยัน');
    setNoPaymentChecked(v_isNoPaymentChecked);
    setIsRefunding(v_isRefunding);
  }, [order]);

  async function submitCancel() {
    if (!reason.trim()) {
        setError("กรุณาระบุเหตุผลในการยกเลิกคำสั่งซื้อ");
        return;
    }

    setError(null);

    try {
      setLoading(true);

      const res = await fetch("/api/admin/order/req-cancel-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Order_ID: order.Order_ID, Reason: reason })
      });

      const { Is_Success, Message, Href } = await res.json();

      if (Is_Success && onSuccess) {
        onSuccess();
      }

      showModal(false);

      showAlert(Message, Is_Success ? "success" : "error", 'ยกเลิกคำสั่งซื้อ', async () => {
        if (Is_Success && Href) {
          push(Href);
        }
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
        fetchOrderData();
    }, [fetchOrderData]);

  if (!order) {
    const btnText = loading ? 'รอซักครู่...' : 'ไม่สามารถยกเลิกได้';
    return (
      <>
        {!onlyIcon ? (
            <button
              className="btn btn-warning"
              disabled
            >
              {btnText}
            </button>
          ) : (
            <button
              className="btn btn-sm btn-ghost btn-square text-error" 
              disabled
              title={btnText}
            >
              <FiXCircle className="w-4 h-4" />
            </button>
          )
        }
      </>
    );
  }

  const currentStatus = statusTypeLabels[order.Status];
  const pending = statusTypeLabels['pending'];
  const refunding = statusTypeLabels['refunding'];
  const cancelled = statusTypeLabels['cancelled'];
  
  const lbCOD = paymentTypeLabels['cash_on_delivery'];

  const modalId = `cancelOrderModal_${order.Order_ID}`;

  function showModal(type: boolean) {
    if (type) {
      setError(null);
      (document.getElementById(modalId) as any).showModal();
    } else {
      setError(null);
      (document.getElementById(modalId) as any).close();
    }
  }

  return (
    <>
      {/* ปุ่มหลัก */}
      {!onlyIcon ? (
          <button
            className="btn btn-warning"
            onClick={(e) => {
              e.stopPropagation();
              showModal(true);
            }}
          >
            ยกเลิกคำสั่งซื้อ
          </button>
        ) : (
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation();
              showModal(true);
            }}
            title="ยกเลิกคำสั่งซื้อ"
          >
            <FiXCircle className="w-4 h-4" />
          </button>
        )
      }

      {/* Modal */}
      <dialog 
        id={modalId} 
        className="modal" 
        onClick={(e) => { 
          e.stopPropagation();
          showModal(false);
        }}
      >
        <div 
          className="modal-box" 
          onClick={(e) => { 
            e.stopPropagation();
          }}
        >
          {!isNoPaymentChecked ? (
            <>
              <h3 className="font-bold text-lg">ยกเลิกคำสั่งซื้อ: {order.Order_ID}</h3>
              <p className="mt-2 text-sm opacity-70">กรุณาระบุเหตุผลในการยกเลิกคำสั่งซื้อ</p>

              <textarea
                className="textarea textarea-bordered w-full mt-3 mb-3"
                rows={10}
                placeholder="เหตุผล..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              {error && <div className="alert alert-error mb-3">{error}</div>}

              {/* Confirm Card */}
              <div className="card bg-base-100 shadow-md border border-base-300 p-3 rounded-xl h-fit">
                  <div className="flex items-center gap-3 mb-4">
                      <FiXCircle className="w-7 h-7 text-error" />
                      <div>
                          <h2 className="font-bold text-lg">ยืนยันการยกเลิกคำสั่งซื้อ</h2>
                          <p className="text-sm text-base-content/70">
                            โปรดตรวจสอบให้แน่ใจ หากทำการยกเลิกแล้ว จะไม่สามารถดำเนินการคำสั่งซื้อได้อีก
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
                                {isRefunding &&
                                  <>
                                    หากคำสั่งซื้อได้รับการชำระเงินและตรวจสอบแล้ว ระบบจะเปลี่ยนสถานะคำสั่งซื้อเป็น{" "}
                                    <span className={`badge ${refunding.color }`}>
                                        <refunding.icon className="inline-block w-4 h-4 mr-1" />
                                        {refunding.label}
                                    </span>{" "}เพื่อดำเนินการขั้นตอนการคืนเงินต่อไป
                                  </>
                                }
                                {isCancelled &&
                                  <>
                                    <br/>
                                    1. หากคำสั่งซื้อ ยังไม่ได้ชำระเงิน<br/>
                                    2. หรือคำสั่งซื้อเป็นแบบ{" "}
                                    <span className={`badge ${lbCOD?.color || 'badge-primary'}`}>
                                      <lbCOD.icon className="inline-block w-4 h-4 mr-1" />
                                      {lbCOD?.label || order.Payment_Type}
                                    </span><br/>
                                    ระบบจะเปลี่ยนสถานะคำสั่งซื้อเป็น{" "}
                                    <span className={`badge ${cancelled.color }`}>
                                        <cancelled.icon className="inline-block w-4 h-4 mr-1" />
                                        {cancelled.label}
                                    </span>{" "}<br/>
                                    และจะไม่สามารถดำเนินการใด ๆ กับคำสั่งซื้อนี้ได้อีก
                                  </>
                                }
                            </p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="modal-action">
                <button className="btn w-full md:w-24" onClick={(e) => {
                    e.stopPropagation();
                    showModal(false);
                  }}>
                  ปิด
                </button>

                <button className={`btn btn-error w-full md:w-24 text-white`} onClick={submitCancel} disabled={btnDisable}>
                  {lbButtonText}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirm Card */}
              <div className="card bg-base-100 shadow-md border border-base-300 p-3 rounded-xl h-fit">
                  <div className="flex items-center gap-3 mb-4">
                      <FiXCircle className="w-7 h-7 text-error" />
                      <div>
                          <h2 className="font-bold text-lg">ไม่สามารถยกเลิกคำสั่งซื้อ: {order.Order_ID}</h2>
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
                                ยังไม่ได้มีการตรวจสอบหลักฐานการชำระเงิน กรุณากดปุ่ม{" "}
                                <span className="font-semibold">"{lbButtonText}"</span>{" "}
                                เพื่อดำเนินการต่อ
                            </p>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="modal-action">
                <button 
                  className="btn w-full md:w-24" 
                  onClick={(e) => {
                    e.stopPropagation();
                    showModal(false);
                  }}
                >
                  ปิด
                </button>

                <button 
                  className={`btn btn-warning text-white`} 
                  onClick={() => {
                    if (href) {
                      push(href);
                    }
                  }}
                >
                  {lbButtonText}
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
