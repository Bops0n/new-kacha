"use client";
import { useEffect, useState } from "react";
import { CardBoard, CardContent, CardHeader } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { RecentOrder } from "@/types/dashboard";
import { FiTruck } from "react-icons/fi";
import { motion } from "framer-motion";
import { ORDER_STATUS_CONFIG } from "@/app/utils/client";

export function RecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentOrders() {
      try {
        const res = await fetch("/api/admin/dashboard/getRecentOrders", {
          cache: "no-store",
        });
        const { Orders } = await res.json();
        setOrders(Orders || []);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentOrders();
  }, []);

  const handleOpenOrderManagement = () => {
    window.open(`/admin/order-management`, "_blank");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <CardBoard className="shadow-md hover:shadow-lg transition-all rounded-2xl border border-gray-100 bg-white">
      <CardHeader className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-800">
          <FiTruck className="text-blue-500 text-lg" />
          <h3 className="text-lg font-semibold tracking-wide">
            คำสั่งซื้อล่าสุด
          </h3>
        </div>
        <button
          onClick={() => handleOpenOrderManagement()}
          className="text-sm text-blue-600 hover:underline hover cursor-pointer"
        >
          ดูทั้งหมด
        </button>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {orders.length > 0 ? (
          orders.map((o, index) => {
            const status = ORDER_STATUS_CONFIG[o.Status] ?? ORDER_STATUS_CONFIG.pending;
            const Icon = status.icon;

            return (
              <motion.div
                key={o.Order_ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onClick={handleOpenOrderManagement}
                className="flex flex-col bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                title="คลิกเพื่อดูรายละเอียดคำสั่งซื้อ"
              >
                {/* Order Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="inline-block bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                      หมายเลขคำสั่งซื้อ: {o.Order_ID}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {o.Customer_Name}
                      </p>
                      <p className="text-xs text-gray-500">{o.Order_Date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ฿{o.Total_Amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-gray-500">ยอดรวม</p>
                  </div>
                </div>

                {/* Status + Extra Info */}
                <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${status.bgColor} ${status.textColor}`}
                  >
                    <Icon className="text-sm" />
                    <span>{status.label}</span>
                  </div>

                  <p className="text-gray-400 italic">
                    อัปเดตล่าสุด : {o.Update_At || '-'}
                  </p>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            ไม่มีคำสั่งซื้อในระบบ
          </div>
        )}
      </CardContent>
    </CardBoard>
  );
}
