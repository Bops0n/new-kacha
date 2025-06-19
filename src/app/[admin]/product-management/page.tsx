'use client'; // Client Component for interactivity

import { useState, useEffect } from 'react';
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
  FiAlertTriangle, // New: Icon for low stock
  FiAlertCircle,   // New: Icon for out of stock
  FiCheckCircle    // New: Icon for in stock (already there, but confirm usage)
} from 'react-icons/fi';

import {
  ProductInventory,
  Category,
  SubCategory,
  ChildSubCategory,
  ProductEditForm,
  FullCategoryPath
} from '../../../types';

import ProductRow from './ProductRow';
import ProductCard from './ProductCard';

// --- Mock Data for Products and Categories ---
// In a real app, this would come from an API/database
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

const mockProducts: ProductInventory[] = [
  {
    Product_ID: 1, Child_ID: 1001, Name: 'Samsung Galaxy S23', Brand: 'Samsung', Description: 'Latest Android flagship phone',
    Unit: 'Pcs', Quantity: 50, Sale_Cost: 20000, Sale_Price: 25000, Reorder_Point: 10, Visibility: true,
    Review_Rating: 5, Image_URL: 'https://via.placeholder.com/150x150/FFDAB9/000000?text=S23',
  },
  {
    Product_ID: 2, Child_ID: 1003, Name: 'Acer Predator Helios 300', Brand: 'Acer', Description: 'High-performance gaming laptop',
    Unit: 'Pcs', Quantity: 15, Sale_Cost: 35000, Sale_Price: 42000, Reorder_Point: 5, Visibility: true, // Quantity (15) > Reorder_Point (5) -> In Stock
    Review_Rating: 4, Image_URL: 'https://via.placeholder.com/150x150/B0E0E6/000000?text=Helios300',
  },
  {
    Product_ID: 3, Child_ID: 3001, Name: 'Modern Fabric Sofa', Brand: 'IKEA', Description: 'Comfortable 3-seater sofa for living room',
    Unit: 'Pcs', Quantity: 2, Sale_Cost: 8000, Sale_Price: 12000, Reorder_Point: 2, Visibility: true, // Quantity (2) <= Reorder_Point (2) -> Low Stock
    Review_Rating: 4, Image_URL: 'https://via.placeholder.com/150x150/D8BFD8/000000?text=Sofa',
  },
  {
    Product_ID: 4, Child_ID: 2001, Name: 'Philips Blender HR2118', Brand: 'Philips', Description: 'Powerful blender for smoothies and more',
    Unit: 'Pcs', Quantity: 0, Sale_Cost: 1500, Sale_Price: 2200, Reorder_Point: 10, Visibility: false, // Quantity (0) -> Out of Stock
    Review_Rating: 3, Image_URL: 'https://via.placeholder.com/150x150/FFD700/000000?text=Blender',
  },
  {
    Product_ID: 5, Child_ID: 3004, Name: 'Wooden Wardrobe', Brand: 'HomePro', Description: 'Spacious wardrobe with sliding doors',
    Unit: 'Pcs', Quantity: 7, Sale_Cost: 9000, Sale_Price: 15000, Reorder_Point: 3, Visibility: true,
    Review_Rating: 5, Image_URL: 'https://via.placeholder.com/150x150/A2DAA2/000000?text=Wardrobe',
  },
  {
    Product_ID: 6, Child_ID: 1002, Name: 'iPhone 15 Pro Max', Brand: 'Apple', Description: 'Apple\'s top-tier smartphone',
    Unit: 'Pcs', Quantity: 8, Sale_Cost: 38000, Sale_Price: 45000, Reorder_Point: 8, Visibility: true, // Quantity (8) <= Reorder_Point (8) -> Low Stock
    Review_Rating: 5, Image_URL: 'https://via.placeholder.com/150x150/C0C0C0/000000?text=iPhone15',
  },
  {
    Product_ID: 7, Child_ID: 1004, Name: 'Dell XPS 15', Brand: 'Dell', Description: 'Premium ultrabook for professionals',
    Unit: 'Pcs', Quantity: 10, Sale_Cost: 40000, Sale_Price: 48000, Reorder_Point: 4, Visibility: true,
    Review_Rating: 4, Image_URL: 'https://placehold.co/150x150/F8F8FF/000000?text=DellXPS',
  },
  {
    Product_ID: 8, Child_ID: 2002, Name: 'Panasonic Microwave NN-ST25JW', Brand: 'Panasonic', Description: 'Compact and efficient microwave oven',
    Unit: 'Pcs', Quantity: 0, Sale_Cost: 2000, Sale_Price: 2800, Reorder_Point: 7, Visibility: true, // Quantity (0) -> Out of Stock
    Review_Rating: 4, Image_URL: 'https://placehold.co/150x150/E0FFFF/000000?text=Microwave',
  },
  {
    Product_ID: 9, Child_ID: 3002, Name: 'Glass Coffee Table', Brand: 'Chic Home', Description: 'Sleek design with tempered glass top',
    Unit: 'Pcs', Quantity: 8, Sale_Cost: 3000, Sale_Price: 4500, Reorder_Point: 2, Visibility: true,
    Review_Rating: 3, Image_URL: 'https://placehold.co/150x150/F5DEB3/000000?text=CoffeeTable',
  },
  {
    Product_ID: 10, Child_ID: 3003, Name: 'Queen Size Bed Frame', Brand: 'SleepWell', Description: 'Sturdy wooden bed frame',
    Unit: 'Pcs', Quantity: 6, Sale_Cost: 7000, Sale_Price: 10000, Reorder_Point: 2, Visibility: true,
    Review_Rating: 4, Image_URL: 'https://placehold.co/150x150/FFC0CB/000000?text=BedFrame',
  },
];

