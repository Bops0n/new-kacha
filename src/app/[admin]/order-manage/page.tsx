'use client';

import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSave,
  FiX,
  FiEdit
} from 'react-icons/fi';

import { Order, OrderStatus, StatusConfig, EditFormData } from '../../../types';
import OrderRow from '../order-management/OrderRow';
import OrderCard from '../order-management/OrderCard';

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'สมชาย ใจดี',
    email: 'somchai@email.com',
    phone: '081-234-5678',
    products: [
      { name: 'โซฟา 3 ที่นั่ง', quantity: 1, price: 15000 },
      { name: 'โต๊ะกาแฟ', quantity: 1, price: 3500 }
    ],
    total: 18500,
    status: 'pending',
    orderDate: '2024-12-01',
    deliveryDate: '2024-12-15',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/ADD8E6/000000?text=Slip_ORD-001',
    cancellationReason: null,
  },
  {
    id: 'ORD-002',
    customerName: 'สมหญิง สวยงาม',
    email: 'somying@email.com',
    phone: '082-345-6789',
    products: [
      { name: 'เตียงนอน King Size', quantity: 1, price: 25000 },
      { name: 'ตู้เสื้อผ้า', quantity: 1, price: 12000 }
    ],
    total: 37000,
    status: 'processing',
    orderDate: '2024-12-02',
    deliveryDate: '2024-12-20',
    address: '456 ถนนพหลโยธิน กรุงเทพฯ 10400',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/90EE90/000000?text=Slip_ORD-002',
    cancellationReason: null,
  },
  {
    id: 'ORD-003',
    customerName: 'วิชัย รวยมาก',
    email: 'wichai@email.com',
    phone: '083-456-7890',
    products: [
      { name: 'ชุดโต๊ะอาหาร 6 ที่นั่ง', quantity: 1, price: 22000 }
    ],
    total: 22000,
    status: 'shipped',
    orderDate: '2024-11-28',
    deliveryDate: '2024-12-10',
    address: '789 ถนนรัชดาภิเษก กรุงเทพฯ 10320',
    trackingId: 'TPL003456789',
    shippingCarrier: 'Kerry Express',
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/DDA0DD/000000?text=Slip_ORD-003',
    cancellationReason: null,
  },
  {
    id: 'ORD-004',
    customerName: 'มาลี ขยัน',
    email: 'malee@email.com',
    phone: '084-567-8901',
    products: [
      { name: 'เก้าอี้สำนักงาน', quantity: 2, price: 4500 },
      { name: 'โต๊ะทำงาน', quantity: 1, price: 8500 }
    ],
    total: 17500,
    status: 'delivered',
    orderDate: '2024-11-25',
    deliveryDate: '2024-12-05',
    address: '321 ถนนลาดพร้าว กรุงเทพฯ 10230',
    trackingId: 'DHL987654321',
    shippingCarrier: 'DHL',
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/ADD8E6/000000?text=Slip_ORD-004',
    cancellationReason: null,
  },
  {
    id: 'ORD-005',
    customerName: 'ประยุทธ์ มั่นคง',
    email: 'prayuth@email.com',
    phone: '085-678-9012',
    products: [
      { name: 'หิ้งหนังสือ', quantity: 2, price: 6000 }
    ],
    total: 12000,
    status: 'cancelled',
    orderDate: '2024-11-30',
    deliveryDate: '2024-12-18',
    address: '654 ถนนเพชรบุรี กรุงเทพฯ 10400',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: null,
    cancellationReason: 'ลูกค้าเปลี่ยนใจ', // Added cancellation reason
  },
  {
    id: 'ORD-006',
    customerName: 'สุทธิรักษ์ จริงใจ',
    email: 'suttirak@email.com',
    phone: '086-123-4567',
    products: [
      { name: 'เก้าอี้ผู้บริหาร', quantity: 1, price: 12500 }
    ],
    total: 12500,
    status: 'pending',
    orderDate: '2024-12-03',
    deliveryDate: '2024-12-17',
    address: '111 ถนนวิภาวดี กรุงเทพฯ 10900',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/F08080/000000?text=Slip_ORD-006',
    cancellationReason: null,
  },
  {
    id: 'ORD-007',
    customerName: 'นิภา สุขสม',
    email: 'nipa@email.com',
    phone: '087-234-5678',
    products: [
      { name: 'โต๊ะข้าง', quantity: 2, price: 2500 },
      { name: 'โคมไฟตั้งโต๊ะ', quantity: 2, price: 1800 }
    ],
    total: 8600,
    status: 'processing',
    orderDate: '2024-12-04',
    deliveryDate: '2024-12-18',
    address: '222 ถนนพระราม 4 กรุงเทพฯ 10500',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-008',
    customerName: 'ชัยวัฒน์ กล้าหาญ',
    email: 'chaiwat@email.com',
    phone: '088-345-6789',
    products: [
      { name: 'ตู้โชว์', quantity: 1, price: 18000 }
    ],
    total: 18000,
    status: 'shipped',
    orderDate: '2024-11-29',
    deliveryDate: '2024-12-13',
    address: '333 ถนนงามวงศ์วาน กรุงเทพฯ 10900',
    trackingId: 'FEDEX654321098',
    shippingCarrier: 'FedEx',
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/ADD8E6/000000?text=Slip_ORD-008',
    cancellationReason: null,
  },
  {
    id: 'ORD-009',
    customerName: 'อัญชลี รื่นเริง',
    email: 'anchalee@email.com',
    phone: '089-456-7890',
    products: [
      { name: 'ชั้นวางของ', quantity: 3, price: 3200 }
    ],
    total: 9600,
    status: 'delivered',
    orderDate: '2024-11-26',
    deliveryDate: '2024-12-06',
    address: '444 ถนนจรัญสนิทวงศ์ กรุงเทพฯ 10700',
    trackingId: 'J&T1122334455',
    shippingCarrier: 'J&T Express',
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-010',
    customerName: 'พิทักษ์ มั่นใจ',
    email: 'pitak@email.com',
    phone: '090-567-8901',
    products: [
      { name: 'เก้าอี้บาร์', quantity: 4, price: 2200 }
    ],
    total: 8800,
    status: 'cancelled',
    orderDate: '2024-12-01',
    deliveryDate: '2024-12-15',
    address: '555 ถนนเพชรเกษม กรุงเทพฯ 10160',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/DAA520/000000?text=Slip_ORD-010',
    cancellationReason: 'สินค้าหมด', // Added cancellation reason
  },
  {
    id: 'ORD-011',
    customerName: 'วรรณา สดใส',
    email: 'wanna@email.com',
    phone: '091-678-9012',
    products: [
      { name: 'โต๊ะแป้ง', quantity: 1, price: 8500 },
      { name: 'เก้าอี้แป้ง', quantity: 1, price: 3500 }
    ],
    total: 12000,
    status: 'pending',
    orderDate: '2024-12-05',
    deliveryDate: '2024-12-19',
    address: '666 ถนนราชพฤกษ์ กรุงเทพฯ 10160',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-012',
    customerName: 'กิตติ เด่นดวง',
    email: 'kitti@email.com',
    phone: '092-789-0123',
    products: [
      { name: 'โซฟา 2 ที่นั่ง', quantity: 1, price: 12000 }
    ],
    total: 12000,
    status: 'processing',
    orderDate: '2024-12-06',
    deliveryDate: '2024-12-20',
    address: '777 ถนนรามอินทรา กรุงเทพฯ 10230',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/F0E68C/000000?text=Slip_ORD-012',
    cancellationReason: null,
  },
  {
    id: 'ORD-013',
    customerName: 'ปรารถนา ฝันดี',
    email: 'prartana@email.com',
    phone: '093-890-1234',
    products: [
      { name: 'ตู้รองเท้า', quantity: 1, price: 4500 }
    ],
    total: 4500,
    status: 'shipped',
    orderDate: '2024-11-30',
    deliveryDate: '2024-12-14',
    address: '888 ถนนบางนา กรุงเทพฯ 10260',
    trackingId: 'FLASH55667788',
    shippingCarrier: 'Flash Express',
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-014',
    customerName: 'เสาวรส หวานใจ',
    email: 'saowaros@email.com',
    phone: '094-901-2345',
    products: [
      { name: 'โต๊ะเครื่องแป้ง', quantity: 1, price: 15000 },
      { name: 'กระจกแต่งตัว', quantity: 1, price: 3500 }
    ],
    total: 18500,
    status: 'delivered',
    orderDate: '2024-11-27',
    deliveryDate: '2024-12-07',
    address: '999 ถนนศรีนครินทร์ กรุงเทพฯ 10250',
    trackingId: 'BESTEX123456789',
    shippingCarrier: 'Best Express',
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/ADD8E6/000000?text=Slip_ORD-014',
    cancellationReason: null,
  },
  {
    id: 'ORD-015',
    customerName: 'บุญเกื้อ ช่วยเหลือ',
    email: 'boonkuea@email.com',
    phone: '095-012-3456',
    products: [
      { name: 'โต๊ะทำงานมุม', quantity: 1, price: 9800 }
    ],
    total: 9800,
    status: 'cancelled',
    orderDate: '2024-12-02',
    deliveryDate: '2024-12-16',
    address: '101 ถนนสีลม กรุงเทพฯ 10500',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: null,
    cancellationReason: 'ที่อยู่ไม่ถูกต้อง', // Added cancellation reason
  },
  {
    id: 'ORD-016',
    customerName: 'จันทร์เพ็ญ แสงส่อง',
    email: 'janpen@email.com',
    phone: '096-123-4567',
    products: [
      { name: 'หิ้งแขวนผนัง', quantity: 5, price: 1200 }
    ],
    total: 6000,
    status: 'pending',
    orderDate: '2024-12-07',
    deliveryDate: '2024-12-21',
    address: '202 ถนนสาทร กรุงเทพฯ 10120',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/F0E68C/000000?text=Slip_ORD-016',
    cancellationReason: null,
  },
  {
    id: 'ORD-017',
    customerName: 'วรัญ อารมณ์ดี',
    email: 'waran@email.com',
    phone: '097-234-5678',
    products: [
      { name: 'เตียงเดี่ยว', quantity: 1, price: 8500 },
      { name: 'ที่นอน', quantity: 1, price: 4500 }
    ],
    total: 13000,
    status: 'processing',
    orderDate: '2024-12-08',
    deliveryDate: '2024-12-22',
    address: '303 ถนนอโศก กรุงเทพฯ 10110',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-018',
    customerName: 'ศุภกร โชคดี',
    email: 'supakorn@email.com',
    phone: '098-345-6789',
    products: [
      { name: 'ตู้เก็บเอกสาร', quantity: 2, price: 5500 }
    ],
    total: 11000,
    status: 'shipped',
    orderDate: '2024-12-01',
    deliveryDate: '2024-12-15',
    address: '404 ถนนพลับพลา กรุงเทพฯ 10330',
    trackingId: 'THAIPOST123456789',
    shippingCarrier: 'Thailand Post',
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/B0E0E6/000000?text=Slip_ORD-018',
    cancellationReason: null,
  },
  {
    id: 'ORD-019',
    customerName: 'กนกวรรณ สวยงาม',
    email: 'kanokwan@email.com',
    phone: '099-456-7890',
    products: [
      { name: 'โต๊ะวางทีวี', quantity: 1, price: 7800 }
    ],
    total: 7800,
    status: 'delivered',
    orderDate: '2024-11-28',
    deliveryDate: '2024-12-08',
    address: '505 ถนนวิทยุ กรุงเทพฯ 10330',
    trackingId: 'NINJAVAN987654321',
    shippingCarrier: 'Ninja Van',
    transferSlipImageUrl: null,
    cancellationReason: null,
  },
  {
    id: 'ORD-020',
    customerName: 'อุดร น่ารัก',
    email: 'udon@email.com',
    phone: '080-567-8901',
    products: [
      { name: 'เก้าอี้พักผ่อน', quantity: 1, price: 14500 },
      { name: 'โต๊ะข้างเตียง', quantity: 2, price: 2800 }
    ],
    total: 20100,
    status: 'pending',
    orderDate: '2024-12-09',
    deliveryDate: '2024-12-23',
    address: '606 ถนนรัชดา กรุงเทพฯ 10400',
    trackingId: null,
    shippingCarrier: null,
    transferSlipImageUrl: 'https://via.placeholder.com/300x200/F0E68C/000000?text=Slip_ORD-020',
    cancellationReason: null,
  }
];

