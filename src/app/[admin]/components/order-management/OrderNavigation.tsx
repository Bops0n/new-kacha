"use client";

import { Order } from "@/types";
import OrderCancelButton from "./OrderCancelButton";
import { useRouter } from "next/navigation";

type OrderNavigationProps = {
    order: Order;
    backHref?: string;
    nextHref?: string | null;
    nextLabel?: string;
    nextEnabled?: boolean;
    btnCancelOrder?: boolean;
    fetchOrderData?: () => void;
    onValidate?: () => boolean;
    onSaved?: () => Promise<boolean>;
};

export function OrderNavigation({
  order,
  backHref = "/admin/order-management",
  nextHref,
  nextLabel = "ถัดไป",
  nextEnabled = false,
  btnCancelOrder = false,
  fetchOrderData = () => {},
  onValidate = () => true,
  onSaved = () => Promise.resolve(true),
}: OrderNavigationProps) {
  const { push } = useRouter();

  return (
    <>
      {/* Navigation Bar */}
      <div className="flex justify-between mt-6">
        <button className="btn btn-ghost" onClick={() => {
            push(backHref);
          }
        }>
          ย้อนกลับ
        </button>

        <div className="flex gap-3">
            {btnCancelOrder && <OrderCancelButton order={order} onlyIcon={false} onSuccess={() => fetchOrderData()}/>}

            {/* ปุ่ม Next (ขนาดเท่ากัน) */}
            {nextHref && (
            <button
                className="btn btn-primary"
                disabled={!nextEnabled}
                type="button"
                onClick={async (e) => {
                  e.preventDefault();

                  if (onValidate && !onValidate()) return;

                  if (onSaved) {
                    const isSaved = await onSaved();
                    if (isSaved) {
                      fetchOrderData();
                    }
                  }

                  if (nextHref) push(nextHref);
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
