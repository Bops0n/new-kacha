'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FaSearch, FaLine, FaFacebookSquare } from 'react-icons/fa';
import { GoTriangleDown } from "react-icons/go";
import { HiMenu, HiX } from "react-icons/hi";
import { FiShoppingCart, FiUser } from "react-icons/fi";
import { useCounter } from '@/app/context/CartCount';
import { useCategoryData } from '@/app/hooks/useCategoryData'; // << 1. เปลี่ยน hook ที่ import
import AuthModal from '@/app/(main)/components/AuthModal';
import { Category, SubCategory, ChildSubCategory } from '@/types';

// ... (CategoryMenuItems component ไม่มีการเปลี่ยนแปลง) ...

const CategoryMenuItems = ({ categories, subCategories, childSubCategories, closeMobileMenu } : { categories: Category[], subCategories: SubCategory[], childSubCategories: ChildSubCategory[], closeMobileMenu: () => void }) => {
  if (!categories || categories.length === 0) {
    return <li><a>ไม่มีหมวดหมู่</a></li>;
  }
  return categories.map(category => (
    <li key={category.Category_ID}>
      <details>
        <summary>
          <Link href={`/products?categoryId=${category.Category_ID}`} onClick={(e) => { e.stopPropagation(); closeMobileMenu(); }}>
            {category.Name}
          </Link>
        </summary>
        <ul className="p-2 bg-base-100">
          {subCategories.filter(sub => sub.Category_ID === category.Category_ID).map(sub => (
            <li key={sub.Sub_Category_ID}>
              <details>
                <summary>
                  <Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${sub.Sub_Category_ID}`} onClick={(e) => { e.stopPropagation(); closeMobileMenu(); }}>
                    {sub.Name}
                  </Link>
                </summary>
                <ul className="p-2">
                  {childSubCategories.filter(child => child.Sub_Category_ID === sub.Sub_Category_ID).map(child => (
                    <li key={child.Child_ID}>
                      <Link 
                        href={`/products?categoryId=${child.Category_ID}&subCategoryId=${child.Sub_Category_ID}&childCategoryId=${child.Child_ID}`}
                        onClick={closeMobileMenu}
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
  ));
};


export default function UserNavbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { count: cartItemCount, setCounter } = useCounter();
    // << 2. เรียกใช้ useCategoryData แทน useNavigation
    const { categories, subCategories, childSubCategories, loading: navLoading } = useCategoryData();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const closeMobileMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        const fetchCartCount = async () => {
            if (status === 'authenticated') {
                try {
                    const res = await fetch('/api/main/cart');
                    if (!res.ok) return;
                    const data = await res.json();
                    setCounter(data.cartItems?.length || 0);
                } catch (error) {
                    console.error("Failed to fetch cart count:", error);
                }
            } else {
                setCounter(0);
            }
        };
        fetchCartCount();
    }, [status, setCounter]);

    const handleLogout = () => {
      signOut({ callbackUrl: '/' });
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
            <header className="sticky top-0 z-50 bg-base-100 shadow-sm">
                {/* Top Bar & Main Header */}
                <div className="bg-base-200 text-xs text-base-content/80 border-b border-base-300/50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center sm:justify-between items-center py-1 gap-x-4 gap-y-1">
                        <span>สำหรับทุกความต้องการในบ้าน: สินค้าที่ใช่, ครบวงจร, ที่เดียวจบ.</span>
                        <div className="flex items-center gap-4">
                            <a href="https://line.me/ti/p/~kacha982" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><FaLine className="text-green-500" /> kacha982</a>
                            <a href="https://www.facebook.com/KachaHomeTH" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><FaFacebookSquare className="text-blue-600" /> บริษัท คชาโฮม จำกัด</a>
                            <Link href="/contact" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3 gap-4">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow"><span className="text-white font-bold text-3xl">K</span></div>
                            <span className="text-2xl font-bold hidden md:block">Kacha Home</span>
                        </Link>
                        <div className="flex-1 max-w-xl mx-4">
                            <form onSubmit={handleSearch} className="join w-full">
                                <input type="text" placeholder="ค้นหาสินค้า..." className="input input-bordered join-item w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <button type="submit" className="btn btn-warning join-item"><FaSearch /></button>
                            </form>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {status === 'authenticated' && <Link href="/cart" className="btn btn-ghost btn-circle"><div className="indicator"><FiShoppingCart className="w-6 h-6" />{cartItemCount > 0 && <span className="badge badge-sm badge-primary indicator-item">{cartItemCount}</span>}</div></Link>}
                            {status === 'authenticated' ? (
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost normal-case font-normal hidden sm:flex">{session.user?.name?.split(' ')[0]} <GoTriangleDown /></label>
                                    <label tabIndex={0} className="btn btn-ghost btn-circle sm:hidden"><FiUser className="w-6 h-6"/></label>
                                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                                        <li className="menu-title"><span>{session.user?.name}</span></li>
                                        <li><Link href="/profile">โปรไฟล์ของฉัน</Link></li>
                                        <li><Link href="/orders-history">ประวัติคำสั่งซื้อ</Link></li>
                                        <li><a onClick={handleLogout}>ออกจากระบบ</a></li>
                                    </ul>
                                </div>
                            ) : (<button onClick={() => setIsAuthModalOpen(true)} className="btn btn-ghost normal-case">เข้าสู่ระบบ</button>)}
                            <div className="lg:hidden"><button className="btn btn-ghost btn-circle" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}</button></div>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className={`bg-base-200 text-base-content border-t border-base-300/50 lg:block ${isMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="container mx-auto flex flex-col lg:flex-row lg:items-center">
                        <ul className="menu menu-horizontal hidden lg:flex px-4 text-sm">
                            <li><Link href="/">หน้าแรก</Link></li>
                            <li className="dropdown dropdown-hover">
                                <label tabIndex={0} className="flex items-center">สินค้า <GoTriangleDown /></label>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-56">
                                    <li><Link href="/products">สินค้าทั้งหมด</Link></li>
                                    <div className="divider my-0"></div>
                                    {navLoading ? <li><a>กำลังโหลด...</a></li> : 
                                     <CategoryMenuItems categories={categories} subCategories={subCategories} childSubCategories={childSubCategories} closeMobileMenu={() => {}} />}
                                </ul>
                            </li>
                            <li><Link href="/products?discount=true">สินค้าลดราคา</Link></li>
                            <li><Link href="#">โปรโมชั่น</Link></li>
                            <li><Link href="#">ข่าวสาร</Link></li>
                        </ul>
                        {session?.user?.accessLevel === 9 && (<div className="hidden lg:block ml-auto px-4"><Link href="/admin/dashboard" className="btn btn-warning btn-sm">จัดการระบบ</Link></div>)}
                        
                        {/* Mobile Menu */}
                        <ul className="menu lg:hidden px-4 py-2">
                            {navLoading ? <span className="loading loading-dots loading-md mx-auto"></span> :
                             <CategoryMenuItems categories={categories} subCategories={subCategories} childSubCategories={childSubCategories} closeMobileMenu={closeMobileMenu} />}
                            <li><Link href="/products?discount=true" onClick={closeMobileMenu}>สินค้าลดราคา</Link></li>
                            <li><Link href="#" onClick={closeMobileMenu}>โปรโมชั่น</Link></li>
                            <li><Link href="#" onClick={closeMobileMenu}>ข่าวสาร</Link></li>
                            {session?.user?.accessLevel === 9 && <li className="mt-2"><Link href="/dashboard" className="btn btn-warning btn-sm w-full" onClick={closeMobileMenu}>จัดการระบบ</Link></li>}
                        </ul>
                    </div>
                </nav>
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
}