"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { CardBoard, CardHeader, CardContent } from "./CardBoard";
import { PEROID_TYPE, SalesData } from "@/types/dashboard";
import { FiBarChart2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/app/utils/formatters";

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [period, setPeriod] = useState<PEROID_TYPE>("weekly");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/admin/dashboard/getSales?mode=${period}`, {
          cache: "no-store",
        });
        const { Data } = await res.json();
        setData(Data || []);
      } catch {
        // ignore
      }
    }
    fetchData();
  }, [period]);

  const labelMap: Record<string, string> = {
    daily: "รายวัน (30 วันล่าสุด)",
    weekly: "รายสัปดาห์ (7 วันล่าสุด)",
    monthly: "รายเดือน (ปีนี้)",
    quarterly: "รายไตรมาส",
    yearly: "รายปี",
  };

  const periods = [
    { key: "daily", label: "รายวัน" },
    { key: "weekly", label: "รายสัปดาห์" },
    { key: "monthly", label: "รายเดือน" },
    { key: "quarterly", label: "รายไตรมาส" },
    { key: "yearly", label: "รายปี" },
  ];

  return (
    <CardBoard className="h-full flex flex-col shadow-md border border-gray-100 bg-white rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-gray-800">
          <FiBarChart2 className="text-blue-600 text-lg" />
          <h3 className="text-lg font-semibold tracking-wide">
            สรุปยอดขาย {labelMap[period]}
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1 border border-gray-200 shadow-inner overflow-x-auto">
          {periods.map((p) => (
            <motion.button
              key={p.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p.key as PEROID_TYPE)}
              className={`relative flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                p.key === period
                  ? "text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {/* Highlight Background */}
              <AnimatePresence>
                {p.key === period && (
                  <motion.span
                    layoutId="pill"
                    className="absolute inset-0 bg-blue-600 rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <span className="relative z-10">{p.label}</span>
            </motion.button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-6">
        {data.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-sm">
            ไม่มีข้อมูลยอดขายในช่วงนี้
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="Label"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "ค่าเบี่ยงเบน") {
                    const sign = value >= 0 ? "+" : "";
                    return [`${sign}${value}%`, "เบี่ยงเบนจากเฉลี่ย"];
                  }
                  return [`${formatPrice(value)}`, name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "13px" }} />

              <Line
                type="monotone"
                dataKey="Total_Sales"
                name="ยอดขายรวม"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "#1d4ed8", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="Average"
                name="ค่าเฉลี่ย"
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Deviation"
                name="ค่าเบี่ยงเบน"
                stroke="#22c55e"
                strokeWidth={2}
                strokeOpacity={0.9}
                dot={{ r: 4, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </CardBoard>
  );
}
