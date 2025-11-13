"use client";
import { useEffect, useState } from "react";
import { CardBoard, CardHeader, CardContent } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { RecentOrder } from "@/types/dashboard";
import { StatusConfig } from "@/types";
import { FiCheckCircle, FiClock, FiPackage, FiRefreshCw, FiTruck, FiXCircle } from "react-icons/fi";

const statusConfig: StatusConfig = {
  pending: { label: 'รอดำเนินการ', color: 'badge-warning', icon: FiClock, bgColor: 'bg-warning/10' },
  processing: { label: 'กำลังเตรียม', color: 'badge-info', icon: FiPackage, bgColor: 'bg-info/10' },
  shipped: { label: 'จัดส่งแล้ว', color: 'badge-primary', icon: FiTruck, bgColor: 'bg-primary/10' },
  delivered: { label: 'ส่งเรียบร้อย', color: 'badge-success', icon: FiCheckCircle, bgColor: 'bg-success/10' },
  refunding: { label: 'ยกเลิก: กำลังรอคืนเงิน', color: 'badge-accent', icon: FiRefreshCw, bgColor: 'bg-accent/10' },
  refunded: { label: 'ยกเลิก: คืนเงินสำเร็จ', color: 'badge-neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10' },
  cancelled: { label: 'ยกเลิก', color: 'badge-error', icon: FiXCircle, bgColor: 'bg-error/10' },
};

export function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard/getRecentOrders", { cache: "no-store" });
        const { Orders } = await res.json();
        setOrders(Orders || []);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentOrders();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <CardBoard className="h-full">
      <CardHeader>คำสั่งซื้อล่าสุด</CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>เลขที่คำสั่งซื้อ</th>
                  <th>ลูกค้า</th>
                  <th>ยอดรวม (฿)</th>
                  <th>สถานะ</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o : RecentOrder) => (
                  <tr
                    key={o.Order_ID}
                    className="hover:bg-base-200 cursor-pointer transition-colors"
                    onClick={() => window.open(`/admin/order-management`, "_blank")}
                  >
                    <td className="font-medium text-primary hover:underline">#{o.Order_ID}</td>
                    <td>{o.Customer_Name}</td>
                    <td>{o.Total_Amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${statusConfig[o.Status].color}`}>
                        {statusConfig[o.Status].label}
                      </span>
                    </td>
                    <td>{o.Order_Date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-base-content/70 py-8">
            ไม่มีคำสั่งซื้อในระบบ
          </div>
        )}
      </CardContent>
    </CardBoard>
  );
}