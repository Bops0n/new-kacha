'use client';
import AccessDeniedPage from "@/app/components/AccessDenied";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useSession } from "next-auth/react";
import { CardBoard, CardContent } from "../components/dashboard/CardBoard";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { TopProducts } from "../components/dashboard/TopProducts";
import { SalesChart } from "../components/dashboard/SalesChart";
import { LowStockProducts } from "../components/dashboard/LowStockProducts";
import { useEffect, useState } from "react";
import { FiBarChart2, FiShoppingCart, FiUsers } from "react-icons/fi";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "ยอดขายวันนี้", value: "฿0", icon: <FiBarChart2 />, color: "bg-blue-500" },
    { title: "ยอดขายเดือนนี้", value: "0", icon: <FiBarChart2 />, color: "bg-orange-500" },
    { title: "คำสั่งซื้อใหม่ (วันนี้)", value: "0", icon: <FiShoppingCart />, color: "bg-purple-500" },
    { title: "ลูกค้าทั้งหมด", value: "0", icon: <FiUsers />, color: "bg-emerald-500" },
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const result = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const { Sales_Today, Sales_Monthly, New_Orders, Total_Customers } = await result.json();
        setStats([
          { title: "ยอดขายวันนี้", value: `฿${Sales_Today.toLocaleString()}`, icon: <FiBarChart2 />, color: "bg-blue-500" },
          { title: "ยอดขายเดือนนี้", value: `฿${Sales_Monthly.toLocaleString()}`, icon: <FiBarChart2 />, color: "bg-orange-500" },
          { title: "คำสั่งซื้อใหม่ (วันนี้)", value: New_Orders.toString(), icon: <FiShoppingCart />, color: "bg-purple-500" },
          { title: "ลูกค้าทั้งหมด", value: Total_Customers.toString(), icon: <FiUsers />, color: "bg-emerald-500" },
        ]);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!session || !session.user.Dashboard) return <AccessDeniedPage url="/admin" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">แดชบอร์ดภาพรวม</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ภาพรวมสถิติร้านค้าขายวัสดุก่อสร้าง — ยอดขาย คำสั่งซื้อ สินค้า และลูกค้า
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <CardBoard
              key={s.title}
              className="shadow-sm border border-gray-100 hover:shadow-md transition-all rounded-2xl bg-gradient-to-br from-white to-gray-50"
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{s.title}</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-1">{s.value}</h2>
                </div>
                <div
                  className={`${s.color} text-white w-12 h-12 flex items-center justify-center rounded-full shadow-inner`}
                >
                  {s.icon}
                </div>
              </CardContent>
            </CardBoard>
          ))}
        </div>

        {/* Charts & Top Products */}
        <div className="grid grid-cols-1 xl:grid-cols-8 gap-6 items-stretch">
          <div className="xl:col-span-5">
            <SalesChart />
          </div>
          <div className="xl:col-span-3">
            <TopProducts />
          </div>
        </div>


        {/* Orders & Low Stock */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentOrders />
          <LowStockProducts />
        </div>
      </div>
    </div>
  );
}
