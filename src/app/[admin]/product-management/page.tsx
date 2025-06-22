'use client'; // This component will run on the client side

import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo for optimization
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiDollarSign,
  FiBox,
  FiZap, // For Reorder Point
  FiStar, // For Review Rating
  FiTag, // For Brand
  FiLink, // For Image URL
  FiEyeOff, // For hidden visibility
  FiX,
  FiSave,
  FiAlertTriangle, // Icon for low stock
  FiAlertCircle,   // Icon for out of stock
  FiCheckCircle    // Icon for in stock
} from 'react-icons/fi';

// --- Type Definitions (You can move these to a separate '../../../types.ts' file) ---
interface ProductInventory {
  Product_ID: number;
  Child_ID: number | null;
  Name: string;
  Brand: string;
  Description: string | null;
  Unit: string;
  Quantity: number;
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string | null;
  Dimensions: string | null; // NEW: Added Dimensions
  Material: string | null;   // NEW: Added Material
  // created_at?: string; // Add if your DB returns these, typically managed by DB
  // updated_at?: string; // Add if your DB returns these, typically managed by DB
}

interface Category {
  Category_ID: number;
  Name: string;
}

interface SubCategory {
  Category_ID: number;
  Sub_Category_ID: number;
  Name: string;
}

interface ChildSubCategory {
  Category_ID: number;
  Sub_Category_ID: number;
  Child_ID: number;
  Name: string;
}

// Form state specifically for adding/editing a product
interface ProductEditForm {
  Product_ID: number | null; // Null for new products, ID for existing
  Child_ID: number; // This will be the actual ID sent to DB
  Name: string;
  Brand: string;
  Description: string;
  Unit: string;
  Quantity: number;
  Sale_Cost: number;
  Sale_Price: number;
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string;
  Dimensions: string; // NEW: Added Dimensions (string for input, null if empty)
  Material: string;   // NEW: Added Material (string for input, null if empty)
  // These are for managing the dropdown selections in the form only
  Selected_Category_ID: number | null;
  Selected_Sub_Category_ID: number | null;
  Selected_Child_ID: number | null;
}

interface FullCategoryPath {
  Category_ID: number;
  Category_Name: string;
  Sub_Category_ID: number;
  Sub_Category_Name: string;
  Child_ID: number;
  Child_Name: string;
}

// --- Mock Data for Categories (as they are usually static and often fetched once or hardcoded) ---
// In a real application, you might fetch these from your API (e.g., /api/admin/categories)
const mockCategories: Category[] = [
  { Category_ID: 1, Name: 'Electronics' },
  { Category_ID: 2, Name: 'Home Appliances' },
  { Category_ID: 3, Name: 'Furniture' },
];

const mockSubCategories: SubCategory[] = [
  { Category_ID: 1, Sub_Category_ID: 101, Name: 'Smartphones' },
  { Category_ID: 1, Sub_Category_ID: 102, Name: 'Laptops' },
  { Category_ID: 2, Sub_Category_ID: 201, Name: 'Kitchen' },
  { Category_ID: 2, Sub_Category_ID: 202, Name: 'Laundry' },
  { Category_ID: 3, Sub_Category_ID: 301, Name: 'Living Room' },
  { Category_ID: 3, Sub_Category_ID: 302, Name: 'Bedroom' },
];

