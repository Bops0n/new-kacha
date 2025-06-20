'use client';
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiMapPin, FiEdit, FiTrash2, FiPlusCircle, FiMinusCircle, FiShoppingCart, FiBox, FiDollarSign, FiPlus } from "react-icons/fi";
import AddressSelectionModal from "./AddressSelectionModal";
import { useRouter } from "next/navigation";
import { useCounter } from '../../context/CartCount'; // Re-import useCounter

// Import types
import { CartProduct, AddressSchema, CartDetailSchema, ProductInventory } from '../../../types';
import Link from "next/link";

// --- Custom Alert/Confirm Modal (Placeholder) ---
interface CustomAlertModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    isConfirm?: boolean;
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ isOpen, message, onClose, onConfirm, isConfirm = false }) => {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="modal-box w-full max-w-sm bg-base-100 rounded-lg shadow-xl p-6 text-center">
                <h3 className="font-bold text-lg text-base-content mb-4">{isConfirm ? 'Confirm' : 'Alert'}</h3>
                <p className="text-base-content/80 mb-6">{message}</p>
                <div className="modal-action justify-center gap-4">
                    {isConfirm && (
                        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    )}
                    <button className={`btn ${isConfirm ? 'btn-primary' : 'btn-success'}`} onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                    }}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- End Custom Alert/Confirm Modal ---


// --- Mock Product Inventory ---
const mockProducts: ProductInventory[] = [
  { Product_ID: 1, Child_ID: 1001, Name: 'Samsung Galaxy S23', Brand: 'Samsung', Description: 'Latest Android flagship phone', Unit: 'Pcs', Quantity: 50, Sale_Cost: 25000, Sale_Price: 22500, Reorder_Point: 10, Visibility: true, Review_Rating: 4.5, Image_URL: 'https://placehold.co/100x100/FFDAB9/000000?text=S23&format=png' },
  { Product_ID: 2, Child_ID: 1003, Name: 'Acer Predator Helios 300', Brand: 'Acer', Description: 'High-performance gaming laptop', Unit: 'Pcs', Quantity: 15, Sale_Cost: 42000, Sale_Price: 42000, Reorder_Point: 5, Visibility: true, Review_Rating: 4, Image_URL: 'https://placehold.co/100x100/B0E0E6/000000?text=Helios300&format=png' },
  { Product_ID: 3, Child_ID: 3001, Name: 'Modern Fabric Sofa', Brand: 'IKEA', Description: 'Comfortable 3-seater sofa for living room', Unit: 'Pcs', Quantity: 5, Sale_Cost: 15000, Sale_Price: 12000, Reorder_Point: 2, Visibility: true, Review_Rating: 3.8, Image_URL: 'https://placehold.co/100x100/D8BFD8/000000?text=Sofa&format=png' },
  { Product_ID: 4, Child_ID: 2001, Name: 'Philips Blender HR2118', Brand: 'Philips', Description: 'Powerful blender for smoothies and more', Unit: 'Pcs', Quantity: 30, Sale_Cost: 2500, Sale_Price: 2200, Reorder_Point: 10, Visibility: true, Review_Rating: 4.2, Image_URL: 'https://placehold.co/100x100/FFD700/000000?text=Blender&format=png' },
  { Product_ID: 5, Child_ID: 3004, Name: 'Wooden Wardrobe', Brand: 'HomePro', Description: 'Spacious wardrobe with sliding doors', Unit: 'Pcs', Quantity: 7, Sale_Cost: 15000, Sale_Price: 15000, Reorder_Point: 3, Visibility: true, Review_Rating: 5, Image_URL: 'https://placehold.co/100x100/A2DAA2/000000?text=Wardrobe&format=png' },
];

// Mock Cart Details (using string Product_ID to match original cart_detail type)
const mockCartDetails: CartDetailSchema[] = [
  { User_ID: 101, Product_ID: '1', Quantity: 2 },
  { User_ID: 101, Product_ID: '3', Quantity: 1 },
  { User_ID: 101, Product_ID: '4', Quantity: 3 },
];

// Mock Addresses
const mockAddresses: AddressSchema[] = [
    {
      Address_ID: 1, User_ID: 101, Address_1: '123 Sukhumvit Soi 55', Address_2: 'KachaHome Building, 10th Floor',
      Sub_District: 'Khlong Tan Nuea', District: 'Watthana', Province: 'Bangkok', Zip_Code: '10110',
      Is_Default: true, Phone: '0987654321',
    },
    {
      Address_ID: 2, User_ID: 101, Address_1: '456 Phaholyothin Road', Address_2: 'ABC Building',
      Sub_District: 'Sam Sen Nai', District: 'Phaya Thai', Province: 'Bangkok', Zip_Code: '10400',
      Is_Default: false, Phone: '0612345678',
    },
];


