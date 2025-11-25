"use client";

import { useSession } from "next-auth/react";
import OrderCancelButton from "./OrderCancelButton";

type OrderNavigationProps = {
    orderId: number;
    backHref?: string;
    nextHref?: string | null;
    nextLabel?: string;
    nextEnabled?: boolean;
    btnCancelOrder?: boolean;
    fetchOrderData?: () => void;
    onValidate?: () => boolean;
    onSaved?: () => void;
};

export function OrderNavigation({
  orderId,
  backHref = "/admin/order-management",
  nextHref,
  nextLabel = "ถัดไป",
  nextEnabled = false,
  btnCancelOrder = false,
  fetchOrderData = () => {},
  onValidate = () => true,
  onSaved = () => {},
}: OrderNavigationProps) {
  const { data: session } = useSession();

  return (
    <>
      {/* Navigation Bar */}
      <div className="flex justify-between mt-6">
        <button className="btn btn-ghost" onClick={() => {
            window.location.href = backHref
          }
        }>
          ย้อนกลับ
        </button>

        <div className="flex gap-3">
            {btnCancelOrder && <OrderCancelButton orderId={orderId} onlyIcon={false} onSuccess={() => fetchOrderData()}/>}

            {/* ปุ่ม Next (ขนาดเท่ากัน) */}
            {nextHref && (
            <button
                className="btn btn-primary"
                disabled={!nextEnabled}
                type="button"
                onClick={(e) => {
                  e.preventDefault();

                  if (onValidate && !onValidate()) return;

                  if (onSaved) onSaved();

                  if (nextHref) window.location.href = nextHref;
                }}
            >
              {nextLabel}
            </button>
            )}
        </div>
      </div>
    </>
  );
}
