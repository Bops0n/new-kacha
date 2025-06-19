'use client'
import { FaSearch, FaLine, FaFacebookSquare } from "react-icons/fa";
import { GoTriangleDown } from "react-icons/go";
import { HiMenu, HiX } from "react-icons/hi";
import { useState } from "react";

export default function AdminNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full" data-theme="dark">
            {/* Top Bar */}
            <div className="bg-gray-200 border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-2 text-sm">
                        <p className="text-center lg:text-left  font-medium mb-2 lg:mb-0">
                            ห้องน้ำต้อง คชาโฮม ถูก ครบ จบที่เดียว
                        </p>
                        
                        <div className="flex justify-center lg:justify-start gap-4 mb-2 lg:mb-0">
                            <div className="flex items-center gap-2   transition-colors cursor-pointer">
                                <FaLine className="text-green-700 text-3xl"/> 
                                <span>kacha982</span>
                            </div>
                            <div className="flex items-center gap-2   transition-colors cursor-pointer">
                                <FaFacebookSquare className="text-blue-700 text-3xl"/> 
                                <span className="hidden sm:block">บริษัท คชาโฮม จำกัด</span>
                                <span className="sm:hidden">คชาโฮม</span>
                            </div>
                        </div>
                        
                        <div className="text-center lg:text-right">
                            <button className=" hover:text-yellow-600 transition-colors">
                                ติดต่อเรา
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="bg-gray-300 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className=" font-bold text-xl">K</span>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-8">
                            <div className="relative flex items-center">
                                <div className="absolute left-3 z-10 hidden md:inline sm:none">
                                    <FaSearch className=""/>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาสินค้า..." 
                                    className="w-full bg-gray-200  placeholder-gray-400 pl-10 pr-4 py-3 rounded-l-lg border border-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                                />
                                <button className="bg-yellow-500 hover:bg-yellow-600  px-6 py-3 rounded-r-lg border border-yellow-500 transition-colors">
                                    ค้นหา
                                </button>
                            </div>
                        </div>

                        {/* Login Section & Mobile Menu */}
                        <div className="flex items-center gap-4">
                            {/* Login Dropdown */}
                            <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost  gap-2 hover:bg-gray-400">
                                    <span className="hidden sm:block">ลงชื่อ / สมัครสมาชิก</span>
                                    <span className="sm:hidden">เข้าสู่ระบบ</span>
                                    <GoTriangleDown />
                                </label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-gray-300 rounded-box w-52 border border-gray-400">
                                    <li><a className=" hover:bg-gray-400">เข้าสู่ระบบ</a></li>
                                    <li><a className=" hover:bg-gray-400">สมัครสมาชิก</a></li>
                                    <li><a className=" hover:bg-gray-400">ลืมรหัสผ่าน</a></li>
                                </ul>
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="lg:hidden">
                                <button 
                                    className="btn btn-square btn-ghost  hover:bg-gray-400"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    {isMenuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-gray-200 border-t border-gray-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Menu */}
                    <div className="hidden lg:flex">
                        <div className="flex">
                            <div className="dropdown dropdown-hover">
                                <label tabIndex={0} className="flex items-center px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors cursor-pointer gap-1">
                                    หน้าหลัก
                                    <GoTriangleDown className="w-3 h-3"/>
                                </label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-gray-300 rounded-box w-48 border border-gray-400 mt-0">
                                    <li><a className=" hover:bg-gray-400">Dashboard</a></li>
                                    <li><a className=" hover:bg-gray-400">Analytics</a></li>
                                    <li><a className=" hover:bg-gray-400">Reports</a></li>
                                </ul>
                            </div>
                            <a href="#" className="px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors">
                                จัดการสมาชิก
                            </a>
                            <a href="#" className="px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors">
                                จัดการคลังสินค้า
                            </a>
                            <a href="#" className="px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors">
                                จัดการคำสั่งซื้อ
                            </a>
                            <a href="#" className="px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors">
                                รายงาน
                            </a>
                            <a href="#" className="px-6 py-4  hover:text-yellow-600 hover:bg-gray-300 transition-colors">
                                ตั้งค่า
                            </a>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
                        <div className="py-4 space-y-2">
                            <div className="space-y-1">
                                <div className="collapse collapse-arrow">
                                    <input type="checkbox" /> 
                                    <div className="collapse-title  font-medium px-4 py-2 hover:bg-gray-300">
                                        หน้าหลัก
                                    </div>
                                    <div className="collapse-content bg-gray-300"> 
                                        <div className="space-y-1 pt-2">
                                            <a href="#" className="block px-6 py-2 text-gray-300 hover: hover:bg-gray-400 rounded">Dashboard</a>
                                            <a href="#" className="block px-6 py-2 text-gray-300 hover: hover:bg-gray-400 rounded">Analytics</a>
                                            <a href="#" className="block px-6 py-2 text-gray-300 hover: hover:bg-gray-400 rounded">Reports</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <a href="#" className="block px-4 py-3  hover:bg-gray-300 rounded transition-colors">
                                จัดการสมาชิก
                            </a>
                            <a href="#" className="block px-4 py-3  hover:bg-gray-300 rounded transition-colors">
                                จัดการคลังสินค้า
                            </a>
                            <a href="#" className="block px-4 py-3  hover:bg-gray-300 rounded transition-colors">
                                จัดการคำสั่งซื้อ
                            </a>
                            <a href="#" className="block px-4 py-3  hover:bg-gray-300 rounded transition-colors">
                                รายงาน
                            </a>
                            <a href="#" className="block px-4 py-3  hover:bg-gray-300 rounded transition-colors">
                                ตั้งค่า
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}