'use client'
import { FaSearch, FaLine, FaFacebookSquare } from "react-icons/fa";
import { GoTriangleDown } from "react-icons/go";
import { HiMenu, HiX } from "react-icons/hi";
import { useState } from "react";
import Link from "next/link";

// --- Mock Data for Categories (copied here for self-containment of navbar) ---
// In a real application, you might fetch this from an API or a shared utility file.
const mockCategories = [
    { Category_ID: 1, Name: 'Electronics' },
    { Category_ID: 2, Name: 'Home Appliances' },
    { Category_ID: 3, Name: 'Furniture' },
];

const mockSubCategories = [
    { Category_ID: 1, Sub_Category_ID: 101, Name: 'Smartphones' },
    { Category_ID: 1, Sub_Category_ID: 102, Name: 'Laptops' },
    { Category_ID: 2, Sub_Category_ID: 201, Name: 'Kitchen' },
    { Category_ID: 2, Sub_Category_ID: 202, Name: 'Laundry' },
    { Category_ID: 3, Sub_Category_ID: 301, Name: 'Living Room' },
    { Category_ID: 3, Sub_Category_ID: 302, Name: 'Bedroom' },
];

const mockChildSubCategories = [
    { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1001, Name: 'Android Phones' },
    { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1002, Name: 'iPhones' },
    { Category_ID: 1, Sub_Category_ID: 102, Child_ID: 1003, Name: 'Gaming Laptops' },
    { Category_ID: 1, Sub_Category_ID: 102, Child_ID: 1004, Name: 'Ultrabooks' },
    { Category_ID: 2, Sub_Category_ID: 201, Child_ID: 2001, Name: 'Blenders' },
    { Category_ID: 2, Sub_Category_ID: 201, Child_ID: 2002, Name: 'Microwaves' },
    { Category_ID: 3, Sub_Category_ID: 301, Child_ID: 3001, Name: 'Sofas' },
    { Category_ID: 3, Sub_Category_ID: 301, Child_ID: 3002, Name: 'Coffee Tables' },
    { Category_ID: 3, Sub_Category_ID: 302, Child_ID: 3003, Name: 'Beds' },
    { Category_ID: 3, Sub_Category_ID: 302, Child_ID: 3004, Name: 'Wardrobes' },
];
// --- End Mock Data ---


export default function UserNavbar() { // Changed function name to UserNavbar
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full fixed top-0 left-0 right-0 z-50" data-theme="light"> {/* Changed theme to light for typical user-facing site */}
            {/* Top Bar */}
            <div className="bg-gray-200 border-b border-gray-300 text-gray-700"> {/* Adjusted text color for light theme */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-2 text-sm">
                        <p className="text-center lg:text-left font-medium mb-2 lg:mb-0">
                            เรื่องบ้านต้อง คชาโฮม ถูก ครบ จบที่เดียว
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
            <div className="bg-white shadow-lg text-gray-800"> {/* Adjusted background and text color for light theme */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg mr-2">
                                    <span className="text-white font-bold text-xl">K</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900 hidden md:block">คชาโฮม</span>
                            </Link>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl mx-4 sm:mx-8"> {/* Adjusted mx for better spacing */}
                            <div className="relative flex items-center w-full"> {/* Ensure width is full within its flex-1 parent */}
                                <div className="absolute left-3 z-10 text-gray-500"> {/* text-gray-500 for better contrast */}
                                    <FaSearch className="w-4 h-4"/>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ค้นหาสินค้า..."
                                    className="w-full bg-gray-100 placeholder-gray-500 pl-10 pr-4 py-3 rounded-l-lg border border-gray-300 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-gray-800"
                                />
                                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-r-lg border border-yellow-500 transition-colors">
                                    ค้นหา
                                </button>
                            </div>
                        </div>

                        {/* Login Section & Mobile Menu */}
                        <div className="flex items-center gap-4">
                            {/* Login Dropdown */}
                            <div className="dropdown dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost gap-2 hover:bg-gray-200 text-gray-800 rounded-lg">
                                    <span className="hidden sm:block">ลงชื่อ / สมัครสมาชิก</span>
                                    <span className="sm:hidden">เข้าสู่ระบบ</span>
                                    <GoTriangleDown className="w-4 h-4" />
                                </label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 mt-0 text-gray-800">
                                    <li> <Link href={"#"} className="hover:bg-gray-200 rounded">เข้าสู่ระบบ</Link></li>
                                    <li> <Link href={"#"} className="hover:bg-gray-200 rounded">สมัครสมาชิก</Link></li>
                                    <li> <Link href={"#"} className="hover:bg-gray-200 rounded">ลืมรหัสผ่าน</Link></li>
                                </ul>
                            </div>

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
            <div className="bg-gray-100 border-t border-gray-300 text-gray-800"> {/* Adjusted background and text color for light theme */}
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
                                            <div className="dropdown dropdown-right dropdown-hover w-full"> {/* Added w-full */}
                                                <label tabIndex={0} className="flex items-center justify-between hover:bg-gray-200 rounded pr-4 cursor-pointer">
                                                    <span>{category.Name}</span>
                                                    <GoTriangleDown className="w-3 h-3 transform -rotate-90"/> {/* Rotated for right arrow */}
                                                </label>
                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 absolute left-full top-0 text-gray-800">
                                                    <li><Link href={`/products?categoryId=${category.Category_ID}`} className="hover:bg-gray-200 rounded">ทั้งหมดใน {category.Name}</Link></li>
                                                    {mockSubCategories.filter(sub => sub.Category_ID === category.Category_ID).map(subCategory => (
                                                        <li key={subCategory.Sub_Category_ID}>
                                                            <div className="dropdown dropdown-right dropdown-hover w-full"> {/* Added w-full */}
                                                                <label tabIndex={0} className="flex items-center justify-between hover:bg-gray-200 rounded pr-4 cursor-pointer">
                                                                    <span>{subCategory.Name}</span>
                                                                    <GoTriangleDown className="w-3 h-3 transform -rotate-90"/> {/* Rotated for right arrow */}
                                                                </label>
                                                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-white rounded-box w-52 border border-gray-300 absolute left-full top-0 text-gray-800">
                                                                    <li><Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`} className="hover:bg-gray-200 rounded">ทั้งหมดใน {subCategory.Name}</Link></li>
                                                                    {mockChildSubCategories.filter(child => child.Sub_Category_ID === subCategory.Sub_Category_ID).map(childCategory => (
                                                                        <li key={childCategory.Child_ID}>
                                                                            <Link href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`} className="hover:bg-gray-200 rounded">
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
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4`}>
                        <div className="space-y-2">
                            {/* Products Dropdown for Mobile */}
                            <div className="collapse collapse-arrow bg-white rounded-box shadow-sm">
                                <input type="checkbox" className="min-h-0"/> {/* Added min-h-0 for better height control */}
                                <div className="collapse-title font-medium text-gray-800 py-3"> {/* Adjusted padding */}
                                    สินค้า
                                </div>
                                <div className="collapse-content space-y-1 bg-gray-50 text-gray-700"> {/* Lighter background for content */}
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
                                                                <Link key={childCategory.Child_ID} href={`/products?categoryId=${category.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`} className="block px-4 py-2 hover:bg-gray-300 rounded">
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
        </div>
    );
}
