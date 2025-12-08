'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaSearch, FaLine, FaFacebookSquare } from 'react-icons/fa';
import { GoTriangleDown, GoChevronRight } from "react-icons/go";
import { HiMenu, HiX } from "react-icons/hi";
import { FiShoppingCart, FiUser, FiBox, FiGrid } from "react-icons/fi";
import { useCounter } from '@/app/context/CartCount';
import { useCategoryData } from '@/app/hooks/useCategoryData';
import AuthModal from '@/app/(main)/components/AuthModal';
import { Category, SubCategory, ChildSubCategory } from '@/types';
import { useWebsiteSettings } from '@/app/providers/WebsiteSettingProvider';

// --- 1. Mobile Menu ---
const MobileCategoryMenu = ({ categories, subCategories, childSubCategories, closeMobileMenu } : { categories: Category[], subCategories: SubCategory[], childSubCategories: ChildSubCategory[], closeMobileMenu: () => void }) => {
  if (!categories || categories.length === 0) return <li><a>ไม่มีหมวดหมู่</a></li>;
  
  return (
    <>
      {categories.map(category => (
        <li key={category.Category_ID}>
          <details>
            <summary className="font-medium">{category.Name}</summary>
            <ul className="p-2 bg-base-200/50">
              <li><Link href={`/products?categoryId=${category.Category_ID}`} onClick={closeMobileMenu} className="text-primary text-xs">ดูทั้งหมดใน {category.Name}</Link></li>
              {subCategories.filter(sub => sub.Category_ID === category.Category_ID).map(sub => (
                <li key={sub.Sub_Category_ID}>
                  <details>
                    <summary className="text-sm">{sub.Name}</summary>
                    <ul className="p-2 bg-base-100 border-l-2 border-base-300">
                      {childSubCategories.filter(child => child.Sub_Category_ID === sub.Sub_Category_ID).map(child => (
                        <li key={child.Child_ID}>
                          <Link 
                            href={`/products?categoryId=${child.Category_ID}&subCategoryId=${child.Sub_Category_ID}&childCategoryId=${child.Child_ID}`}
                            onClick={closeMobileMenu}
                            className="text-xs"
                          >
                            {child.Name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </>
  );
};

// --- 2. Desktop Mega Menu (แก้ไขเรื่อง Dropdown กระพริบ) ---
const DesktopMegaMenu = ({ categories, subCategories, childSubCategories, closeMenu }: { categories: Category[], subCategories: SubCategory[], childSubCategories: ChildSubCategory[], closeMenu: () => void }) => {
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(categories[0]?.Category_ID || null);

    const currentSubs = useMemo(() => 
        subCategories.filter(s => s.Category_ID === activeCategoryId), 
    [activeCategoryId, subCategories]);

    return (
        // แก้ไข: ใช้ Wrapper div (dropdown-content) ที่มี pt-4 (Padding Top) แทน mt-4 (Margin Top)
        // เพื่อให้พื้นที่ว่างยังคงเป็นส่วนหนึ่งของ Dropdown ทำให้เมาส์ไม่หลุด Focus
        <div className="dropdown-content z-[1] w-[800px] pt-4">
            {/* ตัวกล่องเมนูจริงๆ อยู่ข้างใน Wrapper อีกที */}
            <div className="menu p-0 shadow-xl bg-base-100 rounded-box flex flex-row overflow-hidden border border-base-200 w-full">
                
                {/* Left Column: Main Categories */}
                <ul className="w-64 bg-base-200/50 p-2 overflow-y-auto max-h-[500px]">
                    <li className="menu-title px-4 py-2 text-xs uppercase tracking-wider text-base-content/50">หมวดหมู่หลัก</li>
                    {categories.map(cat => (
                        <li key={cat.Category_ID}>
                            <Link 
                                href={`/products?categoryId=${cat.Category_ID}`}
                                onMouseEnter={() => setActiveCategoryId(cat.Category_ID)}
                                onClick={closeMenu}
                                className={`flex justify-between items-center py-3 ${activeCategoryId === cat.Category_ID ? 'active font-bold' : ''}`}
                            >
                                {cat.Name}
                                <GoChevronRight className={`w-4 h-4 ${activeCategoryId === cat.Category_ID ? 'opacity-100' : 'opacity-0'}`} />
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Right Column: Sub & Child Categories */}
                <div className="flex-1 p-6 bg-base-100 overflow-y-auto max-h-[500px]">
                    {activeCategoryId ? (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                             <div className="col-span-2 mb-2">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-primary border-b pb-2">
                                    <FiBox /> {categories.find(c => c.Category_ID === activeCategoryId)?.Name}
                                    <Link href={`/products?categoryId=${activeCategoryId}`} onClick={closeMenu} className="text-xs font-normal ml-auto btn btn-xs btn-ghost">ดูสินค้าทั้งหมดในหมวดนี้</Link>
                                </h3>
                             </div>
                             
                             {currentSubs.length > 0 ? currentSubs.map(sub => (
                                 <div key={sub.Sub_Category_ID} className="break-inside-avoid">
                                     <Link 
                                        href={`/products?categoryId=${activeCategoryId}&subCategoryId=${sub.Sub_Category_ID}`}
                                        onClick={closeMenu}
                                        className="font-bold text-base mb-2 hover:text-primary block"
                                     >
                                         {sub.Name}
                                     </Link>
                                     <ul className="space-y-1">
                                         {childSubCategories.filter(child => child.Sub_Category_ID === sub.Sub_Category_ID).map(child => (
                                             <li key={child.Child_ID}>
                                                 <Link 
                                                    href={`/products?categoryId=${activeCategoryId}&subCategoryId=${sub.Sub_Category_ID}&childCategoryId=${child.Child_ID}`}
                                                    onClick={closeMenu}
                                                    className="text-sm text-base-content/70 hover:text-primary hover:underline block py-0.5"
                                                 >
                                                     {child.Name}
                                                 </Link>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             )) : (
                                 <div className="col-span-2 text-center py-10 text-base-content/50">ไม่มีหมวดหมู่ย่อย</div>
                             )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-base-content/50">
                            กรุณาเลือกหมวดหมู่หลัก
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function UserNavbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { count: cartItemCount, setCounter } = useCounter();
    const { categories, subCategories, childSubCategories, loading: navLoading } = useCategoryData();

    const settings = useWebsiteSettings();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const closeMobileMenu = () => setIsMenuOpen(false);

    // State เพื่อปิด Dropdown เมื่อคลิก Link ข้างใน (เฉพาะ Desktop)
    const closeDesktopMenu = () => {
        const elem = document.activeElement as HTMLElement;
        if (elem) {
            elem?.blur(); // สั่ง blur เพื่อปิด dropdown (DaisyUI ใช้ focus ในการเปิด/ปิด)
        }
    };

    useEffect(() => {
        const fetchCartCount = async () => {
            if (status === 'authenticated') {
                const res = await fetch('/api/main/cart');
                if (!res.ok) {
                  setCounter(0);
                  return;
                }
                const data = await res.json();
                setCounter(data.cartItems?.length || 0);
            } else {
                setCounter(0);
            }
        };
        fetchCartCount();
    }, [status, setCounter]);

    const handleLogout = () => {
      signOut({ callbackUrl: "/" });
    };

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        router.push(`/products?search=${encodeURIComponent(trimmedSearch)}`);
      }
      closeMobileMenu();
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-base-100 shadow-sm font-sarabun">
                {/* Top Bar */}
                <div className="bg-base-200 text-xs text-base-content/80 border-b border-base-300/50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center sm:justify-between items-center py-1 gap-x-4 gap-y-1">
                        <span>{settings.siteDescription}</span>
                        <div className="flex items-center gap-4">
                            <a href={settings.lineURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><FaLine className="text-green-500" /> {settings.lineOfficialName}</a>
                            <a href={settings.facebookURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><FaFacebookSquare className="text-blue-600" /> {settings.facebookPageName}</a>
                            <Link href="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
                        </div>
                    </div>
                </div>

                {/* Main Header */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3 gap-4">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                {/* <span className="text-white font-bold text-2xl">K</span> */}
                                <img src={settings.logoURL} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold leading-tight text-base-content">{settings.siteName}</span>
                                <span className="text-[10px] text-base-content/60 tracking-wider">CONSTRUCTION MATERIALS SHOP</span>
                            </div>
                        </Link>

                        <div className="flex-1 max-w-xl mx-4 hidden md:block">
                            <form onSubmit={handleSearch} className="join w-full shadow-sm">
                                <input type="text" placeholder="ค้นหาสินค้าวัสดุก่อสร้าง..." className="input input-bordered join-item w-full focus:outline-none focus:border-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <button type="submit" className="btn btn-primary join-item px-6"><FaSearch /></button>
                            </form>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Cart Icon */}
                            {status === 'authenticated' && (
                                <Link href="/cart" className="btn btn-ghost btn-circle relative hover:bg-base-200">
                                    <div className="indicator">
                                        <FiShoppingCart className="w-6 h-6" />
                                        {cartItemCount > 0 && <span className="badge badge-sm badge-primary indicator-item border-none shadow-sm animate-bounce">{cartItemCount}</span>}
                                    </div>
                                </Link>
                            )}

                            {/* User Menu */}
                            {status === 'authenticated' ? (
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost gap-2 pl-2 pr-1 rounded-full hover:bg-base-200 border border-transparent hover:border-base-300">
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral-focus text-neutral-content rounded-full w-8 h-8 bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="text-xs font-bold">{session.user?.name?.charAt(0)}</span>
                                            </div>
                                        </div>
                                        <span className="hidden sm:inline-block text-sm font-medium max-w-[100px] truncate">{session.user?.name}</span>
                                        <GoTriangleDown className="w-4 h-4 text-base-content/50" />
                                    </label>
                                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-xl w-56 border border-base-200">
                                        <li className="menu-title px-4 py-2 border-b border-base-200 mb-2">
                                            <span className="text-base-content/50 text-xs font-normal">เข้าสู่ระบบโดย</span>
                                            <span className="text-base-content font-bold text-sm -mt-1 truncate block">{session.user?.email}</span>
                                        </li>
                                        <li><Link href="/profile" className="py-2"><FiUser className="w-4 h-4"/> โปรไฟล์ของฉัน</Link></li>
                                        <li><Link href="/orders-history" className="py-2"><FiBox className="w-4 h-4"/> ประวัติคำสั่งซื้อ</Link></li>
                                        <div className="divider my-1"></div>
                                        <li><a onClick={handleLogout} className="py-2 text-error hover:bg-error/10 hover:text-error"><span className="flex items-center gap-2">ออกจากระบบ</span></a></li>
                                    </ul>
                                </div>
                            ) : (
                                <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary btn-sm sm:btn-md rounded-full px-6 shadow-md hover:shadow-lg">เข้าสู่ระบบ</button>
                            )}
                            
                            {/* Mobile Menu Button */}
                            <div className="lg:hidden ml-1">
                                <button className="btn btn-ghost btn-circle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                    {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Search (Visible only on mobile) */}
                <div className="md:hidden px-4 pb-3">
                    <form onSubmit={handleSearch} className="relative w-full">
                        <input type="text" placeholder="ค้นหาสินค้า..." className="input input-bordered w-full pr-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button type="submit" className="absolute right-0 top-0 h-full px-3 text-base-content/50"><FaSearch /></button>
                    </form>
                </div>

                {/* Desktop Navigation Menu */}
                <nav className="hidden lg:block border-t border-base-200 bg-base-100">
                    <div className="container mx-auto">
                        <ul className="menu menu-horizontal px-1 text-sm font-medium w-full">
                            <li><Link href="/" className="hover:text-primary focus:text-primary border-b-2 border-transparent hover:border-primary rounded-none py-3 transition-all">หน้าแรก</Link></li>
                            
                            {/* --- Mega Menu Trigger --- */}
                            <li className="dropdown dropdown-hover group">
                                <label tabIndex={0} className="flex items-center gap-1 cursor-pointer py-3 hover:text-primary focus:text-primary group-hover:text-primary border-b-2 border-transparent hover:border-primary rounded-none transition-all">
                                    <FiGrid className="w-4 h-4" /> สินค้าทั้งหมด <GoTriangleDown />
                                </label>
                                {/* --- Mega Menu Content --- */}
                                {navLoading ? (
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[1]"><li><a>กำลังโหลด...</a></li></ul>
                                ) : (
                                    <DesktopMegaMenu 
                                        categories={categories} 
                                        subCategories={subCategories} 
                                        childSubCategories={childSubCategories} 
                                        closeMenu={closeDesktopMenu}
                                    />
                                )}
                            </li>
                            
                            <li><Link href="/products?discount=true" className="hover:text-primary focus:text-primary border-b-2 border-transparent hover:border-primary rounded-none py-3 transition-all">สินค้าลดราคา</Link></li>
                            
                            <div className="flex-1"></div> {/* Spacer */}
                            
                            {(session?.user?.accessLevel != 0 && session?.user.accessLevel !== undefined) && (
                                <li><Link href="/admin" className="text-warning font-bold hover:bg-warning/10 border-b-2 border-transparent hover:border-warning rounded-none py-3">จัดการระบบ (Admin)</Link></li>
                            )}
                        </ul>
                    </div>
                </nav>

                {/* Mobile Navigation Menu (Drawer style) */}
                <div className={`lg:hidden bg-base-100 border-t border-base-200 overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="menu p-4 text-base-content">
                        <li><Link href="/" onClick={closeMobileMenu} className="font-bold">หน้าแรก</Link></li>
                        
                        <div className="divider my-1">หมวดหมู่สินค้า</div>
                        {navLoading ? <li><a>กำลังโหลด...</a></li> : 
                         <MobileCategoryMenu categories={categories} subCategories={subCategories} childSubCategories={childSubCategories} closeMobileMenu={closeMobileMenu} />}
                        
                        <div className="divider my-1">อื่นๆ</div>
                        <li><Link href="/products?discount=true" onClick={closeMobileMenu}>สินค้าลดราคา</Link></li>
                        {(session?.user?.accessLevel != 0 && session?.user.accessLevel !== undefined) && 
                            <li className="mt-2"><Link href="/admin" className="bg-warning text-warning-content hover:bg-warning-focus" onClick={closeMobileMenu}>จัดการระบบ</Link></li>
                        }
                    </ul>
                </div>
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}