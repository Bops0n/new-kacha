import { PaymentConfig, StatusConfig } from "@/types";
import { NextResponse } from "next/server";
import { BsBank, BsCash } from "react-icons/bs";
import { FiCheckCircle, FiClock, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from "react-icons/fi";

export const checkRequire = (auth : any) => {
    if (!auth.authenticated) {
        return auth.response;
    }
    if (auth.accessLevel < 0) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};

export const statusTypeLabels: StatusConfig = {
    waiting_payment: { label: 'รอชำระเงิน', color: 'text-purple-700', icon: FiClock, bgColor: 'bg-purple-50' },
    pending: { label: "รอดำเนินการ", color: "text-amber-700", icon: FiClock, bgColor: "bg-amber-50" },
    preparing: { label: "กำลังจัดเตรียม", color: "text-sky-700", icon: FiPackage, bgColor: "bg-sky-50" },
    shipped: { label: "จัดส่งแล้ว", color: "text-blue-700", icon: FiTruck, bgColor: "bg-blue-50" },
    delivered: { label: "เสร็จสิ้น", color: "text-green-700", icon: FiCheckCircle, bgColor: "bg-green-50" },
    refunding: { label: "รอคืนเงิน", color: "text-purple-700", icon: FiRefreshCw, bgColor: "bg-purple-50" },
    refunded: { label: "คืนเงินแล้ว", color: "text-gray-700", icon: FiCheckCircle, bgColor: "bg-gray-100" },
    cancelled: { label: "ยกเลิก", color: "text-red-700", icon: FiXCircle, bgColor: "bg-red-50" },
};

export const paymentTypeLabels: PaymentConfig= {
    bank_transfer: { label: 'โอนผ่านธนาคาร', color: 'text-purple-700', icon: BsBank, bgColor: 'bg-purple-50' },
    cash_on_delivery: { label: "เก็บเงินปลายทาง", color: "text-green-700", icon: BsCash, bgColor: "bg-green-50" },
};