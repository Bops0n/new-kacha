'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  FaWarehouse, FaBox, FaUserCog, FaChartLine 
} from 'react-icons/fa';
import { 
  FiLogOut, FiUser, FiMenu, FiX, FiShield 
} from "react-icons/fi";
import { MdDashboard, MdCategory, MdInventory } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { GoTriangleDown } from "react-icons/go";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { FaGears } from 'react-icons/fa6';
import { BiMessage } from 'react-icons/bi';

export default function AdminNavbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (status === 'loading') {
        return <LoadingSpinner />;
    }

    // ถ้าไม่ใช่ Admin หรือไม่มีสิทธิ์ ไม่แสดง Navbar
    if (!session || !session.user || session.user.accessLevel === 0) {
        return null;
    }

    const closeMobileMenu = () => setIsMenuOpen(false);

    // Helper เช็ค Active Link เพื่อไฮไลท์เมนู
    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <header className="sticky top-0 z-50 bg-base-100 shadow-md font-sarabun">
            
            {/* Top Bar (Admin Label) */}
            <div className="bg-neutral text-neutral-content text-xs py-1">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <span className="font-bold tracking-wide">KACHA HOME : ADMIN CONSOLE</span>
                    <span className="hidden sm:inline opacity-70">ระบบจัดการหลังบ้านสำหรับเจ้าหน้าที่</span>
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3 gap-4">
                    
                    {/* Logo Area */}
                    <Link href="/admin/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-2xl">A</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="hidden lg:block text-xl font-bold leading-tight text-base-content">Kacha Admin</span>
                            <span className="hidden lg:block text-[10px] text-base-content/60 tracking-wider uppercase">Management System</span>
                        </div>
                    </Link>

                    {/* Desktop Menu (Right Side - User Profile) */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-base-content">{session.user?.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                ระดับการเข้าถึง: {session.user?.accessLevel}
                            </span>
                        </div>

                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder hover:bg-base-200 border border-base-200">
                                <div className="bg-neutral-focus text-neutral-content rounded-full w-10 h-10 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm">
                                    <span className="text-lg font-bold">{session.user?.name?.charAt(0).toUpperCase()}</span>
                                </div>
                            </label>
                            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-xl w-60 border border-base-200">
                                <li className="menu-title px-4 py-2 border-b border-base-200 mb-2">
                                    <span className="text-base-content font-bold">{session.user?.email}</span>
                                </li>
                                <li><Link href="/profile" className="py-2"><FiUser className="w-4 h-4"/> ข้อมูลส่วนตัว</Link></li>
                                <li><Link href="/" target="_blank" className="py-2"><FaBox className="w-4 h-4"/> ไปหน้าร้านค้า</Link></li>
                                <div className="divider my-1"></div>
                                <li>
                                    <button onClick={() => signOut({ callbackUrl: "/" })} className="py-2 text-error hover:bg-error/10 hover:text-error">
                                        <FiLogOut className="w-4 h-4"/> ออกจากระบบ
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="lg:hidden ml-1">
                            <button className="btn btn-ghost btn-circle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu (Desktop) */}
            <nav className="hidden lg:block border-t border-base-200 bg-base-100/50 backdrop-blur-sm">
                <div className="container mx-auto">
                    <ul className="menu menu-horizontal px-1 text-sm font-medium w-full gap-1">
                        
                        {/* 1. Dashboard */}
                        {session.user.Dashboard && (
                            <li>
                                <Link href="/admin/dashboard" className={isActive('/admin/dashboard') ? 'active font-bold' : ''}>
                                    <MdDashboard className="w-4 h-4" /> แดชบอร์ด
                                </Link>
                            </li>
                        )}

                        {/* 2. User Management */}
                        {session.user.User_Mgr && (
                            <li>
                                <Link href="/admin/user-management" className={isActive('/admin/user-management') ? 'active font-bold' : ''}>
                                    <FaUserCog className="w-4 h-4" /> จัดการสมาชิก
                                </Link>
                            </li>
                        )}

                        {/* 3. Contact Message */}
                        <li>
                            <Link href="/admin/contact-messages" className={isActive('/admin/contact-messages') ? 'active font-bold' : ''}>
                                <BiMessage className="w-4 h-4" /> ข้อความจากลูกค้า
                            </Link>
                        </li>

                        {/* 4. Inventory (Stock + Category) Group */}
                        {session.user.Stock_Mgr && (
                            <li className="dropdown dropdown-hover">
                                <label tabIndex={0} className={`flex items-center gap-1 ${isActive('/admin/product-management') || isActive('/admin/category-management') ? 'text-primary font-bold' : ''}`}>
                                    <FaWarehouse className="w-4 h-4" /> คลังสินค้า <GoTriangleDown />
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
                                    <li>
                                        <Link href="/admin/product-management" className={isActive('/admin/product-management') ? 'active' : ''}>
                                            <MdInventory className="w-4 h-4" /> สินค้าคงคลัง
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/admin/category-management" className={isActive('/admin/category-management') ? 'active' : ''}>
                                            <MdCategory className="w-4 h-4" /> หมวดหมู่สินค้า
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        )}

                        {/* 5. Order Management */}
                        {session.user.Order_Mgr && (
                            <li>
                                <Link href="/admin/order-management" className={isActive('/admin/order-management') ? 'active font-bold' : ''}>
                                    <FaBox className="w-4 h-4" /> คำสั่งซื้อ
                                </Link>
                            </li>
                        )}

                        {/* 6. Report */}
                        {session.user.Report && (
                            <li className="dropdown dropdown-hover">
                                <label tabIndex={0} className={`flex items-center gap-1 ${isActive('/admin/report') ? 'text-primary font-bold' : ''}`}>
                                    <TbReportAnalytics className="w-4 h-4" /> รายงาน <GoTriangleDown />
                                </label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-60 border border-base-200">
                                    <li>
                                        <Link href="/admin/report/order-report" className={isActive('/admin/report/order-report') ? 'active' : ''}>
                                            <FaChartLine className="w-4 h-4" /> สรุปคำสั่งซื้อ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/admin/report/summary-sales-report" className={isActive('/admin/report/summary-sales-report') ? 'active' : ''}>
                                            <TbReportAnalytics className="w-4 h-4" /> สรุปยอดขาย
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/admin/report/inventory-report" className={isActive('/admin/report/inventory-report') ? 'active' : ''}>
                                            <FaWarehouse className="w-4 h-4" /> สินค้าคงคลัง
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        )}

                        <div className="flex-1"></div>

                        {/* 7. System Settings */}
                        {session.user.Sys_Admin && (
                            <li>
                                <Link href="/admin/sys-management" className={`text-primary hover:bg-primary/10 ${isActive('/admin/sys-management') ? 'font-bold bg-primary/10' : ''}`}>
                                    <FaGears className="w-4 h-4" /> ตั้งค่าระบบ
                                </Link>
                            </li>
                        )}
                        
                        {/* 8. Roles Settings */}
                        {session.user.Sys_Admin && (
                            <li>
                                <Link href="/admin/role-management" className={`text-warning hover:bg-warning/10 ${isActive('/admin/role-management') ? 'font-bold bg-warning/10' : ''}`}>
                                    <FiShield className="w-4 h-4" /> ตั้งค่าบทบาท
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </nav>

            {/* Mobile Navigation Menu (Drawer style) */}
            <div className={`lg:hidden bg-base-100 border-t border-base-200 overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="menu p-4 text-base-content space-y-1">
                    {session.user.Dashboard && (
                        <li><Link href="/admin/dashboard" onClick={closeMobileMenu} className={isActive('/admin/dashboard') ? 'active' : ''}><MdDashboard/> แดชบอร์ด</Link></li>
                    )}
                    
                    {session.user.User_Mgr && (
                        <li><Link href="/admin/user-management" onClick={closeMobileMenu} className={isActive('/admin/user-management') ? 'active' : ''}><FaUserCog/> จัดการสมาชิก</Link></li>
                    )}

                    {session.user.Stock_Mgr && (
                        <li>
                            <details open={isActive('/admin/product-management') || isActive('/admin/category-management')}>
                                <summary><FaWarehouse/> คลังสินค้า</summary>
                                <ul>
                                    <li><Link href="/admin/product-management" onClick={closeMobileMenu} className={isActive('/admin/product-management') ? 'active' : ''}>จัดการสินค้า</Link></li>
                                    <li><Link href="/admin/category-management" onClick={closeMobileMenu} className={isActive('/admin/category-management') ? 'active' : ''}>จัดการหมวดหมู่</Link></li>
                                </ul>
                            </details>
                        </li>
                    )}

                    {session.user.Order_Mgr && (
                        <li><Link href="/admin/order-management" onClick={closeMobileMenu} className={isActive('/admin/order-management') ? 'active' : ''}><FaBox/> จัดการคำสั่งซื้อ</Link></li>
                    )}

                    {session.user.Report && (
                        <li>
                            <details open={isActive('/admin/report')}>
                                <summary><TbReportAnalytics/> รายงาน</summary>
                                <ul>
                                    <li><Link href="/admin/report/order-report" onClick={closeMobileMenu}>สรุปคำสั่งซื้อ</Link></li>
                                    <li><Link href="/admin/report/summary-sales-report" onClick={closeMobileMenu}>สรุปยอดขาย</Link></li>
                                    <li><Link href="/admin/report/inventory-report" onClick={closeMobileMenu}>สินค้าคงคลัง</Link></li>
                                </ul>
                            </details>
                        </li>
                    )}

                    {session.user.Sys_Admin && (
                        <li className="mt-2 border-t border-base-200 pt-2">
                            <Link href="/admin/role-management" onClick={closeMobileMenu} className="text-warning hover:bg-warning/10"><FiShield/> ตั้งค่าบทบาท</Link>
                        </li>
                    )}
                </ul>
            </div>
        </header>
    );
}