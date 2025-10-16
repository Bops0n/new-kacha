'use client';

 import React, { useState } from 'react';
 import { OrderAPIResponse, OrderStatus } from '../../../types/types'; // Adjust path as needed
 import { FiX, FiClock, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

 // Define StatusConfig here for local use within the modal, or import from a shared utility if preferred.
 // It's important that this matches the definition in your orders/page.tsx
 export const statusConfig: { [key in OrderStatus]: { label: string; color: string; icon: React.ElementType; bgColor: string; } } = {
    pending: { label: 'รอดำเนินการ', color: 'badge-warning', icon: FiClock, bgColor: 'bg-warning/10' },
    processing: { label: 'กำลังเตรียม', color: 'badge-info', icon: FiPackage, bgColor: 'bg-info/10' },
    shipped: { label: 'จัดส่งแล้ว', color: 'badge-primary', icon: FiTruck, bgColor: 'bg-primary/10' },
    delivered: { label: 'ส่งเรียบร้อย', color: 'badge-success', icon: FiCheckCircle, bgColor: 'bg-success/10' },
    refunding: { label: 'ยกเลิก: กำลังรอคืนเงิน', color: 'badge-accent', icon: FiRefreshCw, bgColor: 'bg-accent/10' },
    refunded: { label: 'ยกเลิก: คืนเงินสำเร็จ', color: 'badge-neutral', icon: FiCheckCircle, bgColor: 'bg-neutral/10' },
    cancelled: { label: 'ยกเลิก', color: 'badge-error', icon: FiXCircle, bgColor: 'bg-error/10' },
 };

 interface OrderDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   order: OrderAPIResponse | null;
   onUpdateTransferSlip: (orderId: number, file: File) => Promise<boolean>;
   updatingSlip: boolean;
   updateSlipError: string | null;
 }

 const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
   isOpen,
   onClose,
   order,
   onUpdateTransferSlip,
   updatingSlip,
   updateSlipError,
 }) => {
   const [selectedFile, setSelectedFile] = useState<File | null>(null);

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (event.target.files && event.target.files.length > 0) {
       setSelectedFile(event.target.files?.[0] || null);
     }
   };

   const handleUploadSlip = async () => {
     if (order && selectedFile) {
       await onUpdateTransferSlip(order.Order_ID, selectedFile);
       // Do NOT clear selectedFile immediately if update failed.
       // It will be cleared when modal closes or on successful update.
     } else {
       alert('กรุณาเลือกไฟล์สลิป'); // Consider using your custom alert here
     }
   };

   if (!isOpen || !order) {
     return null;
   }

   // Ensure order.Status is a valid key for statusConfig
   const currentOrderStatus = order.Status as OrderStatus;
   const statusInfo = statusConfig[currentOrderStatus];

   const canUploadSlip = order.Payment_Type === 'Bank Transfer' && order.Status === 'pending';

   return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
       <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
         <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
           <FiX size={24} />
         </button>
         <h2 className="text-xl font-bold text-gray-800 mb-4">รายละเอียดคำสั่งซื้อ: {order.Order_ID}</h2>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">รายละเอียดการจัดส่ง</h3>
             <p className="text-gray-600"><strong>ที่อยู่:</strong> {order.Address}</p>
             <p className="text-gray-600"><strong>เบอร์โทรศัพท์:</strong> {order.Phone}</p>
             <p className="text-gray-600"><strong>วิธีการชำระเงิน:</strong> {order.Payment_Type}</p>
             {order.DeliveryDate && <p className="text-gray-600"><strong>วันที่จัดส่ง:</strong> {new Date(order.DeliveryDate).toLocaleDateString()}</p>}
             {order.Tracking_ID && <p className="text-gray-600"><strong>หมายเลขติดตาม:</strong> {order.Tracking_ID}</p>}
             {order.Shipping_Carrier && <p className="text-gray-600"><strong>บริษัทขนส่ง:</strong> {order.Shipping_Carrier}</p>}
             {order.Invoice_ID && <p className="text-gray-600"><strong>เลขที่ใบแจ้งหนี้:</strong> {order.Invoice_ID}</p>}
             <p className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo?.bgColor} ${statusInfo?.color} inline-flex items-center mt-2`}>
               {statusInfo?.icon && React.createElement(statusInfo.icon, { className: 'mr-1' })}
               {statusInfo?.label || order.Status}
             </p>
             {order.Cancellation_Reason && (
               <p className="text-red-600 mt-2"><strong>เหตุผลการยกเลิก:</strong> {order.Cancellation_Reason}</p>
             )}
           </div>
           <div>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">สินค้าในคำสั่งซื้อ</h3>
             <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
               {order.Products.map((product, index) => (
                 <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
                   {product.Product_Image_URL && (
                     <img
                       src={product.Product_Image_URL}
                       alt={product.Product_Name}
                       className="w-16 h-16 object-cover rounded"
                     />
                   )}
                   <div>
                     <p className="font-medium text-gray-800">{product.Product_Name} {product.Product_Brand ? `(${product.Product_Brand})` : ''}</p>
                     <p className="text-sm text-gray-600">
                       {product.Quantity} {product.Product_Unit} x ฿{product.Price.toFixed(2)}
                       {product.Discount > 0 && <span className="text-red-500 ml-2"> (ลด {product.Discount.toFixed(2)})</span>}
                     </p>
                     <p className="text-sm font-semibold text-gray-700">รวม: ฿{product.Subtotal.toFixed(2)}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>

         {order.Payment_Type === 'Bank Transfer' && (
           <div className="mt-4 border-t pt-4">
             <h3 className="text-lg font-semibold text-gray-700 mb-2">หลักฐานการโอนเงิน</h3>
             {order.Transfer_Slip_Image_URL ? (
               <div className="mb-2">
                 <img src={order.Transfer_Slip_Image_URL} alt="Transfer Slip" className="max-w-full h-auto rounded-md shadow-sm border border-gray-200" />
                 <p className="text-sm text-gray-500 mt-1">สลิปปัจจุบัน</p>
               </div>
             ) : (
               <p className="text-gray-500 mb-2">ยังไม่มีสลิปการโอนเงิน</p>
             )}

             {canUploadSlip ? (
               <div>
                 <label htmlFor={`slip-upload-${order.Order_ID}`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition duration-300">
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
                   className={`ml-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ${!selectedFile || updatingSlip ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {updatingSlip ? 'กำลังอัปโหลด...' : 'ยืนยันสลิป'}
                 </button>
                 {updateSlipError && <p className="text-red-500 mt-2">{updateSlipError}</p>}
               </div>
             ) : (
               order.Transfer_Slip_Image_URL ? (
                 <p className="text-gray-600 mt-2">ไม่สามารถเปลี่ยนสลิปได้เนื่องจากคำสั่งซื้อไม่อยู่ในสถานะ &quot;รอดำเนินการ&quot;</p>
               ) : (
                 <p className="text-gray-600 mt-2">ไม่สามารถอัปโหลดสลิปได้เนื่องจากคำสั่งซื้อไม่อยู่ในสถานะ &quot;รอดำเนินการ&quot;</p>
               )
             )}
           </div>
         )}
       </div>
     </div>
   );
 };

 export default OrderDetailsModal;