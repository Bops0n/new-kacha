'use client';

import React, { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiSend } from 'react-icons/fi';
import { FaLine, FaFacebookSquare } from 'react-icons/fa';
import { logger } from '@/server/logger';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for sending form data to an API would go here
    logger.info('Form submitted:', formData);
    alert('ขอบคุณสำหรับข้อความของคุณ! เราจะติดต่อกลับโดยเร็วที่สุด');
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-base-content">ติดต่อเรา</h1>
          <p className="mt-2 text-lg text-base-content/70">เรายินดีรับฟังทุกข้อเสนอแนะและพร้อมให้ความช่วยเหลือ</p>
        </div>

        <div className="card lg:card-side bg-base-100 shadow-xl">
          <div className="card-body lg:w-1/2">
            <h2 className="card-title text-2xl mb-4">ส่งข้อความถึงเรา</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">ชื่อของคุณ</span></label>
                <input type="text" name="name" placeholder="สมชาย คชาโฮม" className="input input-bordered" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">อีเมล</span></label>
                <input type="email" name="email" placeholder="your-email@example.com" className="input input-bordered" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">หัวข้อ</span></label>
                <input type="text" name="subject" placeholder="สอบถามเรื่องสินค้า" className="input input-bordered" value={formData.subject} onChange={handleChange} required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">ข้อความ</span></label>
                <textarea name="message" className="textarea textarea-bordered h-32" placeholder="รายละเอียดที่ต้องการสอบถาม..." value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <div className="card-actions justify-end">
                <button type="submit" className="btn btn-primary">
                  <FiSend className="mr-2" /> ส่งข้อความ
                </button>
              </div>
            </form>
          </div>
          
          <div className="divider lg:divider-horizontal"></div>

          <div className="card-body lg:w-1/2">
            <h2 className="card-title text-2xl mb-4">ช่องทางการติดต่ออื่นๆ</h2>
            <div className="space-y-4 text-base-content">
              <div className="flex items-start gap-4">
                <FiMapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">ที่อยู่</h3>
                  <p>บริษัท คชาโฮม จำกัด (สำนักงานใหญ่) 123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FiPhone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">เบอร์โทรศัพท์</h3>
                  <p>081-896-2687</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FiMail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">อีเมล</h3>
                  <p>support@kachahome.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FaLine className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">LINE Official</h3>
                  <a href="https://line.me/ti/p/~kacha982" target="_blank" rel="noopener noreferrer" className="link link-hover">kacha982</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FaFacebookSquare className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Facebook</h3>
                  <a href="https://www.facebook.com/KachaHomeTH" target="_blank" rel="noopener noreferrer" className="link link-hover">บริษัท คชาโฮม จำกัด</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-4">แผนที่</h2>
            <div className="bg-base-100 rounded-lg shadow-xl p-2">
                {/* Placeholder for Google Maps Embed */}
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.870346322248!2d100.5791786758633!3d13.725832797274072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29fa4488339c3%3A0x20241984a9645229!2sKlong-Toey%20Market!5e0!3m2!1sen!2sth!4v1691332240971!5m2!1sen!2sth" 
                    width="100%" 
                    height="450" 
                    style={{ border: 0 }} 
                    allowFullScreen={true}
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-md"
                ></iframe>
            </div>
        </div>
      </div>
    </div>
  );
}