const statusConfig: StatusConfig = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'badge-warning',
    icon: FiClock,
    bgColor: 'bg-warning/10'
  },
  processing: {
    label: 'กำลังเตรียม',
    color: 'badge-info',
    icon: FiPackage,
    bgColor: 'bg-info/10'
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    color: 'badge-primary',
    icon: FiTruck,
    bgColor: 'bg-primary/10'
  },
  delivered: {
    label: 'ส่งเรียบร้อย',
    color: 'badge-success',
    icon: FiCheckCircle,
    bgColor: 'bg-success/10'
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'badge-error',
    icon: FiXCircle,
    bgColor: 'bg-error/10'
  }
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    trackingId: '',
    shippingCarrier: '',
    deliveryDate: '',
    status: 'pending',
    transferSlipImageUrl: '',
    cancellationReason: '', // Initialize cancellation reason
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // State for cancellation confirmation modal
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<{ id: string, newStatus: OrderStatus } | null>(null);

  useEffect(() => {
    let filtered: Order[] = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm) ||
        (order.trackingId && order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  useEffect(() => {
    const startIndex: number = (currentPage - 1) * itemsPerPage;
    const endIndex: number = startIndex + itemsPerPage;
    const paginated: Order[] = filteredOrders.slice(startIndex, endIndex);

    setPaginatedOrders(paginated);
    setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Function to update an order's status, now with cancellation confirmation
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, reason: string | null = null) => {
    if (newStatus === 'cancelled') {
      setOrderToCancel({ id: orderId, newStatus: newStatus });
      setShowCancelConfirmModal(true);
      // Do NOT update state immediately, wait for confirmation
    } else {
      // For non-cancellation status changes, proceed directly
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus, cancellationReason: reason } : order
      ));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus, cancellationReason: reason } : null));
      }
    }
  };

  // Confirms the cancellation and updates the order status
  const confirmCancellation = (reason: string | null = null) => {
    if (orderToCancel) {
      setOrders(prev => prev.map(order =>
        order.id === orderToCancel.id ? { ...order, status: orderToCancel.newStatus, cancellationReason: reason } : order
      ));
      // Update selectedOrder if it was the one being cancelled
      if (selectedOrder && selectedOrder.id === orderToCancel.id) {
        setSelectedOrder(prev => (prev ? { ...prev, status: orderToCancel.newStatus, cancellationReason: reason } : null));
      }
      setShowCancelConfirmModal(false);
      setOrderToCancel(null); // Clear the order to cancel
      setIsEditing(false); // Ensure modal exits edit mode after cancellation
      setShowOrderModal(false); // Close the detail modal after cancellation
    }
  };

  const deleteOrder = (orderId: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อ ${orderId}?`)) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setShowOrderModal(false);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (selectedOrder) {
      setEditFormData({
        trackingId: selectedOrder.trackingId || '',
        shippingCarrier: selectedOrder.shippingCarrier || '',
        deliveryDate: selectedOrder.deliveryDate || '',
        status: selectedOrder.status,
        transferSlipImageUrl: selectedOrder.transferSlipImageUrl || '',
        cancellationReason: selectedOrder.cancellationReason || '', // Load cancellation reason
      });
      setIsEditing(true);
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value as string
    }));
  };

  const updateOrderDetails = () => {
    if (selectedOrder) {
      const newStatus = editFormData.status;
      const newCancellationReason = editFormData.status === 'cancelled' ? editFormData.cancellationReason : null;

      // If changing to cancelled, use the confirmation flow
      if (newStatus === 'cancelled' && selectedOrder.status !== 'cancelled') {
        setOrderToCancel({ id: selectedOrder.id, newStatus: newStatus });
        setShowCancelConfirmModal(true);
      } else {
        // Otherwise, directly update the order
        setOrders(prevOrders => prevOrders.map(order =>
          order.id === selectedOrder.id
            ? {
              ...order,
              trackingId: editFormData.trackingId,
              shippingCarrier: editFormData.shippingCarrier,
              deliveryDate: editFormData.deliveryDate,
              status: newStatus,
              transferSlipImageUrl: editFormData.transferSlipImageUrl || null,
              cancellationReason: newCancellationReason, // Update cancellation reason
            }
            : order
        ));
        setSelectedOrder(prev => (prev ? {
          ...prev,
          trackingId: editFormData.trackingId,
          shippingCarrier: editFormData.shippingCarrier,
          deliveryDate: editFormData.deliveryDate,
          status: newStatus,
          transferSlipImageUrl: editFormData.transferSlipImageUrl || null,
          cancellationReason: newCancellationReason,
        } : null));
        setIsEditing(false);
      }
    }
  };


  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  interface OrderStats {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }

  const getStatusStats = (): OrderStats => {
    const stats: OrderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    return stats;
  };

  const stats: OrderStats = getStatusStats();

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">จัดการคำสั่งซื้อ</h1>
              <p className="text-base-content/70 mt-1">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary w-full sm:w-auto">
                <FiPlus className="w-4 h-4" />
                เพิ่มคำสั่งซื้อ
              </button>
              <button className="btn btn-outline w-full sm:w-auto">
                <FiDownload className="w-4 h-4" />
                ส่งออก
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral/10 rounded-lg">
                <FiPackage className="w-5 h-5 text-neutral" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">ทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FiClock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">รอดำเนินการ</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <FiPackage className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">กำลังเตรียม</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FiTruck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">จัดส่งแล้ว</p>
                <p className="text-2xl font-bold">{stats.shipped}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">ส่งเรียบร้อย</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <FiXCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">ยกเลิก</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ, ชื่อลูกค้า, อีเมล, เบอร์โทร หรือ Tracking ID..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="processing">กำลังเตรียม</option>
                <option value="shipped">จัดส่งแล้ว</option>
                <option value="delivered">ส่งเรียบร้อย</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
            <div className="md:w-40">
              <select
                className="select select-bordered w-full"
                value={itemsPerPage}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleItemsPerPageChange(Number(e.target.value))}
              >
                <option value={5}>5 รายการ</option>
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table - Desktop View (hidden on small screens) */}
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>รหัสคำสั่งซื้อ</th>
                  <th>ลูกค้า</th>
                  <th>สินค้า</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                  <th>วันที่สั่ง</th>
                  <th>วันส่ง</th>
                  <th>Tracking ID</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order: Order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    statusConfig={statusConfig}
                    formatPrice={formatPrice}
                    viewOrderDetails={viewOrderDetails}
                    updateOrderStatus={updateOrderStatus} // Passed to OrderRow
                    deleteOrder={deleteOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders List - Mobile View (hidden on medium and larger screens) */}
        <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
          {paginatedOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {paginatedOrders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  statusConfig={statusConfig}
                  formatPrice={formatPrice}
                  viewOrderDetails={viewOrderDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiPackage className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>

        {/* No orders found message for both views if no filtered orders */}
        {paginatedOrders.length === 0 && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FiPackage className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}

        {/* Pagination Section */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-base-100 rounded-b-lg shadow-sm mt-4">
            <div className="text-sm text-base-content/70">
              แสดงรายการ {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredOrders.length)} จากทั้งหมด {filteredOrders.length} รายการ
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-1">
              <button
                className={`btn btn-sm ${currentPage === 1 ? 'btn-disabled' : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </button>

              <div className="flex flex-wrap justify-center gap-1">
                {(() => {
                  const pages: JSX.Element[] = [];
                  const maxVisiblePages: number = 5;
                  let startPage: number = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage: number = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        className="btn btn-sm"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-2">...</span>);
                    }
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        className={`btn btn-sm ${i === currentPage ? 'btn-primary' : ''}`}
                        onClick={() => handlePageChange(i)}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="ellipsis2" className="px-2">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        className="btn btn-sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button
                className={`btn btn-sm ${currentPage === totalPages ? 'btn-disabled' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {showOrderModal && selectedOrder && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-3xl">
              <h3 className="font-bold text-lg mb-4">
                {isEditing ? `แก้ไขคำสั่งซื้อ ${selectedOrder.id}` : `รายละเอียดคำสั่งซื้อ ${selectedOrder.id}`}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold mb-2">ข้อมูลลูกค้า</h4>
                  <div className="bg-base-200 rounded-lg p-4">
                    <p><strong>ชื่อ:</strong> {selectedOrder.customerName}</p>
                    <p><strong>อีเมล:</strong> {selectedOrder.email}</p>
                    <p><strong>เบอร์โทร:</strong> {selectedOrder.phone}</p>
                    <p><strong>ที่อยู่:</strong> {selectedOrder.address}</p>
                  </div>
                </div>

                {/* Order Information & Editable Fields */}
                <div>
                  <h4 className="font-semibold mb-2">ข้อมูลคำสั่งซื้อ</h4>
                  <div className="bg-base-200 rounded-lg p-4">
                    <p><strong>รหัส:</strong> {selectedOrder.id}</p>
                    <p><strong>วันที่สั่ง:</strong> {selectedOrder.orderDate}</p>

                    {isEditing ? (
                      <>
                        <div className="form-control mb-2">
                          <label className="label">
                            <span className="label-text">วันที่ส่ง</span>
                          </label>
                          <input
                            type="date"
                            name="deliveryDate"
                            className="input input-bordered w-full"
                            value={editFormData.deliveryDate}
                            onChange={handleEditFormChange}
                          />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label">
                            <span className="label-text">Tracking ID</span>
                          </label>
                          <input
                            type="text"
                            name="trackingId"
                            placeholder="ระบุ Tracking ID"
                            className="input input-bordered w-full"
                            value={editFormData.trackingId}
                            onChange={handleEditFormChange}
                          />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label">
                            <span className="label-text">บริษัทขนส่ง</span>
                          </label>
                          <input
                            type="text"
                            name="shippingCarrier"
                            placeholder="ระบุบริษัทขนส่ง"
                            className="input input-bordered w-full"
                            value={editFormData.shippingCarrier}
                            onChange={handleEditFormChange}
                          />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label">
                            <span className="label-text">สถานะ</span>
                          </label>
                          <select
                            name="status"
                            className="select select-bordered w-full"
                            value={editFormData.status}
                            onChange={handleEditFormChange}
                          >
                            {Object.keys(statusConfig).map(key => (
                              <option key={key} value={key}>
                                {statusConfig[key as OrderStatus].label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Input for Transfer Slip Image URL */}
                        <div className="form-control mb-2">
                          <label className="label">
                            <span className="label-text">URL หลักฐานโอนเงิน</span>
                          </label>
                          <input
                            type="text"
                            name="transferSlipImageUrl"
                            placeholder="URL รูปภาพสลิปโอนเงิน"
                            className="input input-bordered w-full"
                            value={editFormData.transferSlipImageUrl}
                            onChange={handleEditFormChange}
                          />
                        </div>
                        {/* Textarea for Cancellation Reason - visible only if status is cancelled */}
                        {editFormData.status === 'cancelled' && (
                          <div className="form-control mb-2">
                            <label className="label">
                              <span className="label-text">เหตุผลการยกเลิก</span>
                            </label>
                            <textarea
                              name="cancellationReason"
                              placeholder="ระบุเหตุผลการยกเลิก"
                              className="textarea textarea-bordered h-24 w-full"
                              value={editFormData.cancellationReason}
                              onChange={handleEditFormChange}
                            ></textarea>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p><strong>วันที่ส่ง:</strong> {selectedOrder.deliveryDate}</p>
                        <p>
                          <strong>Tracking ID:</strong>{' '}
                          {selectedOrder.trackingId ? selectedOrder.trackingId : 'ยังไม่มี'}
                        </p>
                        {selectedOrder.shippingCarrier && (
                          <p>
                            <strong>บริษัทขนส่ง:</strong> {selectedOrder.shippingCarrier}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <strong>สถานะ:</strong>
                          <span className={`badge ${statusConfig[selectedOrder.status].color}`}>
                            {statusConfig[selectedOrder.status].label}
                          </span>
                        </div>
                        {/* Display Cancellation Reason if status is cancelled and reason exists */}
                        {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                          <div className="mt-2">
                            <p><strong>เหตุผลการยกเลิก:</strong></p>
                            <p className="text-sm text-base-content/80">{selectedOrder.cancellationReason}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Transfer Slip Image Display */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">หลักฐานการโอนเงิน</h4>
                <div className="bg-base-200 rounded-lg p-4 flex justify-center items-center h-48 sm:h-64 overflow-hidden">
                  {selectedOrder.transferSlipImageUrl ? (
                    <img
                      src={selectedOrder.transferSlipImageUrl}
                      alt={`หลักฐานการโอนเงินของ ${selectedOrder.id}`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.onerror = null; // prevents infinite loop
                        e.currentTarget.src = 'https://placehold.co/300x200/cccccc/333333?text=Image+Load+Error'; // Fallback image
                      }}
                    />
                  ) : (
                    <p className="text-base-content/70">ยังไม่มีหลักฐานการโอนเงิน</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">รายการสินค้า</h4>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>สินค้า</th>
                        <th>จำนวน</th>
                        <th>ราคาต่อหน่วย</th>
                        <th>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products.map((product, idx) => (
                        <tr key={idx}>
                          <td>{product.name}</td>
                          <td>{product.quantity}</td>
                          <td>{formatPrice(product.price)}</td>
                          <td>{formatPrice(product.price * product.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3}>ยอดรวมทั้งสิ้น</th>
                        <th>{formatPrice(selectedOrder.total)}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="modal-action flex-col sm:flex-row">
                {isEditing ? (
                  <>
                    <button className="btn btn-ghost w-full sm:w-auto" onClick={() => setIsEditing(false)}>
                      <FiX className="w-4 h-4" /> ยกเลิก
                    </button>
                    <button className="btn btn-primary w-full sm:w-auto" onClick={updateOrderDetails}>
                      <FiSave className="w-4 h-4" /> บันทึก
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn w-full sm:w-auto" onClick={() => setShowOrderModal(false)}>ปิด</button>
                    <button
                      className="btn btn-primary w-full sm:w-auto"
                      onClick={handleEditClick}
                      disabled={selectedOrder.status === 'cancelled'} // Disable edit button if cancelled
                    >
                      <FiEdit className="w-4 h-4" /> แก้ไข
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {showCancelConfirmModal && orderToCancel && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error">คำเตือน: ยืนยันการยกเลิก</h3>
              <p className="py-4">คุณกำลังจะยกเลิกคำสั่งซื้อ <strong>{orderToCancel.id}</strong>. การดำเนินการนี้ไม่สามารถย้อนกลับได้เมื่อยืนยันแล้ว</p>
              <p className="mb-4">หากยกเลิกแล้วจะไม่สามารถแก้ไขสถานะกลับมาได้</p>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">เหตุผลการยกเลิก (จำเป็น)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="ระบุเหตุผลในการยกเลิก"
                  value={editFormData.cancellationReason} // Use editFormData's reason
                  onChange={handleEditFormChange} // Use the same handler
                  name="cancellationReason" // Ensure name matches
                ></textarea>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCancelConfirmModal(false);
                    setOrderToCancel(null);
                    // Reset editFormData status if it was changed to 'cancelled' but cancelled
                    if (selectedOrder) {
                      setEditFormData(prev => ({ ...prev, status: selectedOrder.status, cancellationReason: selectedOrder.cancellationReason || '' }));
                    }
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => confirmCancellation(editFormData.cancellationReason)}
                  disabled={!editFormData.cancellationReason} // Disable confirm if reason is empty
                >
                  ยืนยันการยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
