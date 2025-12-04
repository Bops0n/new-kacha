import { OrderStatus, PaymentConfig, StatusConfig } from "@/types";
import { NextResponse } from "next/server";
import { BsBank, BsCash } from "react-icons/bs";
import { FiCheckCircle, FiClock, FiFileText, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from "react-icons/fi";
import { MdOutlinePendingActions } from "react-icons/md";

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
    preparing: { label: "กำลังเตรียมสินค้า", color: "text-sky-700", icon: FiPackage, bgColor: "bg-sky-50" },
    shipped: { label: "อยู่ระหว่างจัดส่ง", color: "text-blue-700", icon: FiTruck, bgColor: "bg-blue-50" },
    delivered: { label: "จัดส่งสำเร็จ", color: "text-green-700", icon: FiCheckCircle, bgColor: "bg-green-50" },
    refunding: { label: "รอคืนเงิน", color: "text-purple-700", icon: FiRefreshCw, bgColor: "bg-purple-50" },
    refunded: { label: "คืนเงินแล้ว", color: "text-gray-700", icon: FiCheckCircle, bgColor: "bg-gray-100" },
    req_cancel: { label: "ร้องขอยกเลิก", color: "text-red-700", icon: MdOutlinePendingActions, bgColor: "bg-red-50" },
    cancelled: { label: "ยกเลิก", color: "text-red-700", icon: FiXCircle, bgColor: "bg-red-50" },
};

export const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; textColor: string } } = {
  waiting_payment: { label: 'รอชำระเงิน', color: 'warning', icon: FiClock, bgColor: 'bg-warning/10', textColor: 'text-warning' },
  pending: { label: 'รอดำเนินการ', color: 'warning', icon: FiClock, bgColor: 'bg-warning/10', textColor: 'text-warning' },
  preparing: { label: 'กำลังเตรียมสินค้า', color: 'info', icon: FiPackage, bgColor: 'bg-info/10', textColor: 'text-info' },
  shipped: { label: 'อยู่ระหว่างจัดส่ง', color: 'primary', icon: FiTruck, bgColor: 'bg-primary/10', textColor: 'text-primary' },
  delivered: { label: 'จัดส่งสำเร็จ', color: 'success', icon: FiCheckCircle, bgColor: 'bg-success/10', textColor: 'text-success' },
  refunding: { label: 'รอคืนเงิน', color: 'secondary', icon: FiRefreshCw, bgColor: 'bg-secondary/10', textColor: 'text-secondary' },
  refunded: { label: 'คืนเงินแล้ว', color: 'success', icon: FiCheckCircle, bgColor: 'bg-success/10', textColor: 'text-success' },
  req_cancel: { label: 'ร้องขอยกเลิก', color: 'warning', icon: FiFileText, bgColor: 'bg-warning/10', textColor: 'text-warning' },
  cancelled: { label: 'ยกเลิก', color: 'error', icon: FiXCircle, bgColor: 'bg-error/10', textColor: 'text-error' },
};

export const paymentTypeLabels: PaymentConfig= {
    bank_transfer: { label: 'โอนผ่านธนาคาร', color: 'text-purple-700', icon: BsBank, bgColor: 'bg-purple-50' },
    cash_on_delivery: { label: "เก็บเงินปลายทาง", color: "text-green-700", icon: BsCash, bgColor: "bg-green-50" },
};