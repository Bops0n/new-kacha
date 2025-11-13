'use client'
import AccessDeniedPage from "@/app/components/AccessDenied";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useSession } from "next-auth/react";
import { CardBoard, CardContent } from "../components/dashboard/CardBoard";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { TopProducts } from "../components/dashboard/TopProducts";
import { SalesChart } from "../components/dashboard/SalesChart";
import { useEffect, useState } from "react";
import { FiBarChart2, FiPackage, FiShoppingCart, FiUsers } from "react-icons/fi";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    
    const [stats, setStats] = useState([
        { title: 'ยอดขายวันนี้', value: '฿0', icon: <FiBarChart2 />, color: 'bg-primary' },
        { title: 'คำสั่งซื้อใหม่', value: '0', icon: <FiShoppingCart />, color: 'bg-secondary' },
        { title: 'สินค้าคงเหลือ', value: '0', icon: <FiPackage />, color: 'bg-accent' },
        { title: 'ลูกค้าทั้งหมด', value: '0', icon: <FiUsers />, color: 'bg-info' },
    ]);
    
    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);
                const result = await fetch('/api/admin/dashboard', { cache: "no-store" });
                const { Sales_Today, New_Orders, Total_Stock, Total_Customers } = await result.json();
                setStats([
                    { title: 'ยอดขายวันนี้', value: `฿${Sales_Today.toLocaleString()}`, icon: <FiBarChart2 />, color: 'bg-primary' },
                    { title: 'คำสั่งซื้อใหม่', value: New_Orders.toString(), icon: <FiShoppingCart />, color: 'bg-secondary' },
                    { title: 'สินค้าคงเหลือ', value: Total_Stock.toString(), icon: <FiPackage />, color: 'bg-accent' },
                    { title: 'ลูกค้าทั้งหมด', value: Total_Customers.toString(), icon: <FiUsers />, color: 'bg-info' },
                ]);

            } catch {
                // handle error
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!session || !session.user.Dashboard) return <AccessDeniedPage url="/admin"/>;

    return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">แดชบอร์ดภาพรวม</h1>
              <p className="text-base-content/70 mt-1">ภาพรวมสถิติร้านค้าขายวัสดุก่อสร้าง — ยอดขาย คำสั่งซื้อ และลูกค้า</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <CardBoard key={s.title}>
              <CardContent className="flex justify-between items-center p-6">
                <div>
                  <p className="text-sm text-gray-400">{s.title}</p>
                  <h2 className="text-2xl font-bold">{s.value}</h2>
                </div>
                <div className={`${s.color} text-white p-3 rounded-full`}>{s.icon}</div>
              </CardContent>
            </CardBoard>
          ))}
        </div>

        {/* Sales Chart Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <SalesChart />
        </div>

        {/* Bottom Section: Top Products & Recent Orders */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TopProducts />
          <RecentOrders />
        </div>
      </div>
    </div>
  );
}