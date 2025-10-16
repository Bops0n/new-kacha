"use client";

import Link from "next/link";
import { LuArrowLeft, LuShieldAlert } from "react-icons/lu";

export default function AccessDeniedPage({ url } : { url: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 text-center px-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full border border-gray-200">
        <div className="flex flex-col items-center space-y-4">
          {/* 🔸 Icon */}
          <div className="bg-orange-100 text-orange-600 p-4 rounded-full">
            <LuShieldAlert size={48} />
          </div>

          {/* 🔸 Title */}
          <h1 className="text-4xl font-extrabold text-gray-800">
            Access Denied
          </h1>

          {/* 🔸 Description */}
          <p className="text-gray-600 text-base leading-relaxed">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้<br />
            โปรดติดต่อผู้ดูแลระบบหากคิดว่านี่เป็นข้อผิดพลาด
          </p>

          {/* 🔸 Button */}
          <Link
            href={url}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl 
                       hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 shadow-sm"
          >
            <LuArrowLeft size={18} />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      {/* 🔸 Footer Code */}
      <p className="mt-8 text-sm text-gray-500">
        Error Code: <span className="font-semibold text-orange-600">403</span>
      </p>
    </main>
  );
}