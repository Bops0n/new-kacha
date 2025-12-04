"use client";

import React from "react";

export type STEP_TYPE = 'normal' | 'refund' | 'req_cancel';

export const StepFlowBar = ({ controller, type }: { controller: string, type: STEP_TYPE }) => {
  const NORMAL_STEP = [
    {
      controller: `checkorder`,
      label: "ตรวจสอบการชำระเงิน",
    },
    {
      controller: `shipping`,
      label: "ข้อมูลการจัดส่ง",
    },
    {
      controller: `summary`,
      label: "สรุปคำสั่งซื้อ",
    },
    {
      controller: `shipped`,
      label: "ยืนยันการจัดส่ง",
    }
  ];

  const REFUND_STEP = [
    {
      controller: `refunding`,
      label: "ดำเนินการคืนเงิน",
    }
  ]

  const REQ_STEP = [
    {
      controller: `req_cancel`,
      label: "ร้องขอยกเลิกคำสั่งซื้อ",
    }
  ]

  return (
    <ul className="steps steps-horizontal w-full text-lg">
        {type === 'normal' && NORMAL_STEP.map((step, index) => (
          <li
            key={index}
            className={`step ${index + 1 <= NORMAL_STEP.findIndex(s => s.controller === controller) + 1 ? "step-primary" : ""} text-base font-semibold`}
            style={{
            "--size": "2.4rem",
            "--tw-border": "2px",
            } as React.CSSProperties}
            data-content={index + 1}
          >
            {step.label}
          </li>
        ))}

        {type === 'refund' && REFUND_STEP.map((step, index) => (
          <li
            key={index}
            className={`step ${index + 1 <= REFUND_STEP.findIndex(s => s.controller === controller) + 1 ? "step-primary" : ""} text-base font-semibold`}
            style={{
            "--size": "2.4rem",
            "--tw-border": "2px",
            } as React.CSSProperties}
            data-content={index + 1}
          >
            {step.label}
          </li>
        ))}

        {type === 'req_cancel' && REQ_STEP.map((step, index) => (
          <li
            key={index}
            className={`step ${index + 1 <= REQ_STEP.findIndex(s => s.controller === controller) + 1 ? "step-primary" : ""} text-base font-semibold`}
            style={{
            "--size": "2.4rem",
            "--tw-border": "2px",
            } as React.CSSProperties}
            data-content={index + 1}
          >
            {step.label}
          </li>
        ))}
    </ul>
  );
};
