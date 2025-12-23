'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTruck, FiAward, FiDollarSign, FiHeadphones } from 'react-icons/fi';
import ProductDisplayCard from './components/ProductDisplayCard';
import { CategoryTopSelling, ProductInventory } from '@/types';
import LoadingSpinner from '../components/LoadingSpinner';
import Image from 'next/image';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryTopSelling[]>([]);
  const [products, setProducts] = useState<ProductInventory[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true); 
        const result = await fetch('/api/main/home/getTopSelling');
        const { Top_Categories, Recommended_Products } = await result.json();
        setCategories(Top_Categories);
        setProducts(Recommended_Products);
      } finally {
        setLoading(false); 
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-slate-700 to-slate-500 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/images/kacha-background.jpg')" }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-lg">
            เรื่องบ้าน ต้อง <span className="text-yellow-300">คชาโฮม</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl drop-shadow-md">
            ถูก ครบ จบที่เดียว: วัสดุก่อสร้างคุณภาพสูง ราคาดีที่สุด พร้อมบริการครบวงจร
          </p>
          <Link href="/products" className="btn btn-warning btn-lg shadow-xl text-lg hover:scale-105 transition-transform duration-300">
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      </div>

      {/* Value Proposition Section */}
      <section className="py-12 bg-base-100 shadow-md rounded-lg mx-4 md:mx-auto max-w-7xl -mt-10 relative z-20 p-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-base-content">ทำไมต้องเลือกคชาโฮม?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-base-200 shadow-sm transition-transform transform hover:scale-105 duration-300">
            <div className="bg-primary text-primary-content p-4 rounded-full mb-4 shadow-md">
              <FiDollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-base-content">ราคาดีที่สุด</h3>
            <p className="text-base-content/70 text-sm">เราคัดสรรสินค้าคุณภาพในราคาที่คุ้มค่าที่สุด</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-base-200 shadow-sm transition-transform transform hover:scale-105 duration-300">
            <div className="bg-primary text-primary-content p-4 rounded-full mb-4 shadow-md">
              <FiAward className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-base-content">สินค้าครบวงจร</h3>
            <p className="text-base-content/70 text-sm">ทุกอย่างที่คุณต้องการสำหรับบ้านและก่อสร้าง</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-base-200 shadow-sm transition-transform transform hover:scale-105 duration-300">
            <div className="bg-primary text-primary-content p-4 rounded-full mb-4 shadow-md">
              <FiTruck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-base-content">จัดส่งรวดเร็ว</h3>
            <p className="text-base-content/70 text-sm">ส่งถึงหน้างานอย่างรวดเร็วและปลอดภัย</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-base-200 shadow-sm transition-transform transform hover:scale-105 duration-300">
            <div className="bg-primary text-primary-content p-4 rounded-full mb-4 shadow-md">
              <FiHeadphones className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-base-content">บริการประทับใจ</h3>
            <p className="text-base-content/70 text-sm">ทีมงานพร้อมให้คำปรึกษาและช่วยเหลือ</p>
          </div>
        </div>
      </section>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Featured Categories Section */}
          <section className="py-12 bg-base-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-10 text-base-content">เลือกดูสินค้าตามหมวดหมู่</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories && categories.map((category, index) => (
                  <Link href={category.Category_Path} key={index} className="card bg-base-100 shadow-xl image-full group transition-transform transform hover:scale-105 duration-300">
                    <figure>
                      <Image
                        src={category.Image.trimEnd()}
                        alt={category.Name}
                        width={512}
                        height={512}
                        className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x200/CCCCCC/666666?text=ไม่มีรูป'; }}
                      />
                    </figure>
                    <div className="card-body justify-center items-center p-4 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300">
                      <h3 className="card-title text-white text-center text-xl font-bold">{category.Name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

        {/* Featured Products Section */}
        <section className="py-12 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-10 text-base-content">สินค้าแนะนำ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products && products.map(product => (
                <ProductDisplayCard key={product.Product_ID} product={product} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/products" className="btn btn-outline btn-primary btn-lg hover:scale-105 transition-transform duration-300">
                ดูสินค้าทั้งหมดเพิ่มเติม
              </Link>
            </div>
          </div>
        </section>
        </>
      )}

      {/* Call to Action Section */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ไม่แน่ใจว่าจะเริ่มต้นอย่างไร? ปรึกษาเราได้เลย!
          </h2>
          <p className="text-lg md:text-xl mb-8">
            ทีมงานผู้เชี่ยวชาญของเราพร้อมให้คำแนะนำและช่วยเหลือคุณในการเลือกวัสดุที่เหมาะสมกับทุกโครงการ
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="btn btn-warning btn-lg shadow-lg hover:scale-105 transition-transform duration-300">
              ติดต่อเรา
            </Link>
            <Link href="/products" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-blue-700 shadow-lg hover:scale-105 transition-transform duration-300">
              ค้นหาสินค้า
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