const mockChildSubCategories: ChildSubCategory[] = [
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

// Combine all category data into a single, easy-to-lookup map for full path names
const allCategoriesMap: Map<number, FullCategoryPath> = new Map();
mockCategories.forEach(cat => {
  mockSubCategories.filter(sub => sub.Category_ID === cat.Category_ID).forEach(sub => {
    mockChildSubCategories.filter(child => child.Category_ID === sub.Category_ID && child.Sub_Category_ID === sub.Sub_Category_ID).forEach(child => {
      allCategoriesMap.set(child.Child_ID, {
        Category_ID: cat.Category_ID,
        Category_Name: cat.Name,
        Sub_Category_ID: sub.Sub_Category_ID,
        Sub_Category_Name: sub.Name,
        Child_ID: child.Child_ID,
        Child_Name: child.Name,
      });
    });
  });
});

// --- Helper for Product Stock Status ---
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

const getProductStockStatus = (product: ProductInventory): StockStatus => {
  if (product.Quantity === 0) {
    return 'out_of_stock';
  }
  if (product.Quantity <= product.Reorder_Point) {
    return 'low_stock';
  }
  return 'in_stock';
};

// --- ProductRow Component (for Desktop Table View) ---
interface ProductRowProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
  getFullCategoryName: (childId: number | null) => string;
  openProductModal: (product: ProductInventory, initialMode: 'view' | 'edit') => void;
  deleteProduct: (productId: number) => void;
  getProductStockStatus: (product: ProductInventory) => StockStatus;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  formatPrice,
  getFullCategoryName,
  openProductModal,
  deleteProduct,
  getProductStockStatus,
}) => {
  const stockStatus = getProductStockStatus(product);
  const isOutOfStock = stockStatus === 'out_of_stock';
  const isLowStock = stockStatus === 'low_stock';

  return (
    <tr className="hover cursor-pointer" onClick={() => openProductModal(product, 'view')}>
      <td><div className="font-bold text-primary">{product.Product_ID}</div></td>
      {/* Image */}
      <td>
        <div className="avatar">
          <div className="mask mask-squircle w-12 h-12">
            <img
              src={product.Image_URL || 'https://placehold.co/48x48/EEEEEE/333333?text=No+Image'}
              alt={product.Name}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/48x48/CCCCCC/666666?text=Error'; }}
            />
          </div>
        </div>
      </td>
      <td><div className="font-bold">{product.Name}</div></td>
      <td>{product.Brand}</td>
      <td>{getFullCategoryName(product.Child_ID)}</td>
      {/* Quantity with Status Badges */}
      <td>
        <div className="flex items-center">
          {product.Quantity} {product.Unit}
        </div>
        {isOutOfStock && <span className="badge badge-error badge-xs ml-1">หมด</span>}
        {isLowStock && !isOutOfStock && <span className="badge badge-warning badge-xs ml-1">ใกล้หมด</span>}
      </td>
      {/* Sale Price */}
      <td><div className="font-bold">{formatPrice(product.Sale_Price)}</div></td>
      {/* Visibility Status */}
      <td>
        {product.Visibility ? (
          <span className="badge badge-success">แสดงผล</span>
        ) : (
          <span className="badge badge-neutral">ซ่อน</span>
        )}
      </td>
      {/* Actions */}
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              openProductModal(product, 'view'); // Open in view mode
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              deleteProduct(product.Product_ID);
            }}
            title="ลบ"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- ProductCard Component (for Mobile Grid View) ---
