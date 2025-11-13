"use client";
import { useEffect, useState } from "react";
import { CardBoard, CardHeader, CardContent } from "./CardBoard";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { TopProduct } from "@/types/dashboard";

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
    <CardBoard className="h-full">
      <CardHeader>สินค้าขายดี</CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>จำนวนที่ขาย</th>
                  <th>รายได้ (฿)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p : TopProduct) => (
                  <tr
                    key={p.Product_ID}
                    className="hover:bg-base-200 cursor-pointer transition-colors"
                    onClick={() => window.open(`/products/${p.Product_ID}`, "_blank")}
                  >
                    <td className="font-medium text-primary hover:underline">
                      {p.Product_Name}
                    </td>
                    <td>{p.Total_Sold.toLocaleString()}</td>
                    <td>
                      {p.Revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-base-content/70 py-8">
            ไม่มีข้อมูลสินค้าขายดี
          </div>
        )}
      </CardContent>
    </CardBoard>
  );
}