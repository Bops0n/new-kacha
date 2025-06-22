'use client'; // This component will run on the client side

import { useState, useEffect, useMemo } from 'react'; // Added useMemo for optimization
import {
  FiSearch,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSave,
  FiX,
  FiEdit,
  FiTrash2, // Added FiTrash2 for delete icon
  FiEye, // Added FiEye for view icon
  FiDownload, // Added FiDownload for export button (if needed later)
  FiPlus, // Added FiPlus for add button (if needed later)
} from 'react-icons/fi';

// --- Type Definitions (Refined to match API output exactly) ---
// This interface represents the shape of an order record as received from the API.
interface Order {
  id: number; // Maps to Order_ID from DB (number)
  userId: number; // NEW: Added userId to match data from API
  customerName: string; // From User.FullName via API
  email: string | null; // From User.Email via API
  phone: string | null; // From Address.Phone via API
  products: Array<{ name: string; quantity: number; price: number; discount: number }>; // From Order_Detail & Product tables
  total: number; // Calculated from products in API
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'; // Maps to status from DB
  orderDate: string; // From DB
  deliveryDate: string | null; // From Order table
  address: string; // From Order table (snapshot)
  trackingId: string | null; // From Order table
  shippingCarrier: string | null; // From Order table
  transferSlipImageUrl: string | null; // From Order table
  cancellationReason: string | null; // From Order table
  paymentType: string; // From DB (Payment_Type)
  invoiceId: string | null; // From DB (Invoice_ID)
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string; // Tailwind CSS class for badge color
    icon: React.ElementType; // Icon component from react-icons/fi
    bgColor: string; // Tailwind CSS class for background color
  };
}

// Form data structure for editing an order in the modal
// Only includes fields that can be updated via PATCH in the API
interface EditFormData {
  trackingId: string;
  shippingCarrier: string;
  deliveryDate: string;
  status: OrderStatus;
  transferSlipImageUrl: string;
  cancellationReason: string;
}

// --- Status Configuration ---
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


// --- OrderRow Component (for Desktop Table View) ---
interface OrderRowProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order) => void;
  deleteOrder: (orderId: number) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, statusConfig, formatPrice, viewOrderDetails, deleteOrder }) => {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    // Make the entire row clickable to view details
    <tr className="hover cursor-pointer" onClick={() => viewOrderDetails(order)}>
      <td><div className="font-bold text-primary">{order.id}</div></td>
      <td>
        <div className="font-bold">{order.customerName}</div>
        {/* Email and Phone are now pulled from User/Address tables and displayed in modal details */}
        {/* <div className="text-sm opacity-50">{order.email || '-'}</div> */}
      </td>
      <td>
        {order.products.map((p, idx) => (
          <div key={idx} className="text-sm">{p.name} (x{p.quantity})</div>
        ))}
      </td>
      <td><div className="font-bold">{formatPrice(order.total)}</div></td>
      <td>
        <span className={`badge ${statusConfig[order.status].color}`}>
          <StatusIcon className="w-3 h-3 mr-1" /> {statusConfig[order.status].label}
        </span>
      </td>
      <td>{order.orderDate.split('T')[0]}</td>
      <td>{order.deliveryDate !== null ? order.deliveryDate.split('T')[0] : '-'}</td>
      <td>{order.trackingId || '-'}</td>
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              viewOrderDetails(order);
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              deleteOrder(order.id);
            }}
            title="ลบคำสั่งซื้อ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- OrderCard Component (for Mobile Grid View) ---