interface ProductCardProps {
  product: ProductInventory;
  formatPrice: (price: number) => string;
  getFullCategoryName: (childId: number | null) => string;
  openProductModal: (product: ProductInventory, initialMode: 'view' | 'edit') => void;
  getProductStockStatus: (product: ProductInventory) => StockStatus;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formatPrice,
  getFullCategoryName,
  openProductModal,
  getProductStockStatus,
}) => {
  const stockStatus = getProductStockStatus(product);
  const isOutOfStock = stockStatus === 'out_of_stock';
  const isLowStock = stockStatus === 'low_stock';

  return (
    // Make the entire card clickable to open the modal in view mode
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => openProductModal(product, 'view')}>
      <div className="card-body p-4">
        <div className="flex items-start gap-4 mb-3">
          {/* Product Image */}
          <div className="avatar">
            <div className="mask mask-squircle w-16 h-16">
              <img
                src={product.Image_URL || 'https://placehold.co/64x64/EEEEEE/333333?text=No+Image'}
                alt={product.Name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/64x64/CCCCCC/666666?text=Error'; }}
              />
            </div>
          </div>
          {/* Product Info */}
          <div className="flex-1">
            <h2 className="card-title text-base">{product.Name}</h2>
            <p className="text-sm text-base-content/70 flex items-center gap-1">
              <FiTag className="w-3 h-3" />
              {product.Brand}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {getFullCategoryName(product.Child_ID)}
            </p>
          </div>
        </div>

        <p className="text-sm mb-1 flex items-center gap-1">
          <FiBox className="w-3 h-3" />
          <strong>จำนวน:</strong>{' '}
          <span className={`font-bold ${isOutOfStock ? 'text-error' : isLowStock ? 'text-warning' : ''}`}>
            {product.Quantity} {product.Unit}
          </span>
          {isOutOfStock && <span className="badge badge-error badge-xs ml-1">หมด</span>}
          {isLowStock && !isOutOfStock && <span className="badge badge-warning badge-xs ml-1">ใกล้หมด</span>}
        </p>
        <p className="text-sm mb-3 flex items-center gap-1">
          <FiDollarSign className="w-3 h-3" />
          <strong>ราคาขาย:</strong> {formatPrice(product.Sale_Price)}
        </p>

        {/* Visibility Status */}
        <p className="text-sm">
          <strong>สถานะ:</strong>{' '}
          {product.Visibility ? (
            <span className="badge badge-success badge-sm ml-1">แสดงผล</span>
          ) : (
            <span className="badge badge-neutral badge-sm ml-1">ซ่อน</span>
          )}
        </p>

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from also triggering
              openProductModal(product, 'view'); // Open in view mode
            }}
          >
            <FiEye className="w-4 h-4" /> ดู
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Product Management Component ---
export default function ProductManagement() {
  // --- States ---
  const [products, setProducts] = useState<ProductInventory[]>([]); // All products fetched from API
  const [filteredProducts, setFilteredProducts] = useState<ProductInventory[]>([]); // Products after applying filters/search
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<number | 'all'>('all');
  const [childCategoryFilter, setChildCategoryFilter] = useState<number | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<boolean | 'all'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | 'all'>('all');

  // Modal & Form States
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null); // Product currently selected for view/edit in modal
  const [showProductModal, setShowProductModal] = useState<boolean>(false); // Controls modal visibility
  const [isEditing, setIsEditing] = useState<boolean>(false); // True if modal is in edit mode, false for view/add

  // This state is used to track the Product_ID when an existing product is being edited
  // It helps differentiate between adding a new product and updating an existing one in saveProductDetails
  const [editingProductId, setEditingProductId] = useState<number | null>(null); 

  const initialFormState: ProductEditForm = useMemo(() => ({
    Product_ID: null,
    Child_ID: mockChildSubCategories[0]?.Child_ID || 0, // Default to first child category
    Name: '',
    Brand: '',
    Description: '',
    Unit: 'Pcs', // Default unit
    Quantity: 0,
    Sale_Cost: 0,
    Sale_Price: 0,
    Reorder_Point: 0,
    Visibility: true,
    Review_Rating: null,
    Image_URL: '',
    Dimensions: '', // NEW: Default for new product
    Material: '',   // NEW: Default for new product
    Selected_Category_ID: null,
    Selected_Sub_Category_ID: null,
    Selected_Child_ID: null,
  }), []);

  const [editFormData, setEditFormData] = useState<ProductEditForm>(initialFormState);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedProducts, setPaginatedProducts] = useState<ProductInventory[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // API Loading, Error, and Message Display States
  const [loading, setLoading] = useState<boolean>(true); // Initial loading state for fetching products
  const [error, setError] = useState<string | null>(null); // For general page errors (e.g., failed initial fetch)
  const [message, setMessage] = useState<string | null>(null); // For success/error messages from API actions (add/update/delete)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null); // Type of message

  // --- API Interaction Functions ---

  // Function to fetch all products from the backend API
  const fetchProducts = async () => {
    setLoading(true); // Set loading true before fetch
    setError(null);    // Clear any previous error
    try {
      const response = await fetch('/api/admin/products'); // Your API endpoint
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch products.');
      }
      const data = await response.json();
      setProducts(data.products || []); // Update products state with fetched data
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'An error occurred while fetching products.'); // Set error state
    } finally {
      setLoading(false); // Set loading false after fetch completes
    }
  };

  // Function to save product details (add new or update existing)
  const saveProductDetails = async () => {
    setMessage(null); // Clear previous messages
    setMessageType(null);

    // Basic client-side validation
    // Ensure all required fields from schema are present and valid
    if (!editFormData.Name || !editFormData.Brand || !editFormData.Unit || 
        editFormData.Child_ID === null || editFormData.Sale_Cost === null || 
        editFormData.Sale_Price === null || editFormData.Reorder_Point === null || 
        editFormData.Quantity === null || editFormData.Sale_Price <= 0) {
      
      // In a real app, replace alert with a custom modal/notification system
      alert('กรุณากรอกข้อมูลสินค้า (ชื่อ, แบรนด์, หน่วย, ราคาขาย, ต้นทุน, ราคาขาย, จุดสั่งซื้อซ้ำ, จำนวน) และเลือกหมวดหมู่ย่อยให้ครบถ้วน. ราคาขายต้องมากกว่า 0.'); 
      setMessage('Validation Error: Required fields are missing or invalid.');
      setMessageType('error');
      return;
    }

    // Prepare payload for API, ensuring nullable fields are explicitly null if empty string
    const productPayload: Omit<ProductInventory, 'Product_ID'> & { Product_ID?: number | null } = {
        Child_ID: editFormData.Child_ID,
        Name: editFormData.Name,
        Brand: editFormData.Brand === '' ? null : editFormData.Brand, // Brand can be null in schema
        Description: editFormData.Description === '' ? null : editFormData.Description,
        Unit: editFormData.Unit,
        Quantity: editFormData.Quantity,
        Sale_Cost: editFormData.Sale_Cost,
        Sale_Price: editFormData.Sale_Price,
        Reorder_Point: editFormData.Reorder_Point,
        Visibility: editFormData.Visibility,
        Review_Rating: editFormData.Review_Rating,
        Image_URL: editFormData.Image_URL === '' ? null : editFormData.Image_URL,
        Dimensions: editFormData.Dimensions === '' ? null : editFormData.Dimensions, // NEW: Include Dimensions
        Material: editFormData.Material === '' ? null : editFormData.Material,       // NEW: Include Material
    };

    let apiResponse;
    try {
        if (isEditing && editFormData.Product_ID !== null) {
            // Update existing product (PATCH request)
            apiResponse = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productPayload, Product_ID: editFormData.Product_ID }), // Include ID for update
            });
        } else {
            // Add new product (POST request)
            apiResponse = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });
        }

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            // Handle API errors (e.g., 400 Bad Request, 409 Conflict, 500 Internal Server Error)
            throw new Error(result.message || apiResponse.statusText || 'API request failed.');
        }

        setMessage(result.message || (isEditing ? 'Product updated successfully!' : 'Product added successfully!'));
        setMessageType('success');
        
        // Reset form to initial state, clear editing status, close modal, and refresh product list
        setEditFormData(initialFormState);
        setEditingProductId(null); // Clear editing state
        setShowProductModal(false);
        fetchProducts(); // Re-fetch all products to get the latest data including new IDs

    } catch (err: any) {
        console.error('Error submitting product details:', err);
        setMessage(err.message || 'An error occurred during product submission.');
        setMessageType('error');
    }
  };

  // Function to delete a product by its ID
  const handleDelete = async (productId: number) => {
    // In a real app, replace confirm with a custom modal for better UX
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า Product ID: ${productId}?`)) { 
      return;
    }

    setMessage(null);
    setMessageType(null);
    try {
        const response = await fetch(`/api/admin/products?id=${productId}`, {
            method: 'DELETE',
        });

        const result = await response.json(); // Always parse response, even on error, for message

        if (!response.ok) {
            throw new Error(result.message || response.statusText || 'API request failed.');
        }

        setMessage(result.message || 'Product deleted successfully!');
        setMessageType('success');
        setShowProductModal(false); // Close modal if the deleted product was being viewed
        fetchProducts(); // Re-fetch products after deletion

    } catch (err: any) {
        console.error('Error deleting product:', err);
        setMessage(err.message || 'An error occurred during deletion.');
        setMessageType('error');
    }
  };


  // --- UI Interaction Functions ---

  // Function to open the product modal in view or edit mode
  const openProductModal = (product: ProductInventory | null, initialMode: 'view' | 'edit') => {
    if (product) {
      setSelectedProduct(product); // Set the product being viewed/edited
      const fullCat = allCategoriesMap.get(product.Child_ID);
      // Populate form data based on selected product for editing
      setEditFormData({
        Product_ID: product.Product_ID,
        Child_ID: product.Child_ID,
        Name: product.Name,
        Brand: product.Brand,
        Description: product.Description || '', // Convert null to empty string for form inputs
        Unit: product.Unit,
        Quantity: product.Quantity,
        Sale_Cost: product.Sale_Cost,
        Sale_Price: product.Sale_Price,
        Reorder_Point: product.Reorder_Point,
        Visibility: product.Visibility,
        Review_Rating: product.Review_Rating,
        Image_URL: product.Image_URL || '', // Convert null to empty string for form inputs
        Dimensions: product.Dimensions || '', // NEW: Populate Dimensions
        Material: product.Material || '',     // NEW: Populate Material
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    } else {
      // For adding new product, reset form to initial state and clear selected product
      setEditFormData(initialFormState);
      setSelectedProduct(null);
    }
    setIsEditing(initialMode === 'edit'); // Set modal mode
    setEditingProductId(product?.Product_ID || null); // Set editing product ID
    setShowProductModal(true); // Show the modal
  };

  // Toggles between VIEW and EDIT mode within the modal
  const toggleEditMode = () => {
    // If currently in view mode and switching to edit, populate form from selectedProduct
    if (!isEditing && selectedProduct) {
      const fullCat = allCategoriesMap.get(selectedProduct.Child_ID);
      setEditFormData({
        Product_ID: selectedProduct.Product_ID,
        Child_ID: selectedProduct.Child_ID,
        Name: selectedProduct.Name,
        Brand: selectedProduct.Brand,
        Description: selectedProduct.Description || '',
        Unit: selectedProduct.Unit,
        Quantity: selectedProduct.Quantity,
        Sale_Cost: selectedProduct.Sale_Cost,
        Sale_Price: selectedProduct.Sale_Price,
        Reorder_Point: selectedProduct.Reorder_Point,
        Visibility: selectedProduct.Visibility,
        Review_Rating: selectedProduct.Review_Rating,
        Image_URL: selectedProduct.Image_URL || '',
        Dimensions: selectedProduct.Dimensions || '', // NEW: Populate Dimensions
        Material: selectedProduct.Material || '',     // NEW: Populate Material
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    }
    // If currently in edit mode and canceling back to view, reset editFormData to original selectedProduct values
    if (isEditing && selectedProduct) {
      const fullCat = allCategoriesMap.get(selectedProduct.Child_ID);
      setEditFormData({
        Product_ID: selectedProduct.Product_ID,
        Child_ID: selectedProduct.Child_ID,
        Name: selectedProduct.Name,
        Brand: selectedProduct.Brand,
        Description: selectedProduct.Description || '',
        Unit: selectedProduct.Unit,
        Quantity: selectedProduct.Quantity,
        Sale_Cost: selectedProduct.Sale_Cost,
        Sale_Price: selectedProduct.Sale_Price,
        Reorder_Point: selectedProduct.Reorder_Point,
        Visibility: selectedProduct.Visibility,
        Review_Rating: selectedProduct.Review_Rating,
        Image_URL: selectedProduct.Image_URL || '',
        Dimensions: selectedProduct.Dimensions || '', // NEW: Populate Dimensions
        Material: selectedProduct.Material || '',     // NEW: Populate Material
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    }
    setIsEditing(prev => !prev);
    setMessage(null); // Clear messages when toggling mode
    setMessageType(null);
  };

  // Handles click on "Add New Product" button, opens modal directly in edit mode for new product
  const handleAddProductClick = () => {
    openProductModal(null, 'edit');
  };

  // --- Form Change Handler ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;

    setEditFormData(prev => {
      const newState = { ...prev };

      if (type === 'checkbox') {
        newState[name as keyof ProductEditForm] = checked as any;
      } else if (['Quantity', 'Sale_Cost', 'Sale_Price', 'Reorder_Point', 'Review_Rating', 'Selected_Category_ID', 'Selected_Sub_Category_ID', 'Selected_Child_ID'].includes(name)) {
        // For numeric inputs, convert to Number. If empty string, treat as null.
        newState[name as keyof ProductEditForm] = value === '' ? null : Number(value) as any;
      } else {
        newState[name as keyof ProductEditForm] = value as any;
      }

      // Logic for updating category dropdowns and syncing Child_ID for payload
      if (name === 'Selected_Category_ID') {
        const categoryId = Number(value);
        const firstSubCatInNewCategory = mockSubCategories.find(sub => sub.Category_ID === categoryId);
        const firstChildCatInNewSubCat = firstSubCatInNewCategory ? mockChildSubCategories.find(child => child.Sub_Category_ID === firstSubCatInNewCategory.Sub_Category_ID) : null;
        newState.Selected_Category_ID = categoryId;
        newState.Selected_Sub_Category_ID = firstSubCatInNewCategory?.Sub_Category_ID || null;
        newState.Selected_Child_ID = firstChildCatInNewSubCat?.Child_ID || null;
        newState.Child_ID = firstChildCatInNewSubCat?.Child_ID || 0; // Update actual Child_ID for payload
      } else if (name === 'Selected_Sub_Category_ID') {
        const subCategoryId = Number(value);
        const firstChildCatInNewSubCat = mockChildSubCategories.find(child => child.Sub_Category_ID === subCategoryId);
        newState.Selected_Sub_Category_ID = subCategoryId;
        newState.Selected_Child_ID = firstChildCatInNewSubCat?.Child_ID || null;
        newState.Child_ID = firstChildCatInNewSubCat?.Child_ID || 0; // Update actual Child_ID for payload
      } else if (name === 'Selected_Child_ID') {
        const childId = Number(value);
        newState.Selected_Child_ID = childId;
        newState.Child_ID = childId; // Update actual Child_ID for payload
      }
      return newState;
    });
  };

  // --- Pagination Handlers ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // --- Helper Functions (Memoized for performance) ---
  const formatPrice = useMemo(() => (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  }, []);

  const getFullCategoryName = useMemo(() => (childId: number | null): string => {
    if (childId === null) return 'N/A';
    const categoryPath = allCategoriesMap.get(childId);
    if (!categoryPath) return 'Uncategorized';
    return `${categoryPath.Category_Name} > ${categoryPath.Sub_Category_Name} > ${categoryPath.Child_Name}`;
  }, []);

  // --- Product Statistics Calculation (Memoized for performance) ---
  interface ProductStats {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    visible: number;
    hidden: number;
  }

  const getProductStats = useMemo((): ProductStats => {
    const stats: ProductStats = {
      total: products.length,
      inStock: products.filter(p => getProductStockStatus(p) === 'in_stock').length,
      lowStock: products.filter(p => getProductStockStatus(p) === 'low_stock').length,
      outOfStock: products.filter(p => getProductStockStatus(p) === 'out_of_stock').length,
      visible: products.filter(p => p.Visibility).length,
      hidden: products.filter(p => !p.Visibility).length,
    };
    return stats;
  }, [products]); // Recalculate if products change

  const stats: ProductStats = getProductStats; // Use the memoized value

  // Get unique brands for filter dropdown (Memoized)
  const uniqueBrands = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.Brand)))], [products]);

  // Get filtered sub-categories based on selected main category (Memoized)
  const filteredSubCategories = useMemo(() => 
    editFormData.Selected_Category_ID
      ? mockSubCategories.filter(sub => sub.Category_ID === editFormData.Selected_Category_ID)
      : [], 
    [editFormData.Selected_Category_ID]
  );

  // Get filtered child sub-categories based on selected sub-category (Memoized)
  const filteredChildSubCategories = useMemo(() => 
    editFormData.Selected_Sub_Category_ID
      ? mockChildSubCategories.filter(child => child.Sub_Category_ID === editFormData.Selected_Sub_Category_ID)
      : [], 
    [editFormData.Selected_Sub_Category_ID]
  );

  // --- useEffect Hooks ---

  // Effect for applying filters and search, and resetting pagination
  useEffect(() => {
    let filtered: ProductInventory[] = products;

    // Search by Name, Description, Brand, Product ID
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.Description && product.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.Brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.Product_ID.toString().includes(searchTerm)
      );
    }

    // Filter by Brand
    if (brandFilter !== 'all') {
      filtered = filtered.filter(product => product.Brand === brandFilter);
    }

    // Filter by Category Hierarchy
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        const fullCat = allCategoriesMap.get(product.Child_ID);
        return fullCat && fullCat.Category_ID === categoryFilter;
      });
    }

    if (subCategoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        const fullCat = allCategoriesMap.get(product.Child_ID);
        return fullCat && fullCat.Sub_Category_ID === subCategoryFilter;
      });
    }

    if (childCategoryFilter !== 'all') {
      filtered = filtered.filter(product => product.Child_ID === childCategoryFilter);
    }

    // Filter by Visibility
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(product => product.Visibility === visibilityFilter);
    }

    // Filter by Stock Status
    if (stockStatusFilter !== 'all') {
      filtered = filtered.filter(product => getProductStockStatus(product) === stockStatusFilter);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [searchTerm, brandFilter, categoryFilter, subCategoryFilter, childCategoryFilter, visibilityFilter, stockStatusFilter, products]);

  // Effect for pagination logic
  useEffect(() => {
    const startIndex: number = (currentPage - 1) * itemsPerPage;
    const endIndex: number = startIndex + itemsPerPage;
    const paginated: ProductInventory[] = filteredProducts.slice(startIndex, endIndex);

    setPaginatedProducts(paginated);
    setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchProducts();
  }, []); // Empty dependency array means this runs once on mount

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">จัดการสินค้า</h1>
              <p className="text-base-content/70 mt-1">จัดการและติดตามสินค้าทั้งหมดในคลัง</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddProductClick}>
                <FiPlus className="w-4 h-4" />
                เพิ่มสินค้าใหม่
              </button>
              <button className="btn btn-outline w-full sm:w-auto">
                <FiDownload className="w-4 h-4" />
                ส่งออกข้อมูล
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral/10 rounded-lg">
                <FiBox className="w-5 h-5 text-neutral" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">ในสต็อก</p>
                <p className="text-2xl font-bold">{stats.inStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">สินค้าใกล้หมด</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">สินค้าหมดแล้ว</p>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
              </div>
            </div>
          </div>


          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <FiEye className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">สินค้าที่แสดง</p>
                <p className="text-2xl font-bold">{stats.visible}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row flex-wrap gap-4">
            <div className="flex-1/3 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, แบรนด์, รหัสสินค้า..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="all">ทุกแบรนด์</option>
                {uniqueBrands.filter(brand => brand !== 'all').map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(Number(e.target.value))}
              >
                <option value="all">ทุกหมวดหมู่หลัก</option>
                {mockCategories.map(cat => (
                  <option key={`cat-${cat.Category_ID}`} value={cat.Category_ID}>{cat.Name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(Number(e.target.value))}
                disabled={categoryFilter === 'all'}
              >
                <option value="all">ทุกหมวดหมู่ย่อย</option>
                {filteredSubCategories.map(sub => (
                  <option key={`sub-${sub.Sub_Category_ID}`} value={sub.Sub_Category_ID}>{sub.Name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={childCategoryFilter}
                onChange={(e) => setChildCategoryFilter(Number(e.target.value))}
                disabled={subCategoryFilter === 'all'}
              >
                <option value="all">ทุกหมวดหมู่ย่อยย่อย</option>
                {filteredChildSubCategories.map(child => (
                  <option key={`child-${child.Child_ID}`} value={child.Child_ID}>{child.Name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value === 'true' ? true : e.target.value === 'false' ? false : 'all')}
              >
                <option value="all">สถานะการแสดงผลทั้งหมด</option>
                <option value="true">แสดงผล</option>
                <option value="false">ซ่อน</option>
              </select>
            </div>
            {/* Stock Status Filter */}
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as StockStatus | 'all')}
              >
                <option value="all">สถานะสต็อกทั้งหมด</option>
                <option value="in_stock">ในสต็อก</option>
                <option value="low_stock">สินค้าใกล้หมด</option>
                <option value="out_of_stock">สินค้าหมดแล้ว</option>
              </select>
            </div>
            <div className="w-full sm:w-auto flex-grow md:w-40">
              <select
                className="select select-bordered w-full"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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

        {/* Display Loading/Error states */}
        {loading && (
            <div className="flex justify-center items-center h-48 bg-base-100 rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="ml-4 text-lg text-base-content/70">กำลังโหลดสินค้า...</p>
            </div>
        )}
        {error && (
            <div className="text-center p-6 bg-error/10 text-error rounded-lg shadow-md max-w-xl mx-auto my-8">
                <p className="font-bold text-xl mb-2">เกิดข้อผิดพลาด!</p>
                <p>{error}</p>
            </div>
        )}
        
        {/* Products Table - Desktop View */}
        {!loading && !error && (
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>รหัสสินค้า</th>
                  <th>รูป</th>
                  <th>ชื่อสินค้า</th>
                  <th>แบรนด์</th>
                  <th>หมวดหมู่</th>
                  <th>จำนวน</th>
                  <th>ราคาขาย</th>
                  <th>สถานะการแสดงผล</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product: ProductInventory) => (
                  <ProductRow
                    key={product.Product_ID}
                    product={product}
                    formatPrice={formatPrice}
                    getFullCategoryName={getFullCategoryName}
                    openProductModal={openProductModal}
                    deleteProduct={handleDelete}
                    getProductStockStatus={getProductStockStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Products List - Mobile View */}
        {!loading && !error && (
        <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {paginatedProducts.map((product: ProductInventory) => (
                <ProductCard
                  key={product.Product_ID}
                  product={product}
                  formatPrice={formatPrice}
                  getFullCategoryName={getFullCategoryName}
                  openProductModal={openProductModal}
                  getProductStockStatus={getProductStockStatus}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiBox className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>
        )}

        {/* No products found message - only show if not loading and no error, and filters result in no products */}
        {!loading && !error && paginatedProducts.length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <FiBox className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}


        {/* Pagination Section */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-base-100 rounded-b-lg shadow-sm mt-4">
            <div className="text-sm text-base-content/70">
              แสดงรายการ {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredProducts.length)} จากทั้งหมด {filteredProducts.length} รายการ
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

        {/* Add/Edit Product Modal */}
        {showProductModal && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
              <h3 className="font-bold text-lg mb-4">
                {isEditing ? `แก้ไขสินค้า ID: ${editFormData.Product_ID || ''}` : `รายละเอียดสินค้า ID: ${selectedProduct?.Product_ID || ''}`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Details (Display/Edit) */}
                <div>
                  <h4 className="font-semibold mb-2">ข้อมูลสินค้า</h4>
                  <div className="bg-base-200 rounded-lg p-4">
                    {/* Image Preview / Input */}
                    <div className="mb-4 text-center">
                      <label className="label">
                        <span className="label-text">รูปภาพสินค้า</span>
                      </label>
                      <img
                        src={editFormData.Image_URL || 'https://placehold.co/150x150/EEEEEE/333333?text=No+Image'}
                        alt="Product Image"
                        className="w-48 h-48 object-contain rounded-lg mx-auto border border-base-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/150x150/CCCCCC/666666?text=Image+Error';
                        }}
                      />
                      {isEditing && (
                        <div className="form-control mt-2">
                          <label className="label"><span className="label-text">URL รูปภาพ</span></label>
                          <input
                            type="text"
                            name="Image_URL"
                            placeholder="http://example.com/image.jpg"
                            className="input input-bordered w-full"
                            value={editFormData.Image_URL}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">ชื่อสินค้า</span></label>
                          <input type="text" name="Name" className="input input-bordered w-full" value={editFormData.Name} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">แบรนด์</span></label>
                          <input type="text" name="Brand" className="input input-bordered w-full" value={editFormData.Brand} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">รายละเอียด</span></label>
                          <textarea name="Description" className="textarea textarea-bordered w-full h-24" value={editFormData.Description} onChange={handleFormChange}></textarea>
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">หน่วย</span></label>
                          <input type="text" name="Unit" className="input input-bordered w-full" value={editFormData.Unit} onChange={handleFormChange} />
                        </div>
                         {/* NEW: Dimensions Input */}
                         <div className="form-control mb-2">
                          <label className="label"><span className="label-text">ขนาด (Dimensions)</span></label>
                          <input type="text" name="Dimensions" className="input input-bordered w-full" value={editFormData.Dimensions} onChange={handleFormChange} />
                        </div>
                        {/* NEW: Material Input */}
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">วัสดุ (Material)</span></label>
                          <input type="text" name="Material" className="input input-bordered w-full" value={editFormData.Material} onChange={handleFormChange} />
                        </div>
                      </>
                    ) : (
                      selectedProduct && (
                        <>
                          <p><strong>ชื่อสินค้า:</strong> {selectedProduct.Name}</p>
                          <p><strong>แบรนด์:</strong> {selectedProduct.Brand || '-'}</p>
                          <p><strong>รายละเอียด:</strong> {selectedProduct.Description || '-'}</p>
                          <p><strong>หน่วย:</strong> {selectedProduct.Unit}</p>
                          <p><strong>ขนาด:</strong> {selectedProduct.Dimensions || '-'}</p> {/* NEW: Display Dimensions */}
                          <p><strong>วัสดุ:</strong> {selectedProduct.Material || '-'}</p>     {/* NEW: Display Material */}
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Inventory & Category Information */}
                <div>
                  <h4 className="font-semibold mb-2">ข้อมูลคลังและหมวดหมู่</h4>
                  <div className="bg-base-200 rounded-lg p-4">
                    {isEditing ? (
                      <>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">จำนวน</span></label>
                          <input type="number" name="Quantity" className="input input-bordered w-full" value={editFormData.Quantity} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">ต้นทุนขาย</span></label>
                          <input type="number" name="Sale_Cost" className="input input-bordered w-full" value={editFormData.Sale_Cost} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">ราคาขาย</span></label>
                          <input type="number" name="Sale_Price" className="input input-bordered w-full" value={editFormData.Sale_Price} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">จุดสั่งซื้อซ้ำ</span></label>
                          <input type="number" name="Reorder_Point" className="input input-bordered w-full" value={editFormData.Reorder_Point} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">คะแนนรีวิว (1-5)</span></label>
                          <input type="number" name="Review_Rating" className="input input-bordered w-full" min="1" max="5" value={editFormData.Review_Rating || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-control mb-2">
                          <label className="label cursor-pointer">
                            <span className="label-text">แสดงผลบนเว็บไซต์</span>
                            <input type="checkbox" name="Visibility" className="checkbox" checked={editFormData.Visibility} onChange={handleFormChange} />
                          </label>
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">หมวดหมู่หลัก</span></label>
                          <select
                            name="Selected_Category_ID"
                            className="select select-bordered w-full"
                            value={editFormData.Selected_Category_ID || ''}
                            onChange={handleFormChange}
                          >
                            <option value="">เลือกหมวดหมู่หลัก</option>
                            {mockCategories.map(cat => (
                              <option key={`cat-select-${cat.Category_ID}`} value={cat.Category_ID}>{cat.Name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">หมวดหมู่ย่อย</span></label>
                          <select
                            name="Selected_Sub_Category_ID"
                            className="select select-bordered w-full"
                            value={editFormData.Selected_Sub_Category_ID || ''}
                            onChange={handleFormChange}
                            disabled={!editFormData.Selected_Category_ID}
                          >
                            <option value="">เลือกหมวดหมู่ย่อย</option>
                            {filteredSubCategories.map(sub => (
                              <option key={`sub-select-${sub.Sub_Category_ID}`} value={sub.Sub_Category_ID}>{sub.Name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-control mb-2">
                          <label className="label"><span className="label-text">หมวดหมู่ย่อยย่อย</span></label>
                          <select
                            name="Selected_Child_ID"
                            className="select select-bordered w-full"
                            value={editFormData.Selected_Child_ID || ''}
                            onChange={handleFormChange}
                            disabled={!editFormData.Selected_Sub_Category_ID}
                          >
                            <option value="">เลือกหมวดหมู่ย่อยย่อย</option>
                            {filteredChildSubCategories.map(child => (
                              <option key={`child-select-${child.Child_ID}`} value={child.Child_ID}>{child.Name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      selectedProduct && (
                        <>
                          <p><strong>จำนวน:</strong> {selectedProduct.Quantity} {selectedProduct.Unit}</p>
                          <p><strong>ต้นทุนขาย:</strong> {formatPrice(selectedProduct.Sale_Cost)}</p>
                          <p><strong>ราคาขาย:</strong> {formatPrice(selectedProduct.Sale_Price)}</p>
                          <p><strong>จุดสั่งซื้อซ้ำ:</strong> {selectedProduct.Reorder_Point}</p>
                          <p><strong>คะแนนรีวิว:</strong> {selectedProduct.Review_Rating || '-'}</p>
                          <p><strong>สถานะการแสดงผล:</strong> {selectedProduct.Visibility ? 'แสดงผล' : 'ซ่อน'}</p>
                          <p><strong>หมวดหมู่:</strong> {getFullCategoryName(selectedProduct.Child_ID)}</p>
                          <div className="mt-4">
                            <p className="font-semibold">สถานะสต็อก:</p>
                            <span className={`badge ${getProductStockStatus(selectedProduct) === 'in_stock' ? 'badge-success' : getProductStockStatus(selectedProduct) === 'low_stock' ? 'badge-warning' : 'badge-error'} badge-lg`}>
                              {getProductStockStatus(selectedProduct) === 'in_stock' && <FiCheckCircle className="w-4 h-4 mr-1" />}
                              {getProductStockStatus(selectedProduct) === 'low_stock' && <FiAlertTriangle className="w-4 h-4 mr-1" />}
                              {getProductStockStatus(selectedProduct) === 'out_of_stock' && <FiAlertCircle className="w-4 h-4 mr-1" />}
                              {getProductStockStatus(selectedProduct) === 'in_stock' ? 'ในสต็อก' : getProductStockStatus(selectedProduct) === 'low_stock' ? 'ใกล้หมด' : 'หมดแล้ว'}
                            </span>
                          </div>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-action flex-col sm:flex-row mt-6">
                {isEditing ? (
                  <>
                    <button className="btn btn-ghost w-full sm:w-auto" onClick={toggleEditMode}>
                      <FiX className="w-4 h-4" /> ยกเลิก
                    </button>
                    <button className="btn btn-primary w-full sm:w-auto" onClick={saveProductDetails}>
                      <FiSave className="w-4 h-4" /> บันทึก
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn w-full sm:w-auto" onClick={() => setShowProductModal(false)}>
                      <FiX className="w-4 h-4" /> ปิด
                    </button>
                    {selectedProduct && ( // Show edit button only if a product is selected (not for "add new" initial state)
                      <button className="btn btn-primary w-full sm:w-auto" onClick={toggleEditMode}>
                        <FiEdit className="w-4 h-4" /> แก้ไข
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
