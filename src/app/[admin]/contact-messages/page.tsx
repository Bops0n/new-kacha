"use client";

import Pagination from "@/app/components/Pagination";
import { useEffect, useState } from "react";
import { FiEye, FiSearch } from "react-icons/fi";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);

  const [filteredMessages, setFilteredMessages] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  console.log("Items per page setting:", itemsPerPage);

  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [search, setSearch] = useState("");

  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  async function loadMessages() {
    const res = await fetch(
      `/api/admin/contact-messages?page=${page}&limit=${itemsPerPage}&filter=${filter}`
    );
    const data = await res.json();

    setMessages(data);
    if (data.length > 0) {
      setTotal(Number(data[0].Total_Count));
    }
  }

  async function markRead(messageId: number, isRead: boolean) {
    await fetch(`/api/admin/contact-messages/mark-read`, {
      method: "POST",
      body: JSON.stringify({ messageId, isRead }),
      headers: { "Content-Type": "application/json" },
    });

    loadMessages();
  }

  useEffect(() => {
    loadMessages();
  }, [page, filter, itemsPerPage]);

  // 🔍 SEARCH FILTER LOGIC (ค้นหาจากทุก field)
  useEffect(() => {
    const s = search.trim().toLowerCase();

    if (!s) {
      setFilteredMessages(messages);
      return;
    }

    const filtered = messages.filter((m: any) => {
      const text =
        `${m.Name} ${m.Email} ${m.Phone ?? ""} ${m.Subject} ${m.Message}`.toLowerCase();

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
                    placeholder="ค้นหาด้วยชื่อ, อีเมล, เบอร์โทร, หัวข้อ, ข้อความ..."
                    className="input input-bordered w-full pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-64"> 
              <select
                className="select select-bordered"
                value={filter}
                onChange={(e) => {
                  setPage(1);
                  setFilter(e.target.value as any);
                }}
              >
                <option value="all">ทั้งหมด</option>
                <option value="unread">ยังไม่อ่าน</option>
                <option value="read">อ่านแล้ว</option>
              </select>
            </div>
            <div className="md:w-40">
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

        {/* TABLE */}
        <div className="overflow-x-auto bg-base-100 shadow-xl rounded-xl">
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
              {filteredMessages.map((m: any) => (
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

        {/* PAGINATION */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          totalItemsCount={total}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">

            {/* HEADER */}
            <div className="flex justify-between items-start p-5 border-b">
              <h2 className="text-xl font-bold break-words pr-4"> 
                {selectedMessage.Subject}
              </h2>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setSelectedMessage(null)}
              >
                ✕
              </button>
            </div>

            {/* BODY SCROLLABLE */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">

              <p>
                <strong>ชื่อ:</strong> {selectedMessage.Name}
              </p>
              <p>
                <strong>อีเมล:</strong> {selectedMessage.Email}
              </p>
              <p>
                <strong>เบอร์ติดต่อ:</strong> {selectedMessage.Phone ?? "-"}
              </p>

              {/* MESSAGE TEXT AREA */}
              <div className="mt-2">
                <label className="font-semibold mb-2 block">ข้อความ:</label>
                <div className="bg-base-200 p-4 rounded-lg whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                  {selectedMessage.Message}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t text-right">
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