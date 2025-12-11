"use client";

import Pagination from "@/app/components/Pagination";
import { CONTACT_TYPE, ContactInfo } from "@/types/contact.types";
import { useCallback, useEffect, useState } from "react";
import { FiEye, FiSearch } from "react-icons/fi";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactInfo[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactInfo[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [filter, setFilter] = useState<CONTACT_TYPE>("all");
  const [search, setSearch] = useState("");

  const [selectedMessage, setSelectedMessage] = useState<ContactInfo | null>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetch(
      `/api/admin/contact-messages?page=${page}&limit=${itemsPerPage}&filter=${filter}`
    );
    const data = await res.json();

    setMessages(data);
    if (data.length > 0) {
      setTotal(Number(data[0].Total_Count));
    }
  }, [filter, page, itemsPerPage]);

  async function markRead(messageId: number, isRead: boolean) {
    await fetch(`/api/admin/contact-messages/mark-read`, {
      method: "POST",
      body: JSON.stringify({ messageId, isRead }),
      headers: { "Content-Type": "application/json" },
    });

    await loadMessages();
  }

  useEffect(() => {
    loadMessages();
  }, [page, filter, itemsPerPage, loadMessages]);

  // ---------------------------------------------
  // SEARCH FILTER (ค้นหาจากทุก field)
  // ---------------------------------------------
  useEffect(() => {
    const s = search.trim().toLowerCase();

    if (!s) {
      setFilteredMessages(messages);
      return;
    }

    const filtered = messages.filter((m: ContactInfo) => {
      const text = `${m.Name} ${m.Email} ${m.Phone ?? ""} ${m.Subject} ${m.Message}`.toLowerCase();
      return text.includes(s);
    });

    setFilteredMessages(filtered);
  }, [search, messages]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-base-content">ข้อความจากลูกค้า</h1>
          <p className="text-base-content/70 mt-1">
            ดูและจัดการข้อความที่ถูกส่งมาจากหน้าติดต่อเรา
          </p>
        </div>

        {/* FILTER BOX */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row flex-wrap gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4 z-10" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, อีเมล, เบอร์โทร, หัวข้อ..."
                  className="input input-bordered w-full pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* FILTER */}
            <div className="md:col-span-1">
              <select
                className="select select-bordered w-full"
                value={filter}
                onChange={(e) => {
                  setPage(1);
                  setFilter(e.target.value as CONTACT_TYPE);
                }}
              >
                <option value="all">ทั้งหมด</option>
                <option value="unread">ยังไม่อ่าน</option>
                <option value="read">อ่านแล้ว</option>
              </select>
            </div>

            {/* ITEMS PER PAGE */}
            <div className="md:col-span-1">
              <select
                className="select select-bordered w-full"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              >
                <option value={5}>5 รายการ</option>
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE - Desktop */}
        <div className="hidden md:block overflow-x-auto bg-base-100 shadow-xl rounded-xl">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>เบอร์ติดต่อ</th>
                <th>หัวข้อ</th>
                <th>สถานะ</th>
                <th>ตัวเลือก</th>
              </tr>
            </thead>

            <tbody>
              {filteredMessages.map((m: ContactInfo) => (
                <tr key={m.Message_ID} className={!m.Is_Read ? "bg-yellow-50" : ""}>
                  <td>{m.Created_At}</td>
                  <td>{m.Name}</td>
                  <td>{m.Email}</td>
                  <td>{m.Phone ?? "-"}</td>
                  <td>{m.Subject}</td>
                  <td>
                    {m.Is_Read ? (
                      <span className="badge badge-success">อ่านแล้ว</span>
                    ) : (
                      <span className="badge badge-warning">ยังไม่อ่าน</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost btn-square"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMessage(m);
                        if (!m.Is_Read) markRead(m.Message_ID, true);
                      }}
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden space-y-3">
          {filteredMessages.map((m) => (
            <div
              key={m.Message_ID}
              className={`p-4 rounded-lg shadow bg-base-100 border ${!m.Is_Read ? "border-yellow-600" : "border-base-300"}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">{m.Name}</h3>
                <button
                  className="btn btn-sm btn-ghost btn-square"
                  onClick={() => {
                    setSelectedMessage(m);
                    if (!m.Is_Read) markRead(m.Message_ID, true);
                  }}
                >
                  <FiEye className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-base-content/70">{m.Email}</p>
              <p className="text-xs">{m.Phone ?? "-"}</p>

              <p className="mt-2 font-medium">{m.Subject}</p>

              <div className="mt-1">
                {m.Is_Read ? (
                  <span className="badge badge-success badge-sm">อ่านแล้ว</span>
                ) : (
                  <span className="badge badge-warning badge-sm">ยังไม่อ่าน</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          totalItemsCount={total}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* MESSAGE MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
          <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-full md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* HEADER */}
            <div className="flex justify-between items-start p-4 md:p-5 border-b">
              <h2 className="text-lg md:text-xl font-bold break-words pr-4">
                {selectedMessage.Subject}
              </h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setSelectedMessage(null)}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-3 text-sm md:text-base">

              <p><strong>ชื่อ:</strong> {selectedMessage.Name}</p>
              <p><strong>อีเมล:</strong> {selectedMessage.Email}</p>
              <p><strong>เบอร์ติดต่อ:</strong> {selectedMessage.Phone ?? "-"}</p>

              <div className="mt-2">
                <label className="font-semibold mb-1 block">ข้อความ:</label>
                <div className="bg-base-200 p-3 md:p-4 rounded-lg whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                  {selectedMessage.Message}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-3 md:p-4 border-t text-right">
              <button
                className="btn btn-primary"
                onClick={() => setSelectedMessage(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}