'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FiMapPin, FiTruck, FiCreditCard, FiCheckCircle, 
  FiPlus, FiChevronRight, FiPackage, FiTrash2, FiMinus 
} from 'react-icons/fi'; // เพิ่ม FiMinus
import { useSession } from 'next-auth/react';
import { useCart } from '@/app/hooks/useCart';
import { formatPrice } from '@/app/utils/formatters';
import { calculateAvailableStock } from '@/app/utils/calculations'; // [NEW] นำเข้าฟังก์ชันคำนวณสต็อก
import LoadingSpinner from '@/app/components/LoadingSpinner';
import AddressSelectionModal from './AddressSelectionModal';
import { useAlert } from '@/app/context/AlertModalContext';
import AddressModal from '../components/AddressModal';
// import { AddressData } from '@/types'; // หรือ path ที่ถูกต้องของ type

// Payment Methods Config
const PAYMENT_METHODS = [
    { id: 'bank_transfer', label: 'โอนเงินผ่านธนาคาร', icon: FiCreditCard, desc: 'รวดเร็ว ปลอดภัย ตรวจสอบง่าย' },
    { id: 'cash_on_delivery', label: 'เก็บเงินปลายทาง (COD)', icon: FiTruck, desc: 'ชำระเมื่อได้รับสินค้า' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { showAlert } = useAlert();

    // 1. เรียกใช้ทุกอย่างจาก useCart Hook
    const { 
        cartItems, 
        loading, 
        addressList, 
        selectedAddress, 
        paymentMethod, 
        totalPrice,
        setSelectedAddress, 
        setPaymentMethod, 
        submitOrder,
        updateItemQuantity, // [NEW] ดึงฟังก์ชันปรับจำนวน
        removeItem,
        setAddressList        // [NEW] ดึงฟังก์ชันลบสินค้า
    } = useCart();

    // Modal States (UI Only)
    const [isSelectAddressOpen, setIsSelectAddressOpen] = useState(false);
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

    // ฟังก์ชันบันทึกที่อยู่ใหม่ (คงเดิม)
    const handleSaveAddress = async (newAddress: AddressData) => {
        try {
            const res = await fetch('/api/main/address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress),
            });
            if (!res.ok) throw new Error('บันทึกที่อยู่ไม่สำเร็จ');
            
            const data = await res.json();

            // ใน useCart ควรมี logic การ refresh หรือถ้าใช้ SWR/React Query มันจะ auto refresh
            // ถ้าไม่มี อาจต้อง reload page หรือเรียก fetchCartAndAddresses ใหม่
            // setIsAddAddressOpen(false); // ปิด modal
            showAlert('เพิ่มที่อยู่เรียบร้อยแล้ว', 'success');
            setAddressList( (prev) => [...prev, {...newAddress, Address_ID: data.address.Address_ID}])
        } catch (error) {
            showAlert('เกิดข้อผิดพลาดในการบันทึกที่อยู่', 'error');
        }
    };

    if (loading) return <LoadingSpinner />;
    
    // ถ้าไม่มีของในตะกร้า ดีดกลับ
    if (cartItems.length === 0) {
        if (typeof window !== 'undefined') router.push('/cart');
        return null;
    }

    // คำนวณส่วนลด (สำหรับ UI)
    const totalDiscount = cartItems.reduce((acc, item) => {
        if (item.Discount_Price && item.Discount_Price < item.Sale_Price) {
            return acc + ((item.Sale_Price - item.Discount_Price) * item.Cart_Quantity);
        }
        return acc;
    }, 0);

    return (
        <div className="min-h-screen bg-base-200/50 p-4 lg:p-8 font-sarabun">
            <div className="max-w-7xl mx-auto">
                
                {/* Header Title */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-base-content tracking-tight">สินค้าในตะกร้า</h1>
                    <p className="text-base-content/60 mt-2">ตรวจสอบรายละเอียดและเลือกวิธีการชำระเงินเพื่อดำเนินการต่อ</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    
                    {/* --- Left Column (Main Content) --- */}
                    <div className="flex-1 space-y-8 min-w-0">
                        
                        {/* 1. ที่อยู่จัดส่ง */}
                        <section>
                            <div className="flex justify-between items-end mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-base-content">
                                    <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                                    ที่อยู่จัดส่ง
                                </h3>
                                <button onClick={() => setIsAddAddressOpen(true)} className="btn btn-xs btn-ghost text-primary hover:bg-primary/10">
                                    <FiPlus /> เพิ่มที่อยู่ใหม่
                                </button>
                            </div>

                            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden transition-all hover:shadow-md">
                                {selectedAddress ? (
                                    <div className="card-body p-0 flex-row">
                                        <div className="w-2 bg-primary self-stretch"></div>
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="font-bold text-lg text-base-content">
                                                        {session?.user?.name} 
                                                        <span className="ml-3 text-sm font-normal px-2 py-0.5 bg-base-200 rounded-full text-base-content/70">{selectedAddress.Phone}</span>
                                                    </p>
                                                    <p className="text-base-content/80 mt-2 leading-relaxed max-w-xl">
                                                        {selectedAddress.Address_1} {selectedAddress.Address_2} {selectedAddress.Sub_District} {selectedAddress.District} {selectedAddress.Province} {selectedAddress.Zip_Code}
                                                    </p>
                                                </div>
                                                <button onClick={() => {
                                                    console.log(addressList)
                                                    setIsSelectAddressOpen(true)
                                                    }} className="btn btn-sm btn-outline btn-primary rounded-full px-6">เปลี่ยน</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="card-body p-10 items-center justify-center text-center cursor-pointer bg-base-100 hover:bg-base-50 transition-colors" 
                                        onClick={() => setIsSelectAddressOpen(true)}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-3">
                                            <FiMapPin className="w-6 h-6 text-base-content/40" />
                                        </div>
                                        <p className="text-base-content/60 font-medium">ยังไม่ได้เลือกที่อยู่จัดส่ง</p>
                                        <button className="btn btn-primary btn-sm mt-4 rounded-full px-6">เลือกที่อยู่จากรายการ</button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. รายการสินค้า (List View) - [UPDATED SECTION] */}
                        <section>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-base-content mb-4">
                                <span className="w-8 h-8 rounded-full bg-base-300 text-base-content flex items-center justify-center text-sm">2</span>
                                รายการสินค้า <span className="text-sm font-normal text-base-content/50 ml-1">({cartItems.length} รายการ)</span>
                            </h3>
                            
                            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden divide-y divide-base-200">
                                {cartItems.map((item) => {
                                    // [NEW] คำนวณสต็อกคงเหลือ
                                    const availableStock = calculateAvailableStock(item);
                                    
                                    return (
                                        <div key={item.Product_ID} className="p-4 sm:p-6 flex gap-4 sm:gap-6 hover:bg-base-50 transition-colors">
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-base-200 flex-shrink-0 p-1">
                                                <Image src={item.Image_URL || 'https://placehold.co/100x100'} alt={item.Name} fill className="object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-base-content text-base sm:text-lg truncate">{item.Name}</h4>
                                                        <p className="text-sm text-base-content/60">{item.Brand || '-'}</p>
                                                    </div>
                                                    <p className="font-bold text-base-content whitespace-nowrap">
                                                        {formatPrice((item.Discount_Price ?? item.Sale_Price) * item.Cart_Quantity)}
                                                    </p>
                                                </div>
                                                
                                                {/* [NEW] ส่วนควบคุมจำนวนและแสดงสต็อก */}
                                                <div className="flex flex-wrap justify-between items-end mt-2 gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        {/* ปุ่มปรับจำนวน */}
                                                        <div className="flex items-center border border-base-300 rounded-lg bg-base-100 h-8 w-fit">
                                                            <button
                                                                className="btn btn-xs btn-ghost px-2 rounded-r-none h-full"
                                                                onClick={() => updateItemQuantity(item.Product_ID, item.Cart_Quantity - 1)}
                                                                disabled={item.Cart_Quantity <= 1}
                                                            >
                                                                <FiMinus className="w-3 h-3" />
                                                            </button>
                                                            <span className="px-2 text-sm font-medium min-w-[2rem] text-center bg-base-100">
                                                                {item.Cart_Quantity}
                                                            </span>
                                                            <button
                                                                className="btn btn-xs btn-ghost px-2 rounded-l-none h-full"
                                                                onClick={() => updateItemQuantity(item.Product_ID, item.Cart_Quantity + 1)}
                                                                disabled={item.Cart_Quantity >= availableStock}
                                                            >
                                                                <FiPlus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        {/* แสดงสต็อกคงเหลือ */}
                                                        <p className={`text-xs ${availableStock < 5 ? 'text-warning' : 'text-base-content/50'}`}>
                                                            คงเหลือ: {availableStock} {item.Unit}
                                                        </p>
                                                    </div>

                                                    {/* ปุ่มลบ */}
                                                    <button 
                                                        className="btn btn-xs btn-ghost text-error gap-1"
                                                        onClick={() => removeItem(item.Product_ID, item.Name)}
                                                    >
                                                        <FiTrash2 /> ลบ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 3. วิธีชำระเงิน */}
                        <section>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-base-content mb-4">
                                <span className="w-8 h-8 rounded-full bg-base-300 text-base-content flex items-center justify-center text-sm">3</span>
                                วิธีการชำระเงิน
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map((method) => (
                                    <div 
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as 'bank_transfer' | 'cash_on_delivery')}
                                        className={`
                                            cursor-pointer relative p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4
                                            ${paymentMethod === method.id 
                                                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                                                : 'border-base-200 bg-base-100 hover:border-base-300 hover:bg-base-50'
                                            }
                                        `}
                                    >
                                        <div className={`p-3 rounded-full ${paymentMethod === method.id ? 'bg-primary text-white' : 'bg-base-200 text-base-content/50'}`}>
                                            <method.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold ${paymentMethod === method.id ? 'text-primary' : 'text-base-content'}`}>{method.label}</h4>
                                            <p className="text-sm text-base-content/60 mt-1">{method.desc}</p>
                                        </div>
                                        {paymentMethod === method.id && (
                                            <div className="absolute top-4 right-4 text-primary">
                                                <FiCheckCircle className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* --- Right Column (Sticky Summary) --- */}
                    <div className="lg:w-[380px] flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* Summary Card */}
                            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                                <div className="bg-base-900 text-base-content p-6 border-b border-base-200">
                                    <h2 className="text-xl font-bold">สรุปยอดชำระ</h2>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-base-content/70">
                                            <span>ยอดรวมสินค้า</span>
                                            <span>{formatPrice(totalPrice + totalDiscount)}</span>
                                        </div>
                                        {totalDiscount > 0 && (
                                            <div className="flex justify-between text-error">
                                                <span>ส่วนลด</span>
                                                <span>- {formatPrice(totalDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-success">
                                            <span>ค่าจัดส่ง</span>
                                            <span>ฟรี</span>
                                        </div>
                                    </div>

                                    <div className="divider my-2 before:bg-base-300 after:bg-base-300"></div>

                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-lg text-base-content">ยอดสุทธิ</span>
                                        <div className="text-right">
                                            <span className="font-extrabold text-3xl text-primary block leading-none">{formatPrice(totalPrice)}</span>
                                            <span className="text-xs text-base-content/50 mt-1 block">รวมภาษีมูลค่าเพิ่มแล้ว</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-base-50 border-t border-base-200">
                                    <button 
                                        onClick={submitOrder} 
                                        disabled={loading || !selectedAddress}
                                        className="btn btn-primary w-full btn-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1"
                                    >
                                        {loading ? <span className="loading loading-spinner"></span> : <span className="flex items-center gap-2">ยืนยันคำสั่งซื้อ <FiChevronRight /></span>}
                                    </button>
                                    {!selectedAddress && (
                                        <p className="text-xs text-error text-center mt-3 animate-pulse font-medium">
                                            * กรุณาเลือกที่อยู่จัดส่งก่อน
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Security Badge */}
                            <div className="text-center text-xs text-base-content/40 flex items-center justify-center gap-2">
                                <FiCheckCircle /> ปลอดภัย 100% ด้วยระบบชำระเงินมาตรฐาน
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <AddressSelectionModal 
                isOpen={isSelectAddressOpen}
                onClose={() => setIsSelectAddressOpen(false)}
                addresses={addressList} 
                currentSelectedAddress={selectedAddress} 
                onSelectAddress={(addr) => {
                    setSelectedAddress(addr);
                    setIsSelectAddressOpen(false);
                }}
                // ถ้าในอนาคตอยากให้ Modal แสดงรายการสินค้าด้วย ก็ส่ง props ไปได้เหมือนคำตอบก่อนหน้า
                // แต่ถ้าใช้หน้านี้เป็นหลักแล้ว ไม่ต้องส่งไปก็ได้ครับ
                // cartItems={cartItems} 
                // onUpdateQuantity={updateItemQuantity}
            />

            <AddressModal
                isOpen={isAddAddressOpen}
                onClose={() => setIsAddAddressOpen(false)}
                onSave={handleSaveAddress}
            /> 
           
        </div>
    );
}