interface OrderCardProps {
  order: Order;
  statusConfig: StatusConfig;
  formatPrice: (price: number) => string;
  viewOrderDetails: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, statusConfig, formatPrice, viewOrderDetails }) => {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => viewOrderDetails(order)}>
      <div className="card-body p-4">
        <h2 className="card-title text-base">{order.customerName} (ID: {order.id})</h2>
        <p className="text-sm text-base-content/70">
          <strong>ยอดรวม:</strong> {formatPrice(order.total)}
        </p>
        <p className="text-sm flex items-center gap-1">
          <strong>สถานะ:</strong>
          <span className={`badge ${statusConfig[order.status].color}`}>
            <StatusIcon className="w-3 h-3 mr-1" /> {statusConfig[order.status].label}
          </span>
        </p>
        <p className="text-sm">
          <strong>วันที่สั่ง:</strong> {order.orderDate.split('T')[0]}
        </p>
        {order.trackingId && (
          <p className="text-sm">
            <strong>Tracking ID:</strong> {order.trackingId}
          </p>
        )}
        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from also triggering
              viewOrderDetails(order);
            }}
          >
            <FiEye className="w-4 h-4" /> ดู
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Order Management Component ---
export default function OrderManagement() {
  // --- States ---
  const [orders, setOrders] = useState<Order[]>([]); // All orders fetched from API
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]); // Orders after applying filters/search
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Modal & Form States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form data state for editing order details
  const [editFormData, setEditFormData] = useState<EditFormData>({
    trackingId: '',
    shippingCarrier: '',
    deliveryDate: '',
    status: 'pending', // Default status, will be overwritten by selectedOrder
    transferSlipImageUrl: '',
    cancellationReason: '',
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // State for cancellation confirmation modal
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [orderToCancel, setOrderToCancel] = useState<{ id: number, newStatus: OrderStatus, reason: string | null } | null>(null);

  // API Loading, Error, and Message Display States
  const [loading, setLoading] = useState<boolean>(true); // Initial loading state for fetching orders
  const [error, setError] = useState<string | null>(null); // For general page errors (e.g., failed initial fetch)
  const [message, setMessage] = useState<string | null>(null); // For success/error messages from API actions (add/update/delete)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null); // Type of message

  // --- API Interaction Functions ---

  // Function to fetch all orders from the backend API
  const fetchOrders = async () => {
    setLoading(true); // Set loading true before fetch
    setError(null);    // Clear any previous error
    setMessage(null);  // Clear any previous message
    setMessageType(null);

    try {
      // Adjusted API endpoint to /api/admin/order
      const response = await fetch('/api/admin/order'); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch orders.');
      }
      const data = await response.json();
      setOrders(data.orders || []); // Update orders state with fetched data
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'An error occurred while fetching orders.'); // Set error state
    } finally {
      setLoading(false); // Set loading false after fetch completes
    }
  };

  // Function to update an order's details via API (PATCH)
  const updateOrderDetails = async () => {
    if (!selectedOrder) return;

    setMessage(null); // Clear previous messages
    setMessageType(null);

    const newStatus = editFormData.status;
    const newCancellationReason = (newStatus === 'cancelled' && editFormData.cancellationReason.trim() !== '') 
                                 ? editFormData.cancellationReason.trim() 
                                 : null;

    // If changing to cancelled, trigger the confirmation modal
    if (newStatus === 'cancelled' && selectedOrder.status !== 'cancelled') {
      setOrderToCancel({ id: selectedOrder.id, newStatus: newStatus, reason: newCancellationReason });
      setShowCancelConfirmModal(true);
      return; // Stop here and wait for confirmation
    }

    // Prepare payload for API
    const payload = {
      id: selectedOrder.id, // Use numeric ID
      trackingId: editFormData.trackingId.trim() === '' ? null : editFormData.trackingId.trim(),
      shippingCarrier: editFormData.shippingCarrier.trim() === '' ? null : editFormData.shippingCarrier.trim(),
      // Ensure deliveryDate is properly formatted for DB (YYYY-MM-DD)
      deliveryDate: editFormData.deliveryDate.trim() === '' ? null : editFormData.deliveryDate.trim(),
      status: newStatus,
      transferSlipImageUrl: editFormData.transferSlipImageUrl.trim() === '' ? null : editFormData.transferSlipImageUrl.trim(),
      cancellationReason: newCancellationReason, // Ensure reason is null if not cancelled
    };

    try {
      // Adjusted API endpoint to /api/admin/order
      const response = await fetch('/api/admin/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json(); // Always parse response, even on error, for message

      if (!response.ok) {
        throw new Error(result.message || response.statusText || 'Failed to update order details.');
      }

      setMessage(result.message || 'Order updated successfully!');
      setMessageType('success');
      
      fetchOrders(); // Re-fetch orders to update the UI with latest data
      setIsEditing(false); // Exit edit mode
      setShowOrderModal(false); // Close modal
    } catch (err: any) {
      console.error('Error updating order details:', err);
      setMessage(err.message || 'An error occurred during order update.');
      setMessageType('error');
    }
  };

  // Confirms the cancellation and updates the order status via API
  const confirmCancellation = async (reason: string | null) => {
    if (!orderToCancel) return;

    setMessage(null); // Clear previous messages
    setMessageType(null);

    const payload = {
      id: orderToCancel.id,
      status: orderToCancel.newStatus,
      cancellationReason: reason,
    };

    try {
      // Adjusted API endpoint to /api/admin/order
      const response = await fetch('/api/admin/order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json(); // Always parse response, even on error, for message

      if (!response.ok) {
        throw new Error(result.message || response.statusText || 'Failed to cancel order.');
      }

      setMessage(result.message || 'Order cancelled successfully!');
      setMessageType('success');

      fetchOrders(); // Re-fetch orders to update UI
      setShowCancelConfirmModal(false);
      setOrderToCancel(null);
      setIsEditing(false);
      setShowOrderModal(false);
    } catch (err: any) {
      console.error('Error confirming cancellation:', err);
      setMessage(err.message || 'An error occurred during cancellation confirmation.');
      setMessageType('error');
    }
  };


  // Function to delete an order via API (DELETE)
  const deleteOrder = async (orderId: number) => {
    setMessage(null); // Clear previous messages
    setMessageType(null);

    // In a real app, replace confirm with a custom modal for better UX
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบคำสั่งซื้อ ID: ${orderId}?`)) { 
      return;
    }

    try {
      // Adjusted API endpoint to /api/admin/order
      const response = await fetch(`/api/admin/order?id=${orderId}`, { 
        method: 'DELETE',
      });

      const result = await response.json(); // Always parse response, even on error, for message

      if (!response.ok) {
        throw new Error(result.message || response.statusText || 'Failed to delete order.');
      }

      setMessage(result.message || 'Order deleted successfully!');
      setMessageType('success');
      
      fetchOrders(); // Re-fetch orders to update UI
      setShowOrderModal(false); // Close modal if open
    } catch (err: any) {
      console.error('Error deleting order:', err);
      setMessage(err.message || 'An error occurred during deletion.');
      setMessageType('error');
    }
  };

  // --- UI Interaction Handlers ---

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
    setIsEditing(false); // Always open in view mode initially
    // Populate edit form data for potential editing later
    setEditFormData({
      trackingId: order.trackingId || '',
      shippingCarrier: order.shippingCarrier || '',
      deliveryDate: order.deliveryDate || '',
      status: order.status,
      transferSlipImageUrl: order.transferSlipImageUrl || '',
      cancellationReason: order.cancellationReason || '',
    });
  };

  const handleEditClick = () => {
    setIsEditing(true); // Switch modal to edit mode
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Search & Filter Logic ---
  useEffect(() => {
    let filtered: Order[] = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchTerm) || // Search by numeric ID
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.trackingId && order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [searchTerm, statusFilter, orders]);

  // --- Pagination Logic ---
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

  // --- Helper Functions (Memoized for performance) ---
  const formatPrice = useMemo(() => (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  }, []);

  // --- Order Statistics Calculation (Memoized for performance) ---
  interface OrderStats {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }

  const getStatusStats = useMemo((): OrderStats => {
    const stats: OrderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    return stats;
  }, [orders]);

  const stats: OrderStats = getStatusStats;

  // --- Initial Data Fetch on Component Mount ---
  useEffect(() => {
    fetchOrders(); // Fetch orders from the API on component mount
  }, []); // Empty dependency array means this runs once on mount

  // --- Render Logic ---
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
            {/* Removed "เพิ่มคำสั่งซื้อ" and "ส่งออก" buttons as per previous request */}
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
                  placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ, ชื่อลูกค้า, Tracking ID..."
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
                {Object.keys(statusConfig).map(statusKey => (
                    <option key={statusKey} value={statusKey}>{statusConfig[statusKey as OrderStatus].label}</option>
                ))}
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

        {/* Display Loading/Error/Message states */}
        {loading && (
            <div className="flex justify-center items-center h-48 bg-base-100 rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="ml-4 text-lg text-base-content/70">กำลังโหลดคำสั่งซื้อ...</p>
            </div>
        )}
        {error && (
            <div className="text-center p-6 bg-error/10 text-error rounded-lg shadow-md max-w-xl mx-auto my-8">
                <p className="font-bold text-xl mb-2">เกิดข้อผิดพลาด!</p>
                <p>{error}</p>
            </div>
        )}
        {message && (
            <div className={`text-center p-4 rounded-lg shadow-md max-w-xl mx-auto my-4 ${messageType === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                <p>{message}</p>
            </div>
        )}
        
        {/* Orders Table - Desktop View */}
        {!loading && !error && (
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
                    deleteOrder={deleteOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Orders List - Mobile View */}
        {!loading && !error && (
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
        )}

        {/* No orders found message - only show if not loading and no error, and filters result in no products */}
        {!loading && !error && paginatedOrders.length === 0 && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FiPackage className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}


        {/* Pagination Section */}
        {!loading && !error && filteredOrders.length > 0 && (
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

                  // Add ellipsis if needed at the start
                  if (startPage > 1) {
                    pages.push(
                      <button key={1} className="btn btn-sm" onClick={() => handlePageChange(1)}>1</button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-2">...</span>);
                    }
                  }

                  // Add main page numbers
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

                  // Add ellipsis if needed at the end
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
                    <p><strong>User ID:</strong> {selectedOrder.userId}</p> {/* NEW: Display User ID */}
                    <p><strong>ชื่อ:</strong> {selectedOrder.customerName}</p>
                    <p><strong>อีเมล:</strong> {selectedOrder.email || '-'}</p>
                    <p><strong>เบอร์โทร:</strong> {selectedOrder.phone || '-'}</p>
                    <p><strong>ที่อยู่:</strong> {selectedOrder.address}</p>
                  </div>
                </div>

                {/* Order Information & Editable Fields */}
                <div>
                  <h4 className="font-semibold mb-2">ข้อมูลคำสั่งซื้อ</h4>
                  <div className="bg-base-200 rounded-lg p-4">
                    <p><strong>รหัส:</strong> {selectedOrder.id}</p>
                    <p><strong>วันที่สั่ง:</strong> {selectedOrder.orderDate.split('T')[0]}</p>

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
                            value={editFormData.deliveryDate.split('T')[0]}
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
                              placeholder="ระบุเหตุผลในการยกเลิก"
                              className="textarea textarea-bordered h-24 w-full"
                              value={editFormData.cancellationReason}
                              onChange={handleEditFormChange}
                            ></textarea>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p><strong>วันที่ส่ง:</strong> {selectedOrder.deliveryDate !== null ? selectedOrder.deliveryDate.split('T')[0] : '-'}</p>
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
                        <th>ส่วนลด</th>
                        <th>รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products.map((product, idx) => (
                        <tr key={idx}>
                          <td>{product.name}</td>
                          <td>{product.quantity}</td>
                          <td>{formatPrice(product.price)}</td>
                          <td>{formatPrice(product.discount)}</td>
                          <td>{formatPrice((product.price * product.quantity) - product.discount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={4}>ยอดรวมทั้งสิ้น</th>
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
              <div className="modal-action flex-col sm:flex-row">
                <button
                  className="btn btn-ghost w-full sm:w-auto"
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
                  className="btn btn-error w-full sm:w-auto"
                  onClick={() => confirmCancellation(editFormData.cancellationReason)}
                  disabled={!editFormData.cancellationReason.trim()} // Disable confirm if reason is empty
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
