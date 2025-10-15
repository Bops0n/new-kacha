'use client'
import { FaFacebookSquare, FaLine, FaSearch, FaBox, FaWarehouse } from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { GoTriangleDown } from "react-icons/go";
import Link from "next/link";
import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiChevronUp, FiMenu, FiSettings, FiShield, FiUser, FiX } from "react-icons/fi";
import { MdCategory, MdDashboard } from "react-icons/md";
import { TbReport } from "react-icons/tb";

export default function AdminNavbar() {
    const {data: session, status} = useSession();
    const [treeOpen, setTreeOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (status == 'loading') {
        return <LoadingSpinner />;
    }

    if (session?.user?.accessLevel != 0 && session?.user.accessLevel !== undefined)  {
        return (
            <>
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
                                    <label tabIndex={0} className="btn btn-ghost gap-2 hover:bg-gray-200 text-gray-800 rounded-lg">
                                        <span className="hidden sm:block">{session?.user?.name}</span>
                                        <span className="sm:hidden text-sm">{ session?.user?.name?.split(' ')[0] }</span>
                                        <GoTriangleDown className="w-4 h-4" />
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 mt-0 text-gray-800">
                                        <li> <Link href={"/profile"} className="hover:bg-gray-200 rounded">โปรไฟล์ของฉัน</Link></li>
                                        <li> <Link href={"/orders-history"} className="hover:bg-gray-200 rounded">ประวัติคำสั่งซื้อ</Link></li>
                                        <li> <Link href={"/favorites"} className="hover:bg-gray-200 rounded">รายการโปรด</Link></li>
                                        <li> <a onClick={()=> signOut({ callbackUrl: "/" })} className="hover:bg-gray-200 rounded">ออกจากระบบ</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <header className="sticky top-0 z-50 bg-base-100 shadow-lg border-b border-base-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

                        <h1 className="text-lg font-semibold text-warning md:hidden">
                            จัดการระบบ
                        </h1>
                        
                        <button className="btn btn-ghost md:hidden" onClick={() => setIsMenuOpen((o) => !o)} aria-label="Toggle Menu">
                            {isMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                        </button>
                        
                        {/* Desktop Menu */}
                        <nav  className="hidden md:flex justify-center items-center gap-x-6 mx-auto max-w-fit">
                            {session.user.Dashboard && <MenuButton icon={<MdDashboard/>} label="แดชบอร์ด" url="/admin/dashboard"/>}
                            {session.user.User_Mgr && <MenuButton icon={<FiUser/>} label="จัดการสมาชิก" url="/admin/user-management"/>}
                            {session.user.Stock_Mgr && <MenuButton icon={<FaWarehouse/>} label="จัดการคลังสินค้า" url="/admin/product-management"/>}
                            {session.user.Stock_Mgr && <MenuButton icon={<MdCategory/>} label="จัดการหมวดหมู่สินค้า" url="/admin/category-management"/>}
                            {session.user.Order_Mgr && <MenuButton icon={<FaBox/>} label="จัดการคำสั่งซื้อ" url="/admin/order-management"/>}
                            {session.user.Report && <MenuButton icon={<TbReport/>} label="รายงาน" url="/admin/report"/>}
                            {session.user.Sys_Admin && 
                            <div className="relative">
                                <button
                                    className="btn btn-ghost justify-between"
                                    onClick={() => setTreeOpen((o) => !o)}
                                >
                                    <FiSettings /> ตั้งค่าระบบ
                                    {treeOpen ? <FiChevronUp/> : <FiChevronDown/>}
                                </button>
                                {treeOpen && (
                                    <ul className="absolute bg-base-200 rounded-xl mt-2 p-2 shadow-xl w-48 z-50">
                                        <li className="px-2 py-1">
                                            <Link href={'/admin/role-management'} 
                                                className="btn btn-ghost w-full justify-start gap-2 px-3 py-2 hover:bg-base-300 rounded-lg" 
                                                onClick={() => {
                                                    setTreeOpen(false);
                                                }}>
                                                <span className="flex items-center gap-2"><FiShield/> จัดการบทบาท</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </div>}
                        </nav>
                    </div>

                    {/* ======= Mobile Menu ======= */}
                    {isMenuOpen && (
                    <div className="md:hidden bg-base-100 border-t border-base-300">
                        <div className="flex flex-col p-3 gap-2">
                            {session.user.Dashboard && <MobileMenuItem icon={<MdDashboard/>} label="แดชบอร์ด" url="/admin/dashboard"/>}
                            {session.user.User_Mgr && <MobileMenuItem icon={<FiUser/>} label="จัดการสมาชิก" url="/admin/user-management"/>}
                            {session.user.Stock_Mgr && <MobileMenuItem icon={<FaWarehouse/>} label="จัดการคลังสินค้า" url="/admin/product-management"/>}
                            {session.user.Stock_Mgr && <MobileMenuItem icon={<MdCategory/>} label="จัดการหมวดหมู่สินค้า" url="/admin/category-management"/>}
                            {session.user.Order_Mgr && <MobileMenuItem icon={<FaBox/>} label="จัดการคำสั่งซื้อ" url="/admin/order-management"/>}
                            {session.user.Report && <MobileMenuItem icon={<TbReport/>} label="รายงาน" url="/admin/report"/>}
                            {session.user.Sys_Admin && 
                                <button className="flex items-center gap-2 px-2 py-2 rounded-md text-left" onClick={() => setTreeOpen((o) => !o)}>
                                <span className="flex items-center gap-2">
                                    <FiSettings /> ตั้งค่าระบบ
                                </span>
                                {treeOpen ? <FiChevronDown /> : <FiChevronRight />}
                                </button>
                            }
                            {treeOpen && (
                            <ul className="pl-8 pb-2">
                                <li>
                                    <Link href={'/admin/role-management'} className="flex items-center gap-2 py-2" onClick={() => {
                                        setTreeOpen(false);
                                        setIsMenuOpen(false);
                                    }}>
                                    <FiShield /> จัดการบทบาท
                                    </Link>
                                </li>
                            </ul>
                            )}
                        </div>
                    </div>
                    )}
                </header>
            </>
        );
    }
}

function MenuButton({ icon, label, url }: any) {
    return (
        <Link href={url} className="btn btn-ghost flex items-center gap-2">
            {icon} {label}
        </Link>
    )
}

function MobileMenuItem({ icon, label, url }: any) {
    return (
        <Link href={url} className="flex items-center gap-2 px-2 py-2 rounded-md text-left">
            {icon} {label}
        </Link>
    )
}