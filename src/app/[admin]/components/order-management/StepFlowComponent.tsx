"use client";

import { useRouter } from "next/navigation";
import React from "react";

export const StepFlowBar = ({ currentStep, orderId, refund }: { currentStep: number, orderId: number, refund: boolean }) => {
  const NORMAL_STEP = [
    {
      id: 1,
      label: "ตรวจสอบการชำระเงิน",
      controller: `checkorder`,
    },
    {
      id: 2,
      label: "ข้อมูลการจัดส่ง",
      controller: `shipping`,
    },
    {
      id: 3,
      label: "สรุปคำสั่งซื้อ",
      controller: `summary`,
    },
    {
      id: 4,
      label: "ยืนยันการจัดส่ง",
      controller: `shipped`,
    }
  ];

  const REFUND_STEP = [
    {
      id: 1,
      label: "ตรวจสอบการชำระเงิน",
      controller: `refunding`,
    },
    {
      id: 2,
      label: "ดำเนินการคืนเงิน",
      controller: `refunded`,
    }
  ]

  const { push } = useRouter();

  return (
    <ul className="steps steps-horizontal w-full text-lg">
        {!refund && NORMAL_STEP.map((step) => (
          <li
            key={step.id}
            className={`step ${step.id <= currentStep ? "step-primary" : ""} text-base font-semibold hover cursor-pointer`}
            style={{
            "--size": "2.4rem",
            "--tw-border": "2px",
            } as React.CSSProperties}
            data-content={step.id}
            onClick={() => { push(`/admin/order-management/${orderId}?controller=${step.controller}`) }}
          >
            {step.label}
          </li>
        ))}

        {refund && REFUND_STEP.map((step) => (
          <li
            key={step.id}
            className={`step ${step.id <= currentStep ? "step-primary" : ""} text-base font-semibold hover cursor-pointer`}
            style={{
            "--size": "2.4rem",
            "--tw-border": "2px",
            } as React.CSSProperties}
            data-content={step.id}
            onClick={() => { push(`/admin/order-management/${orderId}?controller=${step.controller}`) }}
          >
            {step.label}
          </li>
        ))}
    </ul>
  );
};
