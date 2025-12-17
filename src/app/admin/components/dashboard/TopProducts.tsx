"use client";
import { useEffect, useState } from "react";
import { CardBoard, CardHeader, CardContent } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { TopProduct } from "@/types/dashboard";
import { formatPrice } from "@/app/utils/formatters";
import { motion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";

export function TopProducts() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/dashboard/getTopProducts", {
          cache: "no-store",
        });
        const { Products } = await res.json();
        setProducts(Products || []);
      } finally {
        setLoading(false);
      }
    }
    fetchTopProducts();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <CardBoard className="h-full flex flex-col shadow-md border border-gray-100 bg-white rounded-2xl">
      <CardHeader className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-800">
          <FiTrendingUp className="text-pink-600 text-lg" />
          <h3 className="text-lg font-semibold tracking-wide">
            สินค้าขายดี (Top 5)
          </h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {products.length > 0 ? (
          products.map((p, index) => (
            <motion.div
              key={p.Product_ID}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              onClick={() =>
                window.open(`/products/${p.Product_ID}`, "_blank")
              }
              className="group flex items-center justify-between border border-gray-100 rounded-2xl p-4 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 hover:shadow-md transition-all cursor-pointer"
              title="คลิกเพื่อเปิดหน้ารายละเอียดสินค้า"
            >
              {/* Left section */}
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                      ? "bg-gray-400"
                      : index === 2
                      ? "bg-amber-700"
                      : "bg-blue-400"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex flex-col">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                    {p.Product_Name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ขายแล้ว {p.Total_Sales} {p.Product_Unit} •{" "}
                    <span className="text-green-600 font-medium">
                      {formatPrice(p.Revenue)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right section */}
              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">
                  {p.Quantity.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">คงเหลือ</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            ไม่พบข้อมูลสินค้าขายดี
          </div>
        )}
      </CardContent>
    </CardBoard>
  );
}
