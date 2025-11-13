"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CardBoard, CardHeader, CardContent } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { SalesData } from "@/types/dashboard";

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/dashboard/getSales?mode=${period}`, { cache: "no-store" });
        const { Data } = await res.json();
        setData(Data || []);
      } finally {
        setLoading(false);
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

  const getColor = (dev: number) => (dev >= 0 ? "#22c55e" : "#ef4444");

  return (
    <CardBoard>
      <CardHeader className="flex items-center justify-between">
        <span>ยอดขาย {labelMap[period]}</span>
        <select
          className="select select-bordered select-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
        >
          <option value="daily">รายวัน</option>
          <option value="weekly">รายสัปดาห์</option>
          <option value="monthly">รายเดือน</option>
          <option value="quarterly">รายไตรมาส</option>
          <option value="yearly">รายปี</option>
        </select>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <XAxis dataKey="Label" />
              <YAxis />
              <Tooltip
                formatter={(value: any, name: any, props: any) => {
                  console.log(name);
                  if (name === "ค่าเบี่ยงเบน") {
                    const sign = value >= 0 ? "+" : "";
                    return `${sign}${value}% จากค่าเฉลี่ย`;
                  }
                  return `฿${value.toLocaleString()}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Total_Sales"
                name="ยอดขายรวม"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ stroke: "#2563eb", strokeWidth: 2, r: 4 }}
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
                strokeOpacity={0.9}
                strokeWidth={2}
                stroke="#22c55e"
                dot={(props: any) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={getColor(props.payload.deviation)}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </CardBoard>
  );
}