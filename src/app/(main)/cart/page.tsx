'use client';
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { FiMapPin, FiEdit, FiTrash2, FiPlusCircle, FiMinusCircle, FiShoppingCart, FiBox, FiDollarSign, FiPlus } from "react-icons/fi";
import AddressSelectionModal from "./AddressSelectionModal";
import { redirect, useRouter } from "next/navigation";
import { useCounter } from '@/app/context/CartCount';
// import { useAlert } from "@/app/context/AlertModalContext';

// Import types
import { AddressSchema } from '../../../types';
import Link from "next/link";
import { useAlert } from "@/app/context/AlertModalContext"; // Import useAlert hook
import { useSession } from "next-auth/react";
// CustomAlertModal import is removed as it's no longer used directly here

// Define the CartProduct type to match the API response
interface CartProduct {
    Product_ID: number;
    Name: string;
    Brand: string;
    Unit: string;
    Sale_Price: number;
    Image_URL: string | null;
    Quantity: number; // Quantity of this product in the user's cart
    AvailableStock: number; // Available stock of this product
}

// Helper to format price
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(price);
};

export default function CartPage() {
    const { showAlert, } = useAlert(); // Use showAlert and showConfirm from context
    const router = useRouter();
    const { data: session, status } = useSession(); // Get session data
    const { setCounter, decrement } = useCounter();

    const [paymentChoice, setPaymentChoice] = useState(false); // false = Mobile Banking/Bank Transfer, true = COD
    const [cartItems, setCartItems] = useState<CartProduct[]>([]);
    const [addressList, setAddressList] = useState<AddressSchema[]>([]);
    const [curAddress, setCurAddress] = useState<AddressSchema | undefined>(undefined);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    const [showAddressModal, setShowAddressModal] = useState(false);
    // Removed showAlertModal, alertMessage, isConfirmAlert, confirmAction states
    // Removed showCustomAlert function

    // Calculate total price whenever cartItems change
    useEffect(() => {
        const calculateTotalPrice = () => {
            const total = cartItems.reduce((sum, item) => {
                return sum + (item.Quantity * item.Sale_Price);
            }, 0);
            setTotalPrice(total);
        };
        calculateTotalPrice();
    }, [cartItems]);

    // Function to fetch cart items from the API
    const fetchCartItems = useCallback(async () => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        const userId = session?.user?.id; // Use actual userId from session
        if (!userId) {
            showAlert('ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่');
            return;
        }

        console.log(`Fetching cart items for user: ${userId}`);
        try {
            const response = await fetch(`/api/cart?userId=${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            }
            const data = await response.json();
            setCartItems(data.cartItems || []);
            setCounter(data.cartItems ? data.cartItems.length : 0);
            console.log(data)
        } catch (error: any) {
            console.error('Error fetching cart items:', error);
            showAlert(`Failed to retrieve cart items: ${error.message}`); // Use showAlert
        }
    }, [session, status, router, setCounter, showAlert]); // Add session, status, router to dependencies

    // Function to fetch addresses from an API (if available) or mock data
    const fetchAddresses = useCallback(async () => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }

        const userId = session?.user?.id; // Use actual userId from session
        if (!userId) {
            showAlert('ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่');
            return;
        }

        console.log(`Fetching addresses for user: ${userId}`);
        try {
            const response = await fetch(`/api/address`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            }
            const { addresses } = await response.json();
            console.log(addresses)
            setAddressList(addresses || []);
        } catch (error: any) {
            console.error('Error fetching addresses:', error);
            showAlert(`Failed to retrieve addresses: ${error.message}`); // Use showAlert
        }
    }, [session, status, router, showAlert]); // Add session, status, router to dependencies

    // Initial data fetch on component mount
    useEffect(() => {
        fetchCartItems();
        fetchAddresses();
    }, [fetchCartItems, fetchAddresses]);

    // Set default address when addressList changes
    useEffect(() => {
        if (addressList.length > 0) {
            const defaultAddress = addressList.find(address => address.Is_Default);
            setCurAddress(defaultAddress || addressList[0]);
        } else {
            setCurAddress(undefined);
        }
    }, [addressList]);

    function CartItem({ item }: { item: CartProduct }) {
        const [qty, setQty] = useState<number>(item.Quantity);

        // Update local state when item's Quantity prop changes (e.g., after API update)
        useEffect(() => {
            setQty(item.Quantity);
        }, [item.Quantity]);

        async function handleQuantityControl(isAdd: boolean) {
            let newQuantity = isAdd ? qty + 1 : qty - 1;

            if (newQuantity < 1) {
                showAlert('จำนวนสินค้าต้องไม่น้อยกว่า 1 ชิ้น'); // Use showAlert
                newQuantity = 1;
            }
            if (newQuantity > item.AvailableStock) {
                showAlert(`สินค้า ${item.Name} มีในสต็อกเพียง ${item.AvailableStock} ชิ้น`); // Use showAlert
                newQuantity = item.AvailableStock;
            }

            if (newQuantity === qty) return; // No change, no need to call API

            const userId = session?.user?.id; // Use actual userId
            if (!userId) {
                showAlert('ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่');
                return;
            }
            const productId = item.Product_ID;

            try {
                const response = await fetch('/api/cart', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, productId, newQuantity }),
                });
                console.log(session.data.user)

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update quantity');
                }

                setCartItems(oldItems => oldItems.map(cartItem => {
                    if (cartItem.Product_ID === item.Product_ID) {
                        return { ...cartItem, Quantity: newQuantity };
                    }
                    return cartItem;
                }));
            } catch (error: any) {
                console.error('Error updating cart item quantity:', error);
                showAlert(`Error updating quantity: ${error.message}`); // Use showAlert
            }
        }

        async function deleteFromCart() {
            showAlert(`คุณแน่ใจหรือไม่ว่าต้องการนำ ${item.Name} ออกจากตะกร้าสินค้า?`,'info','ยืนยันการลบสินค้า',async () => {
                const userId = session?.user?.id; // Use actual userId
                if (!userId) {
                    showAlert('ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่');
                    return;
                }
                const productId = item.Product_ID;
                console.log(`Deleting Product ${productId} for user ${userId}`);

                try {
                    const response = await fetch('/api/cart', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, productId }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to delete item');
                    }

                    setCartItems(oldItems => oldItems.filter(e => e.Product_ID !== item.Product_ID));
                    decrement();
                    showAlert(`นำ ${item.Name} ออกจากตะกร้าสินค้าแล้ว`); // Use showAlert
                } catch (error: any) {
                    console.error('Error deleting item from cart:', error);
                    showAlert(`ข้อผิดพลาดในการลบสินค้า: ${error.message}`); // Use showAlert
                }
            });
        }

        return (
            <div className="flex items-center bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 relative">
                <img
                    src={item.Image_URL || 'https://placehold.co/100x100/EEEEEE/333333?text=No+Image&format=png'}
                    alt={item.Name}
                    width={100}
                    height={100}
                    className="w-24 h-24 object-contain rounded-md flex-shrink-0 mr-4"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/CCCCCC/666666?text=Image+Error&format=png'; }}
                />
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-center">
                    <div>
                        <h3 className="font-semibold text-lg text-base-content leading-tight mb-1">{item.Name}</h3>
                        <p className="text-sm text-base-content/70">แบรนด์: {item.Brand}</p>
                        <p className="font-bold text-primary mt-1 text-lg">{formatPrice(item.Sale_Price)} / {item.Unit}</p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between text-base-content">
                        <div className="flex items-center gap-2 mb-2 md:mb-0">
                            <button
                                className="btn btn-sm btn-circle btn-outline"
                                onClick={() => handleQuantityControl(false)}
                                disabled={qty <= 1}
                            >
                                <FiMinusCircle className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-xl min-w-[30px] text-center">{qty}</span>
                            <button
                                className="btn btn-sm btn-circle btn-outline"
                                onClick={() => handleQuantityControl(true)}
                                disabled={qty >= item.AvailableStock}
                            >
                                <FiPlusCircle className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-base-content/60 ml-2">(คงเหลือ: {item.AvailableStock})</span>
                        </div>
                        <div className="font-bold text-xl text-primary text-right md:text-left">
                            {formatPrice(item.Sale_Price * qty)}
                        </div>
                    </div>
                </div>
                <button
                    className="btn btn-ghost btn-circle text-error absolute top-2 right-2 md:relative md:top-auto md:right-auto"
                    onClick={deleteFromCart}
                >
                    <FiTrash2 className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // --- Order Submission ---
    async function submitOrder() {
        if (status === 'loading') {
            showAlert('กำลังโหลดข้อมูลผู้ใช้ โปรดรอสักครู่');
            return;
        }
        if (status === 'unauthenticated') {
            showAlert('คุณต้องเข้าสู่ระบบเพื่อทำการสั่งซื้อ', 'error');
            router.push('/login');
            return;
        }

        if (!cartItems.length) {
            showAlert('ตะกร้าสินค้าของคุณว่างเปล่า ไม่สามารถสั่งซื้อได้');
            return;
        }
        if (!curAddress) {
            showAlert('กรุณาเลือกที่อยู่จัดส่ง');
            return;
        }

        const userId = session?.user?.id; // Use actual userId from session
        if (!userId) {
            showAlert('ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่');
            return;
        }

        showAlert('คุณแน่ใจหรือไม่ว่าต้องการยืนยันคำสั่งซื้อนี้?','info','ยืนยันการสั่งซื้อ', async () => {
            const payload = {
                addressId: curAddress.Address_ID,
                paymentMethod: paymentChoice ? 'Cash on Delivery' : 'Bank Transfer', // Convert boolean to string enum
                cartItems: cartItems.map(item => ({
                    Product_ID: item.Product_ID,
                    CartQuantity: item.Quantity
                })),
                totalPrice: totalPrice // *** ADDED totalPrice TO PAYLOAD ***
            };

            console.log('Submitting order payload:', payload);

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to place order.');
                }

                setCartItems([]);
                setCounter(0);
                showAlert('สั่งซื้อสำเร็จ! กำลังนำทางไปยังประวัติคำสั่งซื้อ','success','คำสั่งซื้อสำเร็จ',() => {
                    router.push('/orders-history'); // Changed from /order-history to /orders-history
                });

            } catch (error: any) {
                console.error('Error submitting order:', error);
                showAlert(`เกิดข้อผิดพลาดขณะทำการสั่งซื้อ: ${error.message}`); // Use showAlert
            }
        });
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-base-content mb-6 flex items-center gap-3">
                    <FiShoppingCart className="w-8 h-8 text-primary" /> ตะกร้าสินค้าของคุณ
                </h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBox className="w-20 h-20 text-base-content/30 mx-auto mb-4" />
                        <p className="text-xl text-base-content/70">ตะกร้าสินค้าของคุณว่างเปล่า</p>
                        <Link href="/products" className="btn btn-primary mt-6">
                            เลือกซื้อสินค้าเลย
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Shipping Address Section */}
                        <div className="bg-base-100 p-6 rounded-lg shadow-md border border-base-300">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                                    <FiMapPin className="w-6 h-6 text-primary" /> ที่อยู่จัดส่ง
                                </h2>
                                <button
                                    className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
                                    onClick={() => setShowAddressModal(true)}
                                >
                                    <FiEdit className="w-4 h-4 mr-1" /> เปลี่ยน
                                </button>
                            </div>

                            {curAddress ? (
                                <div className="space-y-1 text-base-content/90">
                                    <p className="font-semibold">
                                        {curAddress.Address_1} {curAddress.Address_2}
                                    </p>
                                    <p>
                                        {curAddress.Sub_District}, {curAddress.District}
                                    </p>
                                    <p>
                                        {curAddress.Province}, {curAddress.Zip_Code}
                                    </p>
                                    <p>โทร: {curAddress.Phone}</p>
                                </div>
                            ) : (
                                <div className="text-center py-4 border border-dashed rounded-lg border-base-content/30 text-base-content/70 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                                     onClick={() => setShowAddressModal(true)}>
                                    <FiPlus className="w-6 h-6 mx-auto mb-2" />
                                    <p>ยังไม่มีที่อยู่จัดส่งใช่หรือไม่? คลิกเพื่อเลือกหรือเพิ่มที่อยู่</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                                <FiShoppingCart className="w-6 h-6 text-primary" /> รายการสินค้าของคุณ
                            </h2>
                            {cartItems.map(item => (
                                <CartItem item={item} key={item.Product_ID} />
                            ))}
                        </div>

                        {/* Order Summary (Now at the bottom) */}
                        <div className="w-full lg:max-w-lg mx-auto bg-base-100 p-6 rounded-lg shadow-md border border-base-300 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-base-content mb-4">สรุปคำสั่งซื้อ</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-base text-base-content/90">
                                    <span>ราคารวม ({cartItems.length} ชิ้น):</span>
                                    <span className="font-bold">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center text-base text-base-content/90">
                                    <span>ค่าจัดส่ง:</span>
                                    <span className="font-bold text-success">ฟรี</span>
                                </div>
                            </div>

                            <div className="divider my-4"></div>

                            <h3 className="text-xl font-bold text-base-content mb-4">ช่องทางการชำระเงิน</h3>
                            <div className="form-control mb-6">
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        className="radio radio-primary"
                                        checked={!paymentChoice}
                                        onChange={() => setPaymentChoice(false)}
                                    />
                                    <span className="label-text text-base-content text-lg">โมบายแบงค์กิ้ง / โอนเงินผ่านธนาคาร</span>
                                </label>
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        className="radio radio-primary"
                                        checked={paymentChoice}
                                        onChange={() => setPaymentChoice(true)}
                                    />
                                    <span className="label-text text-base-content text-lg">เก็บเงินปลายทาง (COD)</span>
                                </label>
                            </div>

                            <div className="divider my-4"></div>

                            <div className="flex justify-between items-center text-xl font-bold text-base-content mb-6">
                                <span>ยอดชำระทั้งหมด:</span>
                                <span className="text-primary">{formatPrice(totalPrice)}</span>
                            </div>

                            <button
                                className="btn btn-primary w-full text-lg py-3 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                                onClick={submitOrder}
                                disabled={!cartItems.length || !curAddress}
                            >
                                <FiDollarSign className="w-6 h-6 mr-2" /> สั่งซื้อสินค้า
                            </button>
                            <Link href="/products" className="btn btn-ghost w-full mt-3">
                                เลือกซื้อสินค้าต่อ
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Address Selection Modal */}
            <AddressSelectionModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                addresses={addressList}
                currentSelectedAddress={curAddress}
                onSelectAddress={(address) => setCurAddress(address)}
            />

            {/* No CustomAlertModal component here, it's handled by AlertModalProvider */}
        </div>
    );
}