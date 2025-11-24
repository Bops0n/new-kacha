"use client";

import React from "react";

export const StepFlowBar = ({ currentStep, orderId, refund }: { currentStep: number, orderId: number, refund: boolean }) => {
  const NORMAL_STEP = [
    {
      id: 1,
      label: "ตรวจสอบการชำระเงิน",
      href: `/admin/order-management/${orderId}/checkorder`,
    },
    {
      id: 2,
      label: "ข้อมูลการจัดส่ง",
      href: `/admin/order-management/${orderId}/shipping`,
    },
    {
      id: 3,
      label: "สรุปคำสั่งซื้อ",
      href: `/admin/order-management/${orderId}/summary`,
    },
    {
      id: 4,
      label: "ยืนยันการจัดส่ง",
      href: `/admin/order-management/${orderId}/shipped`,
    }
  ];

  const REFUND_STEP = [
    {
      id: 1,
      label: "ตรวจสอบการชำระเงิน",
      href: `/admin/order-management/${orderId}/refunding`,
    },
    {
      id: 2,
      label: "ดำเนินการคืนเงิน",
      href: `/admin/order-management/${orderId}/refunded`,
    }
  ]

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
            onClick={() => { window.location.href = step.href }}
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
            onClick={() => { window.location.href = step.href }}
          >
            {step.label}
          </li>
        ))}
    </ul>
  );
};
