'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { FiMapPin, FiEdit, FiTrash2, FiPlusCircle, FiMinusCircle, FiShoppingCart, FiBox, FiDollarSign, FiPlus } from "react-icons/fi";
import { useCart } from '@/app/hooks/useCart' // << 1. Import hook
import AddressSelectionModal from "./AddressSelectionModal";
import LoadingSpinner from "@/app/components/LoadingSpinner"; // Adjusted path
import { formatPrice } from "@/app/utils/formatters"; // Adjusted path
import { CartDetailSchema as CartProduct } from '@/types';

// UI-only component for displaying a single cart item
interface CartItemProps {
    item: CartProduct;
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemove: (productId: number, productName: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
    return (
        <div className="flex items-center bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 relative">
            <img
                src={item.Image_URL || 'https://placehold.co/100x100?text=No+Image'}
                alt={item.Name}
                width={100}
                height={100}
                className="w-24 h-24 object-contain rounded-md flex-shrink-0 mr-4"
            />
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div>
                    <h3 className="font-semibold text-lg">{item.Name}</h3>
                    <p className="text-sm text-base-content/70">แบรนด์: {item.Brand}</p>
                    <p className="font-bold text-primary mt-1 text-lg">{formatPrice(item.Sale_Price)} / {item.Unit}</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <button
                            className="btn btn-sm btn-circle btn-outline"
                            onClick={() => onUpdateQuantity(item.Product_ID, item.Quantity - 1)}
                            disabled={item.Quantity <= 1}
                        >
                            <FiMinusCircle />
                        </button>
                        <span className="font-bold text-xl min-w-[30px] text-center">{item.Quantity}</span>
                        <button
                            className="btn btn-sm btn-circle btn-outline"
                            onClick={() => onUpdateQuantity(item.Product_ID, item.Quantity + 1)}
                            disabled={item.Quantity >= item.AvailableStock}
                        >
                            <FiPlusCircle />
                        </button>
                        <span className="text-sm text-base-content/60 ml-2">(คงเหลือ: {item.AvailableStock})</span>
                    </div>
                    <div className="font-bold text-xl text-primary text-right md:text-left">
                        {formatPrice(item.Sale_Price * item.Quantity)}
                    </div>
                </div>
            </div>
            <button
                className="btn btn-ghost btn-circle text-error absolute top-2 right-2"
                onClick={() => onRemove(item.Product_ID, item.Name)}
            >
                <FiTrash2 className="w-5 h-5" />
            </button>
        </div>
    );
};

export default function CartPage() {
    // 2. เรียกใช้ Hook เพื่อดึง State และฟังก์ชันทั้งหมด
    const {
        loading, error, cartItems, addressList, selectedAddress, paymentMethod, totalPrice,
        setSelectedAddress, setPaymentMethod, updateItemQuantity, removeItem, submitOrder
    } = useCart();
    
    const [showAddressModal, setShowAddressModal] = useState(false);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-error p-8">Error: {error}</div>;

    // 3. ส่วน JSX จะใช้ State และเรียกใช้ฟังก์ชันจาก Hook โดยตรง
    return (
        <div className="min-h-screen bg-base-200 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 lg:p-8">
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <FiShoppingCart className="w-8 h-8 text-primary" /> ตะกร้าสินค้าของคุณ
                </h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBox className="w-20 h-20 text-base-content/30 mx-auto mb-4" />
                        <p className="text-xl text-base-content/70">ตะกร้าสินค้าของคุณว่างเปล่า</p>
                        <Link href="/products" className="btn btn-primary mt-6">เลือกซื้อสินค้าเลย</Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Shipping Address Section */}
                        <div className="bg-base-100 p-6 rounded-lg shadow-md border border-base-300">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2"><FiMapPin /> ที่อยู่จัดส่ง</h2>
                                <button className="btn btn-sm btn-ghost text-primary" onClick={() => setShowAddressModal(true)}>
                                    <FiEdit className="mr-1" /> เปลี่ยน
                                </button>
                            </div>
                            {selectedAddress ? (
                                <div className="space-y-1">
                                    <p>{selectedAddress.Address_1} {selectedAddress.Address_2}</p>
                                    <p>{selectedAddress.Sub_District}, {selectedAddress.District}</p>
                                    <p>{selectedAddress.Province}, {selectedAddress.Zip_Code}</p>
                                    <p>โทร: {selectedAddress.Phone}</p>
                                </div>
                            ) : (
                                <div 
                                    className="text-center py-4 border border-dashed rounded-lg cursor-pointer hover:border-primary"
                                    onClick={() => setShowAddressModal(true)}
                                >
                                    <FiPlus className="mx-auto mb-2" />
                                    <p>คลิกเพื่อเลือกหรือเพิ่มที่อยู่</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <CartItem 
                                    key={item.Product_ID} 
                                    item={item} 
                                    onUpdateQuantity={updateItemQuantity} 
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:max-w-lg mx-auto bg-base-100 p-6 rounded-lg shadow-md border border-base-300">
                            <h2 className="text-2xl font-bold mb-4">สรุปคำสั่งซื้อ</h2>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between"><span>ราคารวม ({cartItems.length} ชิ้น):</span><span className="font-bold">{formatPrice(totalPrice)}</span></div>
                                <div className="flex justify-between"><span>ค่าจัดส่ง:</span><span className="font-bold text-success">ฟรี</span></div>
                            </div>
                            <div className="divider my-4"></div>
                            <h3 className="text-xl font-bold mb-4">ช่องทางการชำระเงิน</h3>
                            <div className="form-control mb-6">
                                <label className="label cursor-pointer justify-start gap-3"><input type="radio" name="payment_method" className="radio radio-primary" checked={paymentMethod === 'Bank Transfer'} onChange={() => setPaymentMethod('Bank Transfer')} /><span className="label-text text-lg">โอนเงินผ่านธนาคาร</span></label>
                                <label className="label cursor-pointer justify-start gap-3"><input type="radio" name="payment_method" className="radio radio-primary" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /><span className="label-text text-lg">เก็บเงินปลายทาง (COD)</span></label>
                            </div>
                            <div className="divider my-4"></div>
                            <div className="flex justify-between items-center text-xl font-bold mb-6"><span>ยอดชำระทั้งหมด:</span><span className="text-primary">{formatPrice(totalPrice)}</span></div>
                            <button className="btn btn-primary w-full text-lg" onClick={submitOrder} disabled={!cartItems.length || !selectedAddress}>
                                <FiDollarSign className="mr-2" /> สั่งซื้อสินค้า
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <AddressSelectionModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                addresses={addressList}
                currentSelectedAddress={selectedAddress}
                onSelectAddress={(address) => {
                    setSelectedAddress(address);
                    setShowAddressModal(false);
                }}
            />
        </div>
    );
}