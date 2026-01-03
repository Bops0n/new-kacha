"use client";

import React, { useState } from "react";
import { FiMapPin, FiPhone, FiMail, FiSend } from "react-icons/fi";
import { FaLine, FaFacebookSquare } from "react-icons/fa";
import { useWebsiteSettings } from "@/app/providers/WebsiteSettingProvider";
import { useAlert } from "@/app/context/AlertModalContext";

export default function ContactPage() {
  const settings = useWebsiteSettings();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/main/contact", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    setLoading(false);

    if (res.ok) {
      showAlert("ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด", "success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } else {
      showAlert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
    }
  }

  return (
    <div className="min-h-screen bg-base-200 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">ติดต่อเรา</h1>
          <p className="mt-2 text-base-content/70">
            หากคุณมีคำถาม ข้อเสนอแนะ หรือปัญหาใด ๆ เรายินดีให้ความช่วยเหลือ
          </p>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side */}
          <div className="bg-base-100 p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">ส่งข้อความถึงเรา</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                name="name"
                placeholder="ชื่อของคุณ"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                className="input input-bordered w-full"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="เบอร์โทรศัพท์"
                className="input input-bordered w-full"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="subject"
                placeholder="หัวข้อ"
                className="input input-bordered w-full"
                value={formData.subject}
                onChange={handleChange}
                required
              />

              <textarea
                name="message"
                className="textarea textarea-bordered w-full h-32"
                placeholder="รายละเอียดข้อความของคุณ..."
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <FiSend className="mr-2" /> ส่งข้อความ
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right side */}
          <div className="bg-base-100 p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">ช่องทางติดต่อ</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <FiMapPin className="text-primary w-6 h-6" />
                <p>{settings.companyAddress}</p>
              </div>

              <div className="flex gap-4">
                <FiPhone className="text-primary w-6 h-6" />
                <p>{settings.contactPhone}</p>
              </div>

              <div className="flex gap-4">
                <FiMail className="text-primary w-6 h-6" />
                <p>{settings.contactEmail}</p>
              </div>

              <div className="flex gap-4">
                <FaLine className="text-green-500 w-6 h-6" />
                <p>
                  <a href={settings.lineURL} className="link link-hover">
                    LINE Official : {settings.lineOfficialName}
                  </a>
                </p>
              </div>

              <div className="flex gap-4">
                <FaFacebookSquare className="text-blue-600 w-6 h-6" />
                <p>
                  <a href={settings.facebookURL} className="link link-hover">
                    Facebook : {settings.facebookPageName}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-4">แผนที่</h2>

          <div className="rounded-xl shadow-xl overflow-hidden">
            <iframe
              src={settings.contactMapEmbedURL}
              width="100%"
              height="400"
              loading="lazy"
              className="border-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}