// Combine all category data into a single, easy-to-lookup map
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

// --- Helper to get Product Stock Status ---
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

// --- Main Product Management Component ---
export default function ProductManagement() {
  const [products, setProducts] = useState<ProductInventory[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<ProductInventory[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<number | 'all'>('all');
  const [childCategoryFilter, setChildCategoryFilter] = useState<number | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<boolean | 'all'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | 'all'>('all'); // New: Stock status filter

  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // True for edit mode, false for add new or view

  const [editFormData, setEditFormData] = useState<ProductEditForm>({
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
    Selected_Category_ID: null,
    Selected_Sub_Category_ID: null,
    Selected_Child_ID: null,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedProducts, setPaginatedProducts] = useState<ProductInventory[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // --- Filter Logic ---
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

    // New: Filter by Stock Status
    if (stockStatusFilter !== 'all') {
      filtered = filtered.filter(product => getProductStockStatus(product) === stockStatusFilter);
    }


    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, brandFilter, categoryFilter, subCategoryFilter, childCategoryFilter, visibilityFilter, stockStatusFilter, products]); // Add stockStatusFilter to dependencies

  // --- Pagination Logic ---
  useEffect(() => {
    const startIndex: number = (currentPage - 1) * itemsPerPage;
    const endIndex: number = startIndex + itemsPerPage;
    const paginated: ProductInventory[] = filteredProducts.slice(startIndex, endIndex);

    setPaginatedProducts(paginated);
    setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // --- Product Actions ---

  // Function to open modal in a specific mode (view or edit)
  const openProductModal = (product: ProductInventory | null, initialMode: 'view' | 'edit') => {
    if (product) {
      // Set selected product and populate form data for editing
      setSelectedProduct(product);
      const fullCat = allCategoriesMap.get(product.Child_ID);
      setEditFormData({
        Product_ID: product.Product_ID,
        Child_ID: product.Child_ID,
        Name: product.Name,
        Brand: product.Brand,
        Description: product.Description || '',
        Unit: product.Unit,
        Quantity: product.Quantity,
        Sale_Cost: product.Sale_Cost,
        Sale_Price: product.Sale_Price,
        Reorder_Point: product.Reorder_Point,
        Visibility: product.Visibility,
        Review_Rating: product.Review_Rating,
        Image_URL: product.Image_URL || '',
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    } else {
      // For adding new product, reset form and clear selected product
      setEditFormData({
        Product_ID: null,
        Child_ID: mockChildSubCategories[0]?.Child_ID || 0,
        Name: '',
        Brand: '',
        Description: '',
        Unit: 'Pcs',
        Quantity: 0,
        Sale_Cost: 0,
        Sale_Price: 0,
        Reorder_Point: 0,
        Visibility: true,
        Review_Rating: null,
        Image_URL: '',
        Selected_Category_ID: mockCategories[0]?.Category_ID || null,
        Selected_Sub_Category_ID: mockSubCategories.find(sub => sub.Category_ID === mockCategories[0]?.Category_ID)?.Sub_Category_ID || null,
        Selected_Child_ID: mockChildSubCategories.find(child => child.Sub_Category_ID === mockSubCategories.find(sub => sub.Category_ID === mockCategories[0]?.Category_ID)?.Sub_Category_ID)?.Child_ID || null,
      });
      setSelectedProduct(null);
    }
    setIsEditing(initialMode === 'edit');
    setShowProductModal(true);
  };


  // Toggles between VIEW and EDIT mode within the modal
  const toggleEditMode = () => {
    // If switching from view to edit, ensure editFormData is up-to-date with selectedProduct
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
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    }
    // If switching from edit to view (via cancel), reset editFormData to original selectedProduct values
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
        Selected_Category_ID: fullCat?.Category_ID || null,
        Selected_Sub_Category_ID: fullCat?.Sub_Category_ID || null,
        Selected_Child_ID: fullCat?.Child_ID || null,
      });
    }
    setIsEditing(prev => !prev);
  };

  // Handles adding a new product, opens modal directly in ADD/EDIT mode
  const handleAddProductClick = () => {
    openProductModal(null, 'edit'); // Open for new product, directly in edit mode
  };

  const saveProductDetails = () => {
    if (!editFormData.Name || !editFormData.Brand || !editFormData.Unit || editFormData.Selected_Child_ID === null) {
      alert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วนและเลือกหมวดหมู่ย่อย'); // Use custom modal in real app
      return;
    }

    const newOrUpdatedProduct: ProductInventory = {
      Product_ID: isEditing && editFormData.Product_ID !== null ? editFormData.Product_ID : Date.now(), // Use existing ID or generate new for mock
      Child_ID: editFormData.Selected_Child_ID,
      Name: editFormData.Name,
      Brand: editFormData.Brand,
      Description: editFormData.Description,
      Unit: editFormData.Unit,
      Quantity: editFormData.Quantity,
      Sale_Cost: editFormData.Sale_Cost,
      Sale_Price: editFormData.Sale_Price,
      Reorder_Point: editFormData.Reorder_Point,
      Visibility: editFormData.Visibility,
      Review_Rating: editFormData.Review_Rating,
      Image_URL: editFormData.Image_URL || null,
    };

    if (isEditing && editFormData.Product_ID !== null) {
      // Update existing product
      setProducts(prev => prev.map(p =>
        p.Product_ID === newOrUpdatedProduct.Product_ID ? newOrUpdatedProduct : p
      ));
      setSelectedProduct(newOrUpdatedProduct); // Update selectedProduct to reflect changes
    } else {
      // Add new product
      setProducts(prev => [...prev, newOrUpdatedProduct]);
    }
    setIsEditing(false); // Switch back to view mode after saving
  };

  const deleteProduct = (productId: number) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า Product ID: ${productId}?`)) {
      setProducts(prev => prev.filter(p => p.Product_ID !== productId));
      setShowProductModal(false); // Close modal if the deleted product was being viewed
    }
  };

  // --- Form Change Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;

    setEditFormData(prev => {
      const newState = { ...prev };

      if (type === 'checkbox') {
        newState[name as keyof ProductEditForm] = checked as any; // Cast for boolean
      } else if (['Quantity', 'Sale_Cost', 'Sale_Price', 'Reorder_Point', 'Review_Rating', 'Selected_Category_ID', 'Selected_Sub_Category_ID', 'Selected_Child_ID'].includes(name)) {
        newState[name as keyof ProductEditForm] = value === '' ? null : Number(value) as any;
      } else {
        newState[name as keyof ProductEditForm] = value as any;
      }

      if (name === 'Selected_Category_ID') {
        const categoryId = Number(value);
        const firstSubCatInNewCategory = mockSubCategories.find(sub => sub.Category_ID === categoryId);
        const firstChildCatInNewSubCat = firstSubCatInNewCategory ? mockChildSubCategories.find(child => child.Sub_Category_ID === firstSubCatInNewCategory.Sub_Category_ID) : null;
        newState.Selected_Category_ID = categoryId;
        newState.Selected_Sub_Category_ID = firstSubCatInNewCategory?.Sub_Category_ID || null;
        newState.Selected_Child_ID = firstChildCatInNewSubCat?.Child_ID || null;
        newState.Child_ID = firstChildCatInNewSubCat?.Child_ID || 0;
      } else if (name === 'Selected_Sub_Category_ID') {
        const subCategoryId = Number(value);
        const firstChildCatInNewSubCat = mockChildSubCategories.find(child => child.Sub_Category_ID === subCategoryId);
        newState.Selected_Sub_Category_ID = subCategoryId;
        newState.Selected_Child_ID = firstChildCatInNewSubCat?.Child_ID || null;
        newState.Child_ID = firstChildCatInNewSubCat?.Child_ID || 0;
      } else if (name === 'Selected_Child_ID') {
        const childId = Number(value);
        newState.Selected_Child_ID = childId;
        newState.Child_ID = childId;
      }
      return newState;
    });
  };

  // --- Helper Functions ---
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const getFullCategoryName = (childId: number | null): string => {
    if (childId === null) return 'N/A';
    const categoryPath = allCategoriesMap.get(childId);
    if (!categoryPath) return 'Uncategorized';
    return `${categoryPath.Category_Name} > ${categoryPath.Sub_Category_Name} > ${categoryPath.Child_Name}`;
  };

  // --- Stats Calculation ---
  interface ProductStats {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number; // New stat
    visible: number;
    hidden: number;
  }

  const getProductStats = (): ProductStats => {
    const stats: ProductStats = {
      total: products.length,
      inStock: products.filter(p => getProductStockStatus(p) === 'in_stock').length,
      lowStock: products.filter(p => getProductStockStatus(p) === 'low_stock').length,
      outOfStock: products.filter(p => getProductStockStatus(p) === 'out_of_stock').length, // New stat
      visible: products.filter(p => p.Visibility).length,
      hidden: products.filter(p => !p.Visibility).length,
    };
    return stats;
  };

  const stats: ProductStats = getProductStats();

  // Get unique brands for filter dropdown
  const uniqueBrands = ['all', ...Array.from(new Set(products.map(p => p.Brand)))];

  // Get filtered sub-categories based on selected main category
  const filteredSubCategories = editFormData.Selected_Category_ID
    ? mockSubCategories.filter(sub => sub.Category_ID === editFormData.Selected_Category_ID)
    : [];

  // Get filtered child sub-categories based on selected sub-category
  const filteredChildSubCategories = editFormData.Selected_Sub_Category_ID
    ? mockChildSubCategories.filter(child => child.Sub_Category_ID === editFormData.Selected_Sub_Category_ID)
    : [];

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
                <FiAlertTriangle className="w-5 h-5 text-warning" /> {/* Changed icon to FiAlertTriangle */}
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
                <FiAlertCircle className="w-5 h-5 text-error" /> {/* Changed icon to FiAlertCircle */}
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
              <div className="flex flex-row">
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, แบรนด์, รหัสสินค้า..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute z left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
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
                {mockSubCategories.filter(sub => categoryFilter === 'all' || sub.Category_ID === categoryFilter).map(sub => (
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
                {mockChildSubCategories.filter(child => subCategoryFilter === 'all' || child.Sub_Category_ID === subCategoryFilter).map(child => (
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
            {/* New: Stock Status Filter */}
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

        {/* Products Table - Desktop View */}
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
                    deleteProduct={deleteProduct}
                    getProductStockStatus={getProductStockStatus} // Pass helper function
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products List - Mobile View */}
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
                  getProductStockStatus={getProductStockStatus} // Pass helper function
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

        {/* No products found message */}
        {paginatedProducts.length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <FiBox className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}


        {/* Pagination Section */}
        {filteredProducts.length > 0 && (
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

                  if (startPage > 1) {
                    pages.push(
                      <button key={1} className="btn btn-sm" onClick={() => handlePageChange(1)}>1</button>
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
                      </>
                    ) : (
                      selectedProduct && (
                        <>
                          <p><strong>ชื่อสินค้า:</strong> {selectedProduct.Name}</p>
                          <p><strong>แบรนด์:</strong> {selectedProduct.Brand}</p>
                          <p><strong>รายละเอียด:</strong> {selectedProduct.Description || '-'}</p>
                          <p><strong>หน่วย:</strong> {selectedProduct.Unit}</p>
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
