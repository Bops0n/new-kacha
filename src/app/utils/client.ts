import { PaymentConfig, StatusConfig } from "@/types";
import { AUTH_CHECK } from "@/types/auth.types";
import { NextResponse } from "next/server";
import { BsBank, BsCash } from "react-icons/bs";
import { FiCheckCircle, FiClock, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from "react-icons/fi";
import { MdOutlinePendingActions } from "react-icons/md";

export const checkRequire = (auth: AUTH_CHECK) => {
    if (!auth.authenticated) return auth.response;
    if (auth.accessLevel < 0) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    return null;
};

export const ORDER_STATUS_CONFIG: StatusConfig = {
    waiting_payment: { 
        label: 'รอชำระเงิน', 
        icon: FiClock, 
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
    },
    pending: { 
        label: "รอดำเนินการ", 
        icon: FiClock, 
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
    },
    preparing: { 
        label: "กำลังเตรียมสินค้า", 
        icon: FiPackage, 
        bgColor: 'bg-sky-100',
        textColor: 'text-sky-600',
    },
    shipped: { 
        label: "อยู่ระหว่างจัดส่ง", 
        icon: FiTruck, 
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
    },
    delivered: { 
        label: "จัดส่งสำเร็จ", 
        icon: FiCheckCircle, 
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
    },
    refunding: { 
        label: "รอคืนเงิน", 
        icon: FiRefreshCw,
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-800',
    },
    refunded: { 
        label: "คืนเงินแล้ว", 
        icon: FiCheckCircle, 
        bgColor: 'bg-gray-200',
        textColor: 'text-gray-800',
    },
    req_cancel: { 
        label: "ร้องขอยกเลิก", 
        icon: MdOutlinePendingActions, 
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-800',
    },
    cancelled: { 
        label: "ยกเลิก", 
        icon: FiXCircle, 
        bgColor: 'bg-red-200',
        textColor: 'text-red-900',
    },
};

export const PAYMENT_METHOD_CONFIG: PaymentConfig = {
    bank_transfer: { 
        label: 'โอนผ่านธนาคาร', 
        icon: BsBank, 
        bgColor: 'bg-purple-100', 
        textColor: 'text-purple-700'
    },
    cash_on_delivery: { 
        label: "เก็บเงินปลายทาง", 
        icon: BsCash, 
        bgColor: "bg-green-100",
        textColor: "text-green-800"
    },
};