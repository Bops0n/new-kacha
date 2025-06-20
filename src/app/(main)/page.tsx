'use client'; // This component needs to be a Client Component for interactivity

import React from 'react';
import Link from 'next/link';
import { FiTruck, FiAward, FiDollarSign, FiHeadphones } from 'react-icons/fi'; // Icons for value propositions

// Assuming ProductDisplayCard is in src/app/components/ProductDisplayCard.tsx
import ProductDisplayCard from './components/ProductDisplayCard';
// Assuming ProductInventory type is in src/types.ts
import { ProductInventory } from '../../types';

// Helper for currency formatting - Reusing from previous components
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

// --- Mock Data for Featured Products (a small selection for the homepage) ---
// These products will be displayed on the homepage
const mockFeaturedProducts: ProductInventory[] = [
  {
    Product_ID: 101, Child_ID: 3001, Name: 'ปูนซีเมนต์ ตราเสือ', Brand: 'SCG', Description: 'ปูนซีเมนต์สำหรับงานโครงสร้างทั่วไป',
    Unit: 'ถุง', Quantity: 150, Sale_Cost: 120, Sale_Price: 115, Reorder_Point: 50, Visibility: true,
    Review_Rating: 4.8, Image_URL: 'https://placehold.co/400x300/ADD8E6/000000?text=ปูนซีเมนต์', // Placeholder image
  },
  {
    Product_ID: 102, Child_ID: 2001, Name: 'กระเบื้องแกรนิตโต้ 60x60 ซม.', Brand: 'Duragres', Description: 'กระเบื้องคุณภาพสูงสำหรับพื้นผิวเรียบ',
    Unit: 'กล่อง', Quantity: 80, Sale_Cost: 350, Sale_Price: 350, Reorder_Point: 20, Visibility: true,
    Review_Rating: 4.5, Image_URL: 'https://placehold.co/400x300/F0F8FF/000000?text=กระเบื้อง', // Placeholder image
  },
  {
    Product_ID: 103, Child_ID: 1003, Name: 'สว่านไร้สาย Bosch GSB 18V-50', Brand: 'Bosch', Description: 'สว่านกระแทกไร้สายประสิทธิภาพสูง',
    Unit: 'เครื่อง', Quantity: 25, Sale_Cost: 4500, Sale_Price: 4200, Reorder_Point: 10, Visibility: true,
    Review_Rating: 4.9, Image_URL: 'https://placehold.co/400x300/FFB6C1/000000?text=สว่านไร้สาย', // Placeholder image
  },
  {
    Product_ID: 104, Child_ID: 2002, Name: 'สีทาภายใน TOA SuperShield', Brand: 'TOA', Description: 'สีคุณภาพพรีเมียม เช็ดล้างง่าย',
    Unit: 'แกลลอน', Quantity: 60, Sale_Cost: 850, Sale_Price: 850, Reorder_Point: 20, Visibility: true,
    Review_Rating: 4.7, Image_URL: 'https://placehold.co/400x300/E0FFFF/000000?text=สีทาภายใน', // Placeholder image
  },
  {
    Product_ID: 105, Child_ID: 3002, Name: 'อิฐมอญ 3 รู ตราสามห่วง', Brand: 'สามห่วง', Description: 'อิฐมอญคุณภาพดี แข็งแรง ทนทาน',
    Unit: 'ก้อน', Quantity: 500, Sale_Cost: 2.5, Sale_Price: 2.2, Reorder_Point: 100, Visibility: true,
    Review_Rating: 4.6, Image_URL: 'https://placehold.co/400x300/D2B48C/000000?text=อิฐมอญ', // Placeholder image
  },
  {
    Product_ID: 106, Child_ID: 1004, Name: 'ท่อ PVC ตราช้าง 1/2 นิ้ว', Brand: 'SCG', Description: 'ท่อ PVC สำหรับงานประปาและระบายน้ำ',
    Unit: 'เส้น', Quantity: 120, Sale_Cost: 150, Sale_Price: 150, Reorder_Point: 30, Visibility: true,
    Review_Rating: 4.4, Image_URL: 'https://placehold.co/400x300/90EE90/000000?text=ท่อ+PVC', // Placeholder image
  },
];

// --- Mock Data for Featured Categories (linking to /products page with filters) ---
// These links should correspond to your actual category IDs and structure in UserNavbar and products/page.tsx
const mockFeaturedCategories = [
    { name: 'ปูนซีเมนต์', image: 'https://placehold.co/300x200/D8BFD8/000000?text=ปูนซีเมนต์', href: '/products?categoryId=1&subCategoryId=101&childCategoryId=1001' },
    { name: 'กระเบื้องปูพื้น', image: 'https://placehold.co/300x200/F5DEB3/000000?text=กระเบื้อง', href: '/products?categoryId=2&subCategoryId=201&childCategoryId=2001' },
    { name: 'เครื่องมือไฟฟ้า', image: 'https://placehold.co/300x200/A2DAA2/000000?text=เครื่องมือไฟฟ้า', href: '/products?categoryId=3&subCategoryId=301&childCategoryId=3001' },
    { name: 'สีทาภายใน', image: 'https://placehold.co/300x200/ADD8E6/000000?text=สีทาภายใน', href: '/products?categoryId=2&subCategoryId=202&childCategoryId=2001' },
    { name: 'สุขภัณฑ์', image: 'https://placehold.co/300x200/FFC0CB/000000?text=สุขภัณฑ์', href: '/products?categoryId=2&subCategoryId=203&childCategoryId=2005' }, // Example for a new child category
    { name: 'อุปกรณ์ไฟฟ้า', image: 'https://placehold.co/300x200/B0C4DE/000000?text=อุปกรณ์ไฟฟ้า', href: '/products?categoryId=1&subCategoryId=102&childCategoryId=1003' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-500 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://placehold.co/1920x1080/0A2342/FFFFFF?text=Construction+Site')" }}></div>
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

      {/* Featured Categories Section */}
      <section className="py-12 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10 text-base-content">เลือกดูสินค้าตามหมวดหมู่</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {mockFeaturedCategories.map((category, index) => (
              <Link href={category.href} key={index} className="card bg-base-100 shadow-xl image-full group transition-transform transform hover:scale-105 duration-300">
                <figure>
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-300"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x200/CCCCCC/666666?text=ไม่มีรูป'; }}
                  />
                </figure>
                <div className="card-body justify-center items-center p-4 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300">
                  <h3 className="card-title text-white text-center text-xl font-bold">{category.name}</h3>
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
            {mockFeaturedProducts.map(product => (
              <ProductDisplayCard key={product.Product_ID} product={product} formatPrice={formatPrice} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/products" className="btn btn-outline btn-primary btn-lg hover:scale-105 transition-transform duration-300">
              ดูสินค้าทั้งหมดเพิ่มเติม
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ไม่แน่ใจว่าจะเริ่มต้นอย่างไร? ปรึกษาเราได้เลย!
          </h2>
          <p className="text-lg md:text-xl mb-8">
            ทีมงานผู้เชี่ยวชาญของเราพร้อมให้คำแนะนำและช่วยเหลือคุณในการเลือกวัสดุที่เหมาะสมกับทุกโครงการ
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="#" className="btn btn-warning btn-lg shadow-lg hover:scale-105 transition-transform duration-300">
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
