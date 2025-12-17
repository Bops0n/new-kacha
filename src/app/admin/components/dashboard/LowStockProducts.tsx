"use client";
import React, { useEffect, useState } from "react";
import { CardBoard, CardContent, CardHeader } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { LowStock } from "@/types/dashboard";
import { motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";
import Image from "next/image";

export function LowStockProducts() {
  const [items, setItems] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard/getLowStock");
        const data = await res.json();
        setItems(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenProductManagement = () => {
    window.open("/admin/product-management", "_blank");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <CardBoard className="shadow-md hover:shadow-lg transition-all rounded-2xl border border-gray-100 bg-white">
      <CardHeader className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-800">
          <FiAlertTriangle className="text-amber-500 text-lg" />
          <h3 className="text-lg font-semibold tracking-wide">
            สินค้าใกล้หมด
          </h3>
        </div>
        <button
          onClick={handleOpenProductManagement}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          จัดการสินค้า
        </button>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {items.length > 0 ? (
          items.map((item, index) => {
            const percent = item.Stock_Percent;
            let barColor = "bg-gradient-to-r from-green-400 to-green-500";
            if (percent < 30)
              barColor = "bg-gradient-to-r from-red-500 to-rose-600";
            else if (percent < 70)
              barColor = "bg-gradient-to-r from-yellow-400 to-amber-500";

            return (
              <motion.div
                key={item.Product_ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onClick={handleOpenProductManagement}
                className="flex flex-col bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                title="คลิกเพื่อเปิดหน้าจัดการสินค้า"
              >
                {/* Product Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.Image_URL || "https://placehold.co/48x48?text=No+Img"}
                      alt={item.Product_Name}
                      width={512}
                      height={512}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {item.Product_Name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.Category_Name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        item.Quantity <= 3 ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {item.Quantity.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">คงเหลือ</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${barColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>จุดสั่งซื้อ: {item.Reorder_Point}</span>
                  <span>{percent}%</span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            ไม่มีสินค้าที่ใกล้หมดในขณะนี้
          </div>
        )}
      </CardContent>
    </CardBoard>
  );
}
