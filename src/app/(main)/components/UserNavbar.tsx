'use client'
import { FaSearch, FaLine, FaFacebookSquare } from "react-icons/fa";
import { GoTriangleDown } from "react-icons/go";
import { HiMenu, HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import { FiShoppingCart } from "react-icons/fi";
import { useCounter } from '@/app/context/CartCount';
import { signOut, useSession } from "next-auth/react";
import { useAlert } from "@/app/context/AlertModalContext";
import { CartDetailSchema } from "@/types";
// --- Mock Data for Categories (copied here for self-containment of navbar) ---
const mockCategories = [
    { Category_ID: 1, Name: 'เครื่องใช้ไฟฟ้า' },
    { Category_ID: 2, Name: 'เครื่องใช้ในบ้าน' },
    { Category_ID: 3, Name: 'เฟอร์นิเจอร์' },
];

const mockSubCategories = [
    { Category_ID: 1, Sub_Category_ID: 101, Name: 'สมาร์ทโฟน' },
    { Category_ID: 1, Sub_Category_ID: 102, Name: 'แล็ปท็อป' },
    { Category_ID: 2, Sub_Category_ID: 201, Name: 'ห้องครัว' },
    { Category_ID: 2, Sub_Category_ID: 202, Name: 'ซักรีด' },
    { Category_ID: 3, Sub_Category_ID: 301, Name: 'ห้องนั่งเล่น' },
    { Category_ID: 3, Sub_Category_ID: 302, Name: 'ห้องนอน' },
];

const mockChildSubCategories = [
    { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1001, Name: 'โทรศัพท์ Android' },
    { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1002, Name: 'ไอโฟน' },
    { Category_ID: 1, Sub_Category_ID: 102, Child_ID: 1003, Name: 'แล็ปท็อปเกมมิ่ง' },
    { Category_ID: 1, Sub_Category_ID: 102, Child_ID: 1004, Name: 'อัลตร้าบุ๊ก' },
    { Category_ID: 2, Sub_Category_ID: 201, Child_ID: 2001, Name: 'เครื่องปั่น' },
    { Category_ID: 2, Sub_Category_ID: 201, Child_ID: 2002, Name: 'ไมโครเวฟ' },
    { Category_ID: 3, Sub_Category_ID: 301, Child_ID: 3001, Name: 'โซฟา' },
    { Category_ID: 3, Sub_Category_ID: 301, Child_ID: 3002, Name: 'โต๊ะกาแฟ' },
    { Category_ID: 3, Sub_Category_ID: 302, Child_ID: 3003, Name: 'เตียง' },
    { Category_ID: 3, Sub_Category_ID: 302, Child_ID: 3004, Name: 'ตู้เสื้อผ้า' },
];
// --- End Mock Data ---


export default function UserNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const router = useRouter();
    const { count: cartItemCount, setCounter } = useCounter();
    const { showAlert, hideAlert } = useAlert()
    const session = useSession();

    useEffect(() => {
        if (session.status == 'authenticated') {
            const fetchInitialCartCount = async () => {
                console.log("กำลังดึงจำนวนสินค้าในตะกร้าสำหรับผู้ใช้ที่เข้าสู่ระบบ...");
                // await new Promise(resolve => setTimeout(resolve, 300));
                const result = await fetch('/api/main/cart?userId=' + session.data.user.id)
                const data = await result.json()
                const mockInitialCount = data.cartItems.length;
                setCounter(mockInitialCount);
                console.log(`จำนวนสินค้าในตะกร้าถูกตั้งค่าเป็น: ${mockInitialCount}`);
                handleLoginSuccess('test name')
            };
            fetchInitialCartCount();
        } else {
            console.log('l')
            setCounter(0);
        }
    }, [session.status, setCounter]);

    useEffect(()=>{
        if (session.status == 'authenticated'){
            handleLoginSuccess('test name')
        }
    },[])


    const handleLoginSuccess = (name: string) => {
      setIsLoggedIn(true);
      setUserName(name);
      setIsAuthModalOpen(false);
    };

    const handleLogout = () => {
      setIsLoggedIn(false);
      setUserName('');
      signOut()
      alert('ออกจากระบบเรียบร้อยแล้ว');
    };

    const handleSearch = (e: React.FormEvent | React.MouseEvent) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        setSearchTerm('');
      } else {
        router.push('/products');
      }
    };

    if (session.status == 'authenticated'){
    }

    
    if (session.status != 'loading')
    return (
        <div className="w-full" data-theme="light">
            {/* Top Bar */}
            <button onClick={async()=>{
                console.log(session.data?.user, session.status)
                // const k = await fetch('api/testApi')
                // showAlert('test','info','kacha982',()=>{ console.log('k')
                    // return 'k'})


            }}>test</button>
            <div className="bg-gray-200 border-b border-gray-300 text-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-2 text-sm">
                        <p className="text-center lg:text-left font-medium mb-2 lg:mb-0">
                            สำหรับทุกความต้องการในบ้าน: สินค้าที่ใช่, ครบวงจร, ที่เดียวจบ.
                        </p>

                        <div className="flex justify-center lg:justify-start gap-4 mb-2 lg:mb-0">
                            <a href="https://line.me/ti/p/~kacha982" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-pointer">
                                <FaLine className="text-green-700 text-3xl"/>
                                <span>kacha982</span>
                            </a>
                            <a href="https://www.facebook.com/KachaHomeTH" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer">
                                <FaFacebookSquare className="text-blue-700 text-3xl"/>
                                <span className="hidden sm:block">บริษัท คชาโฮม จำกัด</span>
                                <span className="sm:hidden">คชาโฮม</span>
                            </a>
                        </div>

                        <div className="text-center lg:text-right">
                            <Link href="#" className="hover:text-yellow-600 transition-colors">
                                ติดต่อเรา
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="bg-white shadow-lg text-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg mr-2">
                                    <span className="text-white font-bold text-xl">K</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 hidden md:block">Kacha Home</span>
                            </Link>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
                            <form onSubmit={handleSearch} className="relative flex items-center w-full">
                                <div className="absolute left-3 z-10 text-gray-500">
                                    <FaSearch className="w-4 h-4"/>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ค้นหาสินค้า..."
                                    className="input input-bordered w-full pl-10 pr-4 py-3 bg-gray-100 placeholder-gray-500 rounded-l-lg border border-gray-300 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-gray-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-r-lg border border-yellow-500 transition-colors">
                                    ค้นหา
                                </button>
                            </form>
                        </div>

                        {/* Login Section & Mobile Menu */}
                        <div className="flex items-center gap-4">
                            {/* Shopping Cart Icon (Conditional Rendering) */}
                            {session.status == 'authenticated' && (
                                <Link href="/cart" className="btn btn-ghost btn-circle text-gray-800 hover:bg-gray-200">
                                    <div className="indicator">
                                        <FiShoppingCart className="w-5 h-5" />
                                        {/* Badge for item count */}
                                        {cartItemCount > 0 && (
                                            <span className="badge badge-sm badge-primary indicator-item text-white font-semibold">
                                                {cartItemCount}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            )}

                            {session.status == 'authenticated' ? (
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn btn-ghost gap-2 hover:bg-gray-200 text-gray-800 rounded-lg">
                                        <span className="hidden sm:block">{session.data.user?.name}</span>
                                        <span className="sm:hidden text-sm">{ session.data.user?.name?.split(' ')[0] }</span>
                                        <GoTriangleDown className="w-4 h-4" />
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 mt-0 text-gray-800">
                                        <li> <Link href={"/profile"} className="hover:bg-gray-200 rounded">โปรไฟล์ของฉัน</Link></li>
                                        <li> <Link href={"/orders"} className="hover:bg-gray-200 rounded">ประวัติคำสั่งซื้อ</Link></li>
                                        <li> <Link href={"/favorites"} className="hover:bg-gray-200 rounded">รายการโปรด</Link></li>
                                        <li> <a onClick={handleLogout} className="hover:bg-gray-200 rounded">ออกจากระบบ</a></li>
                                    </ul>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="btn btn-ghost gap-2 hover:bg-gray-200 text-gray-800 rounded-lg"
                                >
                                    <span className="hidden sm:block">เข้าสู่ระบบ / ลงทะเบียน</span>
                                    <span className="sm:hidden">เข้าสู่ระบบ</span>
                                </button>
                            )}

                            {/* Mobile Menu Button */}
                            <div className="lg:hidden">
                                <button
                                    className="btn btn-square btn-ghost hover:bg-gray-200 text-gray-800"
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
            <div className="bg-gray-100 border-t border-gray-300 text-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Desktop Menu */}
                    <div className="hidden lg:flex">
                        <div className="flex">
                            {/* Products Dropdown */}
                            <div className="dropdown dropdown-hover">
                                <label tabIndex={0} className="flex items-center px-6 py-4 hover:bg-gray-200 transition-colors cursor-pointer gap-1">
                                    สินค้า
                                    <GoTriangleDown className="w-3 h-3"/>
                                </label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 mt-0 text-gray-800">
                                    <li><Link href="/products" className="hover:bg-gray-200 rounded">สินค้าทั้งหมด</Link></li>
                                    {mockCategories.map(category => (
                                        <li key={category.Category_ID}>
                                            <div className="dropdown dropdown-right dropdown-hover w-full">
                                                <label tabIndex={0} className="flex items-center justify-between hover:bg-gray-200 rounded pr-4 cursor-pointer">
                                                    <span>{category.Name}</span>
                                                    <GoTriangleDown className="w-3 h-3 transform -rotate-90"/>
                                                </label>
                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 absolute left-full top-0 text-gray-800">
                                                    <li><Link href={`/products?categoryId=${category.Category_ID}`} className="hover:bg-gray-200 rounded">ทั้งหมดใน {category.Name}</Link></li>
                                                    {mockSubCategories.filter(sub => sub.Category_ID === category.Category_ID).map(subCategory => (
                                                        <li key={subCategory.Sub_Category_ID}>
                                                            <div className="dropdown dropdown-right dropdown-hover w-full">
                                                                <label tabIndex={0} className="flex items-center justify-between hover:bg-gray-200 rounded pr-4 cursor-pointer">
                                                                    <span>{subCategory.Name}</span>
                                                                    <GoTriangleDown className="w-3 h-3 transform -rotate-90"/>
                                                                </label>
                                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 absolute left-full top-0 text-gray-800">
                                                                    <li><Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`} className="hover:bg-gray-300 rounded">ทั้งหมดใน {subCategory.Name}</Link></li>
                                                                    {mockChildSubCategories.filter(child => child.Sub_Category_ID === subCategory.Sub_Category_ID).map(childCategory => (
                                                                        <li key={childCategory.Child_ID}>
                                                                            <Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${childCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`} className="hover:bg-gray-300 rounded">
                                                                                {childCategory.Name}
                                                                            </Link>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Discounted Products Link */}
                            <Link href="/products?discount=true" className="px-6 py-4 hover:bg-gray-200 transition-colors">
                                สินค้าลดราคา
                            </Link>
                            {/* Other general links if any */}
                            <Link href="#" className="px-6 py-4 hover:bg-gray-200 transition-colors">
                                โปรโมชั่น
                            </Link>
                            <Link href="#" className="px-6 py-4 hover:bg-gray-200 transition-colors">
                                ข่าวสาร
                            </Link>

                            {session.data?.user.accessLevel === "1" ? 
                            <Link href="/admin/dashboard" className="px-6 py-4 hover:bg-gray-200 transition-colors bg-amber-500">
                                จัดการระบบ
                            </Link> :
                            <></>
                            }
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4`}>
                        <div className="space-y-2">
                            {/* Products Dropdown for Mobile */}
                            <div className="collapse collapse-arrow bg-white rounded-box shadow-sm">
                                <input type="checkbox" className="min-h-0"/>
                                <div className="collapse-title font-medium text-gray-800 py-3">
                                    สินค้า
                                </div>
                                <div className="collapse-content space-y-1 bg-gray-50 text-gray-700">
                                    <Link href="/products" className="block px-4 py-2 hover:bg-gray-200 rounded">สินค้าทั้งหมด</Link>
                                    {mockCategories.map(category => (
                                        <div key={category.Category_ID} className="collapse collapse-arrow bg-white rounded-box my-1">
                                            <input type="checkbox" className="min-h-0"/>
                                            <div className="collapse-title font-medium text-gray-800 py-3">
                                                {category.Name}
                                            </div>
                                            <div className="collapse-content space-y-1 bg-gray-100 text-gray-700">
                                                <Link href={`/products?categoryId=${category.Category_ID}`} className="block px-4 py-2 hover:bg-gray-200 rounded">ทั้งหมดใน {category.Name}</Link>
                                                {mockSubCategories.filter(sub => sub.Category_ID === category.Category_ID).map(subCategory => (
                                                    <div key={subCategory.Sub_Category_ID} className="collapse collapse-arrow bg-white rounded-box my-1">
                                                        <input type="checkbox" className="min-h-0"/>
                                                        <div className="collapse-title font-medium text-gray-800 py-3">
                                                            {subCategory.Name}
                                                        </div>
                                                        <div className="collapse-content space-y-1 bg-gray-200 text-gray-700">
                                                            <Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`} className="block px-4 py-2 hover:bg-gray-300 rounded">ทั้งหมดใน {subCategory.Name}</Link>
                                                            {mockChildSubCategories.filter(child => child.Sub_Category_ID === subCategory.Sub_Category_ID).map(childCategory => (
                                                                <Link key={childCategory.Child_ID} href={`/products?categoryId=${category.Category_ID}&subCategoryId=${childCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`} className="block px-4 py-2 hover:bg-gray-300 rounded">
                                                                    {childCategory.Name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Discounted Products Link for Mobile */}
                            <Link href="/products?discount=true" className="block px-4 py-3 hover:bg-gray-200 rounded transition-colors bg-white shadow-sm text-gray-800">
                                สินค้าลดราคา
                            </Link>
                            {/* Other general links for mobile */}
                            <Link href="#" className="block px-4 py-3 hover:bg-gray-200 rounded transition-colors bg-white shadow-sm text-gray-800">
                                โปรโมชั่น
                            </Link>
                            <Link href="#" className="block px-4 py-3 hover:bg-gray-200 rounded transition-colors bg-white shadow-sm text-gray-800">
                                ข่าวสาร
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    );
}
