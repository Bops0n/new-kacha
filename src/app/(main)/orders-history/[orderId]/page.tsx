// src/app/orders/[orderId]/page.tsx
'use client'; // This is a Client Component

import React, { useState, useEffect } from 'react';
import { FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiArrowLeft, FiMapPin, FiShoppingCart } from 'react-icons/fi';
import { Order, OrderStatus } from '../../../../types'; // Adjust path as needed
import { useRouter, useParams } from 'next/navigation'; // Import useParams

// Define StatusConfig here for local use within the page
export const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; } } = {
  pending: { label: 'รอดำเนินการ', color: 'text-yellow-600', icon: FiClock, bgColor: 'bg-yellow-100' },
  processing: { label: 'กำลังจัดเตรียม', color: 'text-blue-600', icon: FiPackage, bgColor: 'bg-blue-100' },
  shipped: { label: 'จัดส่งแล้ว', color: 'text-indigo-600', icon: FiTruck, bgColor: 'bg-indigo-100' },
  delivered: { label: 'จัดส่งสำเร็จ', color: 'text-green-600', icon: FiCheckCircle, bgColor: 'bg-green-100' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', icon: FiXCircle, bgColor: 'bg-red-100' },
};

// Helper to format price
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
    }).format(price);
};


const OrderDetailsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams(); // Use useParams hook
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updatingSlip, setUpdatingSlip] = useState<boolean>(false);
  const [updateSlipError, setUpdateSlipError] = useState<string | null>(null);

  // Access orderId from useParams result
  
  const orderId = typeof params.orderId === 'string' ? parseInt(params.orderId) : NaN;


  useEffect(() => {
    console.log(params)
    const fetchOrderDetails = async () => {
      if (isNaN(orderId)) {
        setError('Order ID ไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      try {
        // This is a placeholder. You need a real API endpoint to fetch a single order.
        // This mock data structure should mirror Order from types.ts
        const mockOrders: Order[] = [
          {
            Order_ID: 1001,
            User_ID: 1,
            Order_Date: '2023-01-15T10:30:00Z',
            Total_Amount: 1250.00,
            Status: 'pending',
            Shipping_Address_ID: 1,
            Payment_Type: 'Bank Transfer',
            Tracking_ID: null,
            Shipping_Carrier: null,
            Cancellation_Reason: null,
            Transfer_Slip_Image_URL: null, // No slip yet
            DeliveryDate: null,
            Invoice_ID: 'INV-001-2023-1001',
            Address: '25/11 ถนนรัชดาภิเษก\nห้วยขวาง, ห้วยขวาง\nกรุงเทพมหานคร, 10310',
            Phone: '0887776666',
            Products: [
              { Product_ID: 1, Product_Name: 'ปูนซีเมนต์ปอร์ตแลนด์ ตราช้าง', Product_Brand: 'ตราช้าง', Product_Unit: 'ถุง', Quantity: 6, Price: 690.00, Discount: 0, Subtotal: 4140.00, Product_Image_URL: 'https://placehold.co/100x100/A0A0A0/FFFFFF?text=Cement' },
              { Product_ID: 2, Product_Name: 'สว่านไฟฟ้าไร้สาย Bosch GSB 18V-50', Product_Brand: 'Bosch', Product_Unit: 'เครื่อง', Quantity: 1, Price: 4200.00, Discount: 0, Subtotal: 4200.00, Product_Image_URL: 'https://placehold.co/100x100/D0D0D0/000000?text=Drill' },
              { Product_ID: 3, Product_Name: 'สายไฟ VAF 2x2.5 sq.mm (100m)', Product_Brand: 'Thai Yazaki', Product_Unit: 'ม้วน', Quantity: 10, Price: 1150.00, Discount: 0, Subtotal: 11500.00, Product_Image_URL: 'https://placehold.co/100x100/E0E0E0/000000?text=Wire' },
            ],
          },
          {
            Order_ID: 1002,
            User_ID: 1,
            Order_Date: '2023-01-16T14:00:00Z',
            Total_Amount: 500.00,
            Status: 'processing',
            Shipping_Address_ID: 1,
            Payment_Type: 'Cash on Delivery',
            Tracking_ID: null,
            Shipping_Carrier: null,
            Cancellation_Reason: null,
            Transfer_Slip_Image_URL: null,
            DeliveryDate: null,
            Invoice_ID: 'INV-001-2023-1002',
            Address: '123 ถนนสุขุมวิท, แขวงคลองเตย, เขตวัฒนา, กรุงเทพฯ 10110',
            Phone: '0812345678',
            Products: [
              { Product_ID: 3, Product_Name: 'บะหมี่กึ่งสำเร็จรูป', Product_Brand: 'มาม่า', Product_Unit: 'ห่อ', Quantity: 10, Price: 6.00, Discount: 0, Subtotal: 60.00, Product_Image_URL: '/product_images/noodle.jpg' },
            ],
          },
          {
            Order_ID: 1003,
            User_ID: 1,
            Order_Date: '2023-01-17T09:15:00Z',
            Total_Amount: 750.00,
            Status: 'shipped',
            Shipping_Address_ID: 2,
            Payment_Type: 'Bank Transfer',
            Tracking_ID: 'TH123456789',
            Shipping_Carrier: 'Flash Express',
            Cancellation_Reason: null,
            Transfer_Slip_Image_URL: '/slips/mock_slip_1003.jpg', // Existing slip
            DeliveryDate: '2023-01-20T00:00:00Z',
            Invoice_ID: 'INV-001-2023-1003',
            Address: '456 ถนนพหลโยธิน, แขวงสามเสนใน, เขตพญาไท, กรุงเทพฯ 10400',
            Phone: '0987654321',
            Products: [
              { Product_ID: 4, Product_Name: 'นมสด 1 ลิตร', Product_Brand: 'โฟร์โมสต์', Product_Unit: 'กล่อง', Quantity: 5, Price: 50.00, Discount: 0, Subtotal: 250.00, Product_Image_URL: '/product_images/milk.jpg' },
            ],
          },
          {
            Order_ID: 1004,
            User_ID: 1,
            Order_Date: '2023-01-18T11:45:00Z',
            Total_Amount: 300.00,
            Status: 'cancelled',
            Shipping_Address_ID: 1,
            Payment_Type: 'Bank Transfer',
            Tracking_ID: null,
            Shipping_Carrier: null,
            Cancellation_Reason: 'สินค้าหมด',
            Transfer_Slip_Image_URL: '/slips/mock_slip_1004.jpg',
            DeliveryDate: null,
            Invoice_ID: 'INV-001-2023-1004',
            Address: '123 ถนนสุขุมวิท, แขวงคลองเตย, เขตวัฒนา, กรุงเทพฯ 10110',
            Phone: '0812345678',
            Products: [
              { Product_ID: 5, Product_Name: 'ขนมปัง', Product_Brand: 'ฟาร์มเฮ้าส์', Product_Unit: 'แถว', Quantity: 1, Price: 30.00, Discount: 0, Subtotal: 30.00, Product_Image_URL: '/product_images/bread.jpg' },
            ],
          },
        ];
        console.log('test')
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
        }
      );
      const { order } = await response.json()

        // Simulate API call delay
        // await new Promise(resolve => setTimeout(resolve, 500));
        // const foundOrder = mockOrders.find(o => o.Order_ID === orderId);

        if (response.ok) {
          setOrder(order);
          console.log(order)
        } else {
          setError('ไม่พบคำสั่งซื้อ');
        }

        // In a real application, you would fetch from your API:
        // const response = await fetch(`/api/orders/${orderId}`); // Fetch specific order
        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.message || 'Failed to fetch order details');
        // }
        // const data = await response.json();
        // setOrder(data.order);
      } catch (err: any) {
        console.log(err)
        setError(err.message+'d');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files?.[0] || null);
    }
  };

  const handleUploadSlip = async () => {
    if (order && selectedFile) {
      setUpdatingSlip(true);
      setUpdateSlipError(null);
      try {
        const formData = new FormData();
        formData.append('transferSlip', selectedFile);

        // In a real application, you would send this to your API:
        const response = await fetch(`/api/orders/${order.Order_ID}`, {
          method: 'PATCH',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update transfer slip');
        }

        const data = await response.json();
        // Update the order in the state with the new image URL returned from API
        setOrder(prevOrder => prevOrder ? { ...prevOrder, Transfer_Slip_Image_URL: data.imageUrl } : null);
        setSelectedFile(null); // Clear selected file on successful upload
        setUpdateSlipError(null); // Clear any previous errors
        alert('อัปโหลดสลิปสำเร็จ!'); // Consider using your custom alert here

      } catch (err: any) {
        setUpdateSlipError(err.message || 'An unexpected error occurred while updating the slip');
      } finally {
        setUpdatingSlip(false);
      }
    } else {
      alert('กรุณาเลือกไฟล์สลิป'); // Consider using your custom alert here
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-xl">กำลังโหลดรายละเอียดคำสั่งซื้อ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h1>
        <p>ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้: {error}</p>
        <button onClick={() => router.back()} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <FiArrowLeft className="mr-2" /> กลับ
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 text-gray-700">
        <p className="text-center text-xl">ไม่พบข้อมูลคำสั่งซื้อสำหรับ Order ID: {params.orderId as string}</p>
        <button onClick={() => router.back()} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <FiArrowLeft className="mr-2" /> กลับ
        </button>
      </div>
    );
  }

  // Ensure order.Status is a valid key for statusConfig
  const currentOrderStatus = order.Status as OrderStatus;
  const statusInfo = statusConfig[currentOrderStatus];

  const canUploadSlip = order.Payment_Type === 'Bank Transfer' && order.Status === 'pending';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-8">
        {/* Back button and Page Title */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <button onClick={() => router.back()} className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <FiArrowLeft className="mr-2" size={24} />
            <span className="text-lg font-medium">กลับไปรายการคำสั่งซื้อ</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">รายละเอียดคำสั่งซื้อ #{order.Order_ID}</h1>
        </div>

        {/* Order Info (Date, Status, Invoice) */}
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex flex-wrap items-center justify-around gap-y-2 mb-6 shadow-sm text-sm sm:text-base">
            <p><strong>วันที่สั่ง:</strong> {new Date(order.Order_Date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo?.bgColor} ${statusInfo?.color} flex items-center`}>
              {statusInfo?.icon && React.createElement(statusInfo.icon, { className: 'mr-1' })}
              {statusInfo?.label || order.Status}
            </span>
            {order.Invoice_ID && <p><strong>เลขที่ใบแจ้งหนี้:</strong> {order.Invoice_ID}</p>}
        </div>

        {/* Shipping Address Section - Top Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FiMapPin className="w-6 h-6 text-blue-600" /> ที่อยู่จัดส่ง
                </h2>
                {/* Edit button for address if implemented later */}
                {/* <button className="btn btn-sm btn-ghost text-blue-600 hover:bg-blue-100">
                    <FiEdit className="w-4 h-4 mr-1" /> แก้ไข
                </button> */}
            </div>
            <div className="space-y-1 text-gray-700 text-base">
                {order.Address.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
                <p>โทร: {order.Phone}</p>
            </div>
        </div>

        {/* Order Items Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiShoppingCart className="w-6 h-6 text-blue-600" /> รายการสินค้าของคุณ
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {order.Products.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">ไม่พบสินค้าในคำสั่งซื้อนี้</p>
              ) : (
                  order.Products.map((product, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                          {product.Product_Image_URL && (
                              <img
                                  src={product.Product_Image_URL}
                                  alt={product.Product_Name}
                                  className="w-20 h-20 object-cover rounded-md flex-shrink-0 border border-gray-200"
                              />
                          )}
                          <div className="flex-grow">
                              <p className="font-semibold text-gray-800 text-base mb-1">{product.Product_Name} {product.Product_Brand ? `(${product.Product_Brand})` : ''}</p>
                              <p className="text-sm text-gray-600">
                                  {formatPrice(product.Price)} / {product.Product_Unit}
                                  {product.Discount > 0 && <span className="text-red-500 ml-2"> (ลด {formatPrice(product.Discount)})</span>}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">จำนวน: {product.Quantity} {product.Product_Unit}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                              <p className="font-bold text-lg text-blue-600">รวม: {formatPrice(product.Subtotal)}</p>
                          </div>
                      </div>
                  ))
              )}
            </div>
        </div>

        {/* Order Summary & Payment */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">สรุปยอดคำสั่งซื้อ</h2>

            <div className="space-y-3 mb-6 text-gray-700">
                <div className="flex justify-between items-center text-base">
                    <span>ยอดรวมสินค้า:</span>
                    <span className="font-semibold">{formatPrice(order.Total_Amount)}</span>
                </div>
                <div className="flex justify-between items-center text-base">
                    <span>ค่าจัดส่ง:</span>
                    <span className="font-semibold">{formatPrice(0)}</span> {/* Assuming free shipping for now */}
                </div>
                <div className="flex justify-between items-center text-base">
                    <span>ส่วนลด:</span>
                    <span className="font-semibold">{formatPrice(0)}</span> {/* Add actual discount logic if needed */}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                    <span>ยอดรวมทั้งสิ้น:</span>
                    <span className="text-blue-600">{formatPrice(order.Total_Amount)}</span>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">ช่องทางการชำระเงิน: <span className="font-normal text-gray-600">{order.Payment_Type}</span></h3>

                {order.Payment_Type === 'Bank Transfer' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">หลักฐานการโอนเงิน</h4>
                        {order.Transfer_Slip_Image_URL ? (
                            <div className="mb-4 text-center">
                                <img
                                    src={order.Transfer_Slip_Image_URL}
                                    alt="Transfer Slip"
                                    className="max-w-xs h-auto rounded-md shadow-sm border border-gray-200 mx-auto"
                                />
                                <p className="text-sm text-gray-500 mt-2">สลิปปัจจุบัน</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-4 text-center">ยังไม่มีสลิปการโอนเงินสำหรับคำสั่งซื้อนี้</p>
                        )}

                        {canUploadSlip ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                                <label htmlFor={`slip-upload-${order.Order_ID}`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md cursor-pointer transition duration-300 text-sm">
                                  {selectedFile ? `ไฟล์ที่เลือก: ${selectedFile.name}` : 'อัปโหลด / เปลี่ยนสลิป'}
                                  <input
                                    id={`slip-upload-${order.Order_ID}`}
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleFileChange}
                                  />
                                </label>
                                <button
                                  onClick={handleUploadSlip}
                                  disabled={!selectedFile || updatingSlip}
                                  className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm ${!selectedFile || updatingSlip ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {updatingSlip ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                                </button>
                                {updateSlipError && <p className="text-red-500 mt-2 text-sm text-center w-full">{updateSlipError}</p>}
                            </div>
                        ) : (
                            <p className="text-gray-600 mt-2 text-sm text-center">
                                ไม่สามารถอัปโหลด/เปลี่ยนสลิปได้เนื่องจากคำสั่งซื้อไม่อยู่ในสถานะ &quot;รอดำเนินการ&quot;
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>

      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default OrderDetailsPage;
