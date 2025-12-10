"use client";

import { ImagePreviewModal } from "@/app/components/ImagePreviewModal";
import { WEBSITE_SETTING_GROUP, WEBSITE_SETTING_TYPE } from "@/app/utils/setting";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiZoomIn } from "react-icons/fi";

type AdminSettingItem = {
  key: string;
  label: string;
  description?: string;
  type: WEBSITE_SETTING_TYPE;
  group: WEBSITE_SETTING_GROUP;
  default: string;
  value: string;
};

type HistoryItem = {
  OLD_VALUE: string | null;
  NEW_VALUE: string;
  CHANGED_AT: string;
  CHANGED_BY: number | null;
};

const groupLabels: Record<string, string> = {
  general: "ทั่วไป",
  order: "การสั่งซื้อ",
  payment: "การชำระเงิน",
  system: "ระบบ"
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // load all settings
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
      setLoading(false);
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, AdminSettingItem[]> = {};
    for (const s of settings) {
      if (!map[s.group]) map[s.group] = [];
      map[s.group].push(s);
    }
    return map;
  }, [settings]);

  async function saveSetting(item: AdminSettingItem) {
    setSavingKey(item.key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/settings/${item.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: item.value, type: item.type, group: item.group })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "บันทึกไม่สำเร็จ");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      setError(message);
    } finally {
      setSavingKey(null);
    }
  }

  function updateValue(key: string, value: string) {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  }

  async function openHistory(key: string) {
    setHistoryKey(key);
    const res = await fetch(`/api/admin/settings/${key}/history`);
    const data = await res.json();
    setHistory(data);
  }

  if (loading) {
    return (
      <div className="p-20 text-center">
        <span className="loading loading-dots loading-lg"></span>
        <p className="mt-2 opacity-70">กำลังโหลดข้อมูลการตั้งค่าเว็บไซต์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold">ตั้งค่าเว็บไซต์</h1>
          <p className="text-base-content/70 mt-1">
            ปรับแต่งค่าต่าง ๆ ของระบบเว็บไซต์ให้สอดคล้องกับธุรกิจของคุณ
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Group Sections */}
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-10">

            {/* Group Title */}
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              {groupLabels[group] ?? group}
            </h2>

            {/* Setting Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {items.map(item => (
                <div
                  key={item.key}
                  className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{item.label}</h3>
                      <div className="text-xs text-base-content/60 mt-1">{item.key}</div>
                    </div>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => openHistory(item.key)}
                    >
                      ประวัติ
                    </button>
                  </div>

                  {item.description && (
                    <p className="text-sm text-base-content/70 mb-3">{item.description}</p>
                  )}

                  {/* Inputs */}
                  {item.type === "image" ? (
                    <div className="flex flex-col gap-3 mb-4">

                      {/* ตัวอย่างรูปที่ตั้งค่าไว้ */}
                      {item.value ? (
                        <div 
                          className="relative group w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-base-200 shadow-sm bg-white cursor-zoom-in"
                          onClick={() => setPreviewImage(item.value || 'https://placehold.co/600x400?text=No+Image')}
                        >
                          <Image
                            src={item.value || 'https://placehold.co/600x400?text=No+Image'}
                            alt={item.label}
                            width={512}
                            height={512}
                            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                              <span className="text-white font-medium flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                  <FiZoomIn className="w-5 h-5" /> คลิกเพื่อขยาย
                              </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center border rounded-lg text-xs opacity-50">
                          ไม่มีรูป
                        </div>
                      )}

                      {/* Upload File */}
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-bordered w-full"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append("file", file);

                          // ส่งชื่อไฟล์เก่าไป API เพื่อลบ
                          if (item.value) {
                            formData.append("oldFile", item.value.replace("/uploads/", ""));
                          }

                          const res = await fetch("/api/admin/settings/upload", {
                            method: "POST",
                            body: formData,
                          });

                          const data = await res.json();

                          if (data.url) {
                            updateValue(item.key, data.url);
                          } else {
                            alert(data.error);
                          }
                        }}
                      />

                      {/* หรือใส่ URL */}
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="หรือใส่ URL รูปภาพ"
                        value={item.value}
                        onChange={e => updateValue(item.key, e.target.value)}
                      />
                    </div>
                  ) : item.type === "boolean" ? (
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={item.value === "True" || item.value === "true" || item.value === "1"}
                        onChange={e =>
                          updateValue(item.key, e.target.checked ? "True" : "False")
                        }
                      />
                      {item.value === "True" || item.value === "true" || item.value === "1" ? (
                        <span className="label-text text-success">เปิดใช้งาน</span>
                      ) : (
                        <span className="label-text text-warning">ปิดใช้งาน</span>
                      )}
                    </label>
                  ) : item.type === "number" ? (
                    <input
                      type="number"
                      className="input input-bordered w-full mb-4"
                      value={item.value}
                      onChange={e => updateValue(item.key, e.target.value)}
                    />
                  ) : item.type === "json" ? (
                    <textarea
                      className="textarea textarea-bordered w-full font-mono text-xs mb-4"
                      rows={4}
                      value={item.value}
                      onChange={e => updateValue(item.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input input-bordered w-full mb-4"
                      value={item.value}
                      onChange={e => updateValue(item.key, e.target.value)}
                    />
                  )}

                  <div className="flex justify-between items-center text-xs text-base-content/50 mb-3">
                    <span>ค่าเริ่มต้น: {item.default}</span>
                  </div>

                  <button
                    className="btn btn-primary btn-sm w-full"
                    disabled={savingKey === item.key}
                    onClick={() => saveSetting(item)}
                  >
                    {savingKey === item.key && (
                      <span className="loading loading-spinner loading-xs mr-1" />
                    )}
                    บันทึก
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* History Modal */}
        {historyKey && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-xl shadow-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">ประวัติการแก้ไข: {historyKey}</h3>
                <button
                  className="btn btn-sm btn-circle"
                  onClick={() => setHistoryKey(null)}
                >
                  ✕
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-sm opacity-70">ยังไม่มีประวัติการแก้ไข</div>
              ) : (
                <div className="max-h-80 overflow-auto text-sm">
                  <table className="table table-zebra table-sm w-full">
                    <thead>
                      <tr>
                        <th>เวลา</th>
                        <th>ค่าเดิม</th>
                        <th>ค่าใหม่</th>
                        <th>โดย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, idx) => (
                        <tr key={idx}>
                          <td>{h.CHANGED_AT}</td>
                          <td>{h.OLD_VALUE ?? "-"}</td>
                          <td>{h.NEW_VALUE}</td>
                          <td>{h.CHANGED_BY ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