// Helper to format price
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(price);
};

export default function CartPage() {
    const router = useRouter();
    const mockUserId = 101;
    const { setCounter, decrement } = useCounter(); // Use useCounter hook

    const [paymentChoice, setPaymentChoice] = useState(false);
    const [cartItems, setCartItems] = useState<CartProduct[]>([]);
    const [addressList, setAddressList] = useState<AddressSchema[]>([]);
    const [curAddress, setCurAddress] = useState<AddressSchema | undefined>(undefined);
    const [totalPrice, setTotalPrice] = useState<number>(0);

    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isConfirmAlert, setIsConfirmAlert] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    const showCustomAlert = (message: string, isConfirm: boolean = false, onConfirm: (() => void) | null = null) => {
        setAlertMessage(message);
        setIsConfirmAlert(isConfirm);
        setConfirmAction(() => onConfirm);
        setShowAlertModal(true);
    };


    useEffect(() => {
        const calculateTotalPrice = () => {
            const total = cartItems.reduce((sum, item) => {
                return sum + (item.cd_Quantity * item.Sale_Price);
            }, 0);
            setTotalPrice(total);
        };
        calculateTotalPrice();
    }, [cartItems]);

    useEffect(() => {
        const userId = mockUserId;

        async function fetchCartItems() {
            console.log(`Fetching cart items for user: ${userId}`);
            try {
                const userCartDetails = mockCartDetails.filter(item => item.User_ID === userId);
                const combinedCartItems: CartProduct[] = userCartDetails.map(cartDetail => {
                    const product = mockProducts.find(p => String(p.Product_ID) === cartDetail.Product_ID);
                    if (product) {
                        return {
                            ...product,
                            Product_ID: String(product.Product_ID),
                            cd_Quantity: cartDetail.Quantity,
                            Quantity: product.Quantity
                        } as CartProduct;
                    }
                    return null;
                }).filter(item => item !== null) as CartProduct[];
                setCartItems(combinedCartItems);
                setCounter(combinedCartItems.length); // Update global counter with actual cart length
            } catch (error) {
                console.error('Error fetching cart items:', error);
                showCustomAlert('Failed to retrieve cart items.', false);
            }
        }

        async function fetchAddresses() {
            console.log(`Fetching addresses for user: ${userId}`);
            try {
                setAddressList(mockAddresses.filter(addr => addr.User_ID === userId));
            } catch (error) {
                console.error('Error fetching addresses:', error);
                showCustomAlert('Failed to retrieve addresses.', false);
            }
        }

        fetchCartItems();
        fetchAddresses();
    }, [setCounter]); // Add setCounter to dependencies to avoid lint warnings

    useEffect(() => {
        if (addressList.length > 0) {
            const defaultAddress = addressList.find(address => address.Is_Default);
            setCurAddress(defaultAddress || addressList[0]);
        } else {
            setCurAddress(undefined);
        }
    }, [addressList]);

    function CartItem({ item }: { item: CartProduct }) {
        const [qty, setQty] = useState<number>(item.cd_Quantity);

        useEffect(() => {
            setQty(item.cd_Quantity);
        }, [item.cd_Quantity]);

        function handleQuantityControl(isAdd: boolean) {
            let newQuantity = isAdd ? qty + 1 : qty - 1;

            if (newQuantity < 1) {
                showCustomAlert('Quantity must be at least 1 item.', false);
                newQuantity = 1;
            }
            if (newQuantity > item.Quantity) {
                showCustomAlert(`Only ${item.Quantity} items of ${item.Name} are in stock.`, false);
                newQuantity = item.Quantity;
            }

            setCartItems(oldItems => oldItems.map(cartItem => {
                if (cartItem.Product_ID === item.Product_ID) {
                    const updatedItem = { ...cartItem, cd_Quantity: newQuantity };
                    // Update global counter based on the change for THIS item only
                    // This is for visual update on the current item. The global cart count
                    // will be updated when items are truly added/removed.
                    return updatedItem;
                }
                return cartItem;
            }));
        }

        async function deleteFromCart() {
            showCustomAlert(`Are you sure you want to remove ${item.Name} from cart?`, true, async () => {
                const userId = mockUserId;
                console.log(`Deleting Product ${item.Product_ID} for user ${userId}`);
                try {
                    await new Promise(resolve => setTimeout(resolve, 300));

                    setCartItems(oldItems => oldItems.filter(e => e.Product_ID !== item.Product_ID));
                    decrement(); // Decrement global counter
                    showCustomAlert(`Removed ${item.Name} from cart.`, false);
                } catch (error) {
                    console.error('Error deleting item from cart:', error);
                    showCustomAlert('Error deleting item from cart.', false);
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
                        <p className="text-sm text-base-content/70">Brand: {item.Brand}</p>
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
                                disabled={qty >= item.Quantity}
                            >
                                <FiPlusCircle className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-base-content/60 ml-2">(Remaining: {item.Quantity})</span>
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
        if (!cartItems.length) {
            showCustomAlert('Your cart is empty. Cannot place order.', false);
            return;
        }
        if (!curAddress) {
            showCustomAlert('Please select a shipping address.', false);
            return;
        }

        showCustomAlert('Are you sure you want to place this order?', true, async () => {
            const userId = mockUserId;

            console.log('Submitting order:', {
                items: cartItems,
                User_ID: userId,
                Address_ID: curAddress?.Address_ID,
                COD: paymentChoice
            });

            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                setCartItems([]);
                setCounter(0); // Reset global counter when cart is cleared after order
                showCustomAlert('Order placed successfully! Redirecting to order history.', false, () => {
                    router.push('/order-history');
                });

            } catch (error) {
                console.error('Error submitting order:', error);
                showCustomAlert('An error occurred while placing the order.', false);
            }
        });
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-base-content mb-6 flex items-center gap-3">
                    <FiShoppingCart className="w-8 h-8 text-primary" /> Your Shopping Cart
                </h1>

                {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                        <FiBox className="w-20 h-20 text-base-content/30 mx-auto mb-4" />
                        <p className="text-xl text-base-content/70">Your cart is empty.</p>
                        <Link href="/products" className="btn btn-primary mt-6">
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Shipping Address Section */}
                        <div className="bg-base-100 p-6 rounded-lg shadow-md border border-base-300">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                                    <FiMapPin className="w-6 h-6 text-primary" /> Shipping Address
                                </h2>
                                <button
                                    className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
                                    onClick={() => setShowAddressModal(true)}
                                >
                                    <FiEdit className="w-4 h-4 mr-1" /> Change
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
                                    <p>Tel: {curAddress.Phone}</p>
                                </div>
                            ) : (
                                <div className="text-center py-4 border border-dashed rounded-lg border-base-content/30 text-base-content/70 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                                     onClick={() => setShowAddressModal(true)}>
                                    <FiPlus className="w-6 h-6 mx-auto mb-2" />
                                    <p>No shipping address yet? Click to select or add address.</p>
                                </div>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-base-content mb-4 flex items-center gap-2">
                                <FiShoppingCart className="w-6 h-6 text-primary" /> Your Items
                            </h2>
                            {cartItems.map(item => (
                                <CartItem item={item} key={item.Product_ID} />
                            ))}
                        </div>

                        {/* Order Summary (Now at the bottom) */}
                        <div className="w-full lg:max-w-lg mx-auto bg-base-100 p-6 rounded-lg shadow-md border border-base-300 flex-shrink-0">
                            <h2 className="text-2xl font-bold text-base-content mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-base text-base-content/90">
                                    <span>Subtotal ({cartItems.length} items):</span>
                                    <span className="font-bold">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center text-base text-base-content/90">
                                    <span>Shipping:</span>
                                    <span className="font-bold text-success">Free</span>
                                </div>
                            </div>

                            <div className="divider my-4"></div>

                            <h3 className="text-xl font-bold text-base-content mb-4">Payment Method</h3>
                            <div className="form-control mb-6">
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        className="radio radio-primary"
                                        checked={!paymentChoice}
                                        onChange={() => setPaymentChoice(false)}
                                    />
                                    <span className="label-text text-base-content text-lg">Mobile Banking / Bank Transfer</span>
                                </label>
                                <label className="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="radio"
                                        name="payment_method"
                                        className="radio radio-primary"
                                        checked={paymentChoice}
                                        onChange={() => setPaymentChoice(true)}
                                    />
                                    <span className="label-text text-base-content text-lg">Cash on Delivery (COD)</span>
                                </label>
                            </div>

                            <div className="divider my-4"></div>

                            <div className="flex justify-between items-center text-xl font-bold text-base-content mb-6">
                                <span>Total Payment:</span>
                                <span className="text-primary">{formatPrice(totalPrice)}</span>
                            </div>

                            <button
                                className="btn btn-primary w-full text-lg py-3 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                                onClick={submitOrder}
                                disabled={!cartItems.length || !curAddress}
                            >
                                <FiDollarSign className="w-6 h-6 mr-2" /> Place Order
                            </button>
                            <Link href="/products" className="btn btn-ghost w-full mt-3">
                                Continue Shopping
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

            {/* Custom Alert/Confirm Modal */}
            <CustomAlertModal
                isOpen={showAlertModal}
                message={alertMessage}
                onClose={() => setShowAlertModal(false)}
                onConfirm={confirmAction || undefined}
                isConfirm={isConfirmAlert}
            />
        </div>
    );
}
