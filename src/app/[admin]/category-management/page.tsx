'use client'; // This component will run on the client side

import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiX,
  FiSave,
  FiTag // Using FiTag for category icon
} from 'react-icons/fi';

// --- Type Definitions (Centralized for all categories) ---
interface Category { // Main Category
  Category_ID: number;
  Name: string;
}

interface SubCategory { // Sub Category
  Category_ID: number; // Foreign Key to Category
  Sub_Category_ID: number;
  Name: string;
}

interface ChildSubCategory { // Child Sub Category
  Category_ID: number;
  Sub_Category_ID: number; // Foreign Key to SubCategory
  Child_ID: number;
  Name: string;
}

// Unified interface for displaying any type of category in the UI
interface CategoryDisplayItem {
  id: number;
  name: string;
  type: 'main' | 'sub' | 'child';
  parentId: number | null; // Category_ID for sub, Sub_Category_ID for child
  parentName?: string; // For display purposes in UI
  fullPathName?: string; // e.g., "Electronics > Smartphones > iPhones"
}

// Form state specifically for adding/editing any type of category
interface CategoryEditForm {
  id: number | null; // Category_ID, Sub_Category_ID, or Child_ID
  name: string;
  type: 'main' | 'sub' | 'child';
  parentId: number | null; // Actual parent ID to be sent (Category_ID or Sub_Category_ID)
  
  // For managing dropdown selections in the form
  selectedMainCategory: number | null;
  selectedSubCategory: number | null;
}

// --- Mock Data (as we don't have APIs for sub/child categories yet) ---
const mockCategories: Category[] = [
  { Category_ID: 1, Name: 'Electronics' },
  { Category_ID: 2, Name: 'Home Appliances' },
  { Category_ID: 3, Name: 'Furniture' },
  { Category_ID: 4, Name: 'Books' },
];

const mockSubCategories: SubCategory[] = [
  { Category_ID: 1, Sub_Category_ID: 101, Name: 'Smartphones' },
  { Category_ID: 1, Sub_Category_ID: 102, Name: 'Laptops' },
  { Category_ID: 2, Sub_Category_ID: 201, Name: 'Kitchen' },
  { Category_ID: 2, Sub_Category_ID: 202, Name: 'Laundry' },
  { Category_ID: 3, Sub_Category_ID: 301, Name: 'Living Room' },
];

const mockChildSubCategories: ChildSubCategory[] = [
  { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1001, Name: 'Android Phones' },
  { Category_ID: 1, Sub_Category_ID: 101, Child_ID: 1002, Name: 'iPhones' },
  { Category_ID: 1, Sub_Category_ID: 102, Child_ID: 1003, Name: 'Gaming Laptops' },
  { Category_ID: 2, Sub_Category_ID: 201, Child_ID: 2001, Name: 'Blenders' },
  { Category_ID: 3, Sub_Category_ID: 301, Child_ID: 3001, Name: 'Sofas' },
];

// --- Helper Functions for Category Hierarchy ---
const getCategoryFullPath = (item: CategoryDisplayItem, allCats: Category[], allSubCats: SubCategory[], allChildCats: ChildSubCategory[]): string => {
  let path = item.name;
  if (item.type === 'sub') {
    const parentCat = allCats.find(c => c.Category_ID === item.parentId);
    if (parentCat) path = `${parentCat.Name} > ${path}`;
  } else if (item.type === 'child') {
    const parentSub = allSubCats.find(sc => sc.Sub_Category_ID === item.parentId);
    if (parentSub) {
      const parentCat = allCats.find(c => c.Category_ID === parentSub.Category_ID);
      if (parentCat) path = `${parentCat.Name} > ${parentSub.Name} > ${path}`;
      else path = `${parentSub.Name} > ${path}`; // Fallback if main category not found
    }
  }
  return path;
};

const getParentNameForDisplay = (item: CategoryDisplayItem, allCats: Category[], allSubCats: SubCategory[]): string => {
    if (item.type === 'sub') {
        const parentCat = allCats.find(c => c.Category_ID === item.parentId);
        return parentCat ? parentCat.Name : '-';
    } else if (item.type === 'child') {
        const parentSub = allSubCats.find(sc => sc.Sub_Category_ID === item.parentId);
        return parentSub ? parentSub.Name : '-';
    }
    return '-'; // Main categories have no parent
};

// --- CategoryRow Component (for Desktop Table View) ---
interface CategoryRowProps {
  category: CategoryDisplayItem;
  openCategoryModal: (category: CategoryDisplayItem, initialMode: 'view' | 'edit') => void;
  deleteCategory: (category: CategoryDisplayItem) => void;
  allCategories: Category[];
  allSubCategories: SubCategory[];
  allChildSubCategories: ChildSubCategory[];
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, openCategoryModal, deleteCategory, allCategories, allSubCategories }) => {
  return (
    <tr className="hover cursor-pointer" onClick={() => openCategoryModal(category, 'view')}>
      <td><div className="font-bold text-primary">{category.id}</div></td>
      <td><div className="font-bold">{category.name}</div></td>
      <td>{
        category.type === 'main' ? 'หมวดหมู่หลัก' :
        category.type === 'sub' ? 'หมวดหมู่ย่อย' :
        'หมวดหมู่ย่อยย่อย'
      }</td>
      <td>{getParentNameForDisplay(category, allCategories, allSubCategories)}</td>
      <td>
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-ghost btn-square"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              openCategoryModal(category, 'view'); // Open in view mode
            }}
            title="ดูรายละเอียด"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-square text-error"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click from also triggering
              deleteCategory(category);
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

// --- CategoryCard Component (for Mobile Grid View) ---
interface CategoryCardProps {
  category: CategoryDisplayItem;
  openCategoryModal: (category: CategoryDisplayItem, initialMode: 'view' | 'edit') => void;
  allCategories: Category[];
  allSubCategories: SubCategory[];
  allChildSubCategories: ChildSubCategory[];
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, openCategoryModal, allCategories, allSubCategories }) => {
  return (
    <div className="card bg-base-200 shadow-sm cursor-pointer" onClick={() => openCategoryModal(category, 'view')}>
      <div className="card-body p-4">
        <div className="flex items-start gap-4 mb-3">
          {/* Category Icon */}
          <div className="p-2 bg-neutral/10 rounded-lg">
            <FiTag className="w-6 h-6 text-neutral" />
          </div>
          {/* Category Info */}
          <div className="flex-1">
            <h2 className="card-title text-base">{category.name}</h2>
            <p className="text-sm text-base-content/70">
              รหัส: {category.id}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              ระดับ: {
                category.type === 'main' ? 'หมวดหมู่หลัก' :
                category.type === 'sub' ? 'หมวดหมู่ย่อย' :
                'หมวดหมู่ย่อยย่อย'
              }
            </p>
            {category.parentId !== null && (
                <p className="text-xs text-base-content/60 mt-1">
                    หมวดหมู่แม่: {getParentNameForDisplay(category, allCategories, allSubCategories)}
                </p>
            )}
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-sm btn-outline"
            onClick={(e) => {
              e.stopPropagation();
              openCategoryModal(category, 'view');
            }}
          >
            <FiEye className="w-4 h-4" /> ดู
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Category Management Component ---
export default function CategoryManagement() {
  // --- States ---
  const [allCategoriesRaw, setAllCategoriesRaw] = useState<Category[]>([]); // Raw main categories
  const [allSubCategoriesRaw, setAllSubCategoriesRaw] = useState<SubCategory[]>([]); // Raw sub categories
  const [allChildSubCategoriesRaw, setAllChildSubCategoriesRaw] = useState<ChildSubCategory[]>([]); // Raw child sub categories

  const [allCategoryDisplayItems, setAllCategoryDisplayItems] = useState<CategoryDisplayItem[]>([]); // Combined and mapped for display
  const [filteredCategoryDisplayItems, setFilteredCategoryDisplayItems] = useState<CategoryDisplayItem[]>([]); // After search/filter
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'all' | 'main' | 'sub' | 'child'>('all');
  const [parentMainCategoryFilter, setParentMainCategoryFilter] = useState<number | 'all'>('all');
  const [parentSubCategoryFilter, setParentSubCategoryFilter] = useState<number | 'all'>('all');

  // Modal & Form States
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<CategoryDisplayItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const initialFormState: CategoryEditForm = useMemo(() => ({
    id: null,
    name: '',
    type: 'main', // Default to main category for new additions
    parentId: null,
    selectedMainCategory: null,
    selectedSubCategory: null,
  }), []);

  const [editFormData, setEditFormData] = useState<CategoryEditForm>(initialFormState);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedCategoryDisplayItems, setPaginatedCategoryDisplayItems] = useState<CategoryDisplayItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);

  // API Loading, Error, and Message Display States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // --- API Interaction Functions (Using Mock for Sub/Child categories for now) ---

  // Function to fetch all categories (main, sub, child)
  const fetchAllCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Main Categories (using the existing API route)
      const mainCatResponse = await fetch('/api/admin/categories');
      if (!mainCatResponse.ok) {
        throw new Error(`Failed to fetch main categories: ${mainCatResponse.statusText}`);
      }
      const mainCatData = await mainCatResponse.json();
      setAllCategoriesRaw(mainCatData.categories || []);

      // Mock fetching Sub Categories (replace with actual API call when created)
      const mockSubCatFetch = () => new Promise<SubCategory[]>(resolve => setTimeout(() => resolve(mockSubCategories), 200));
      const subCatData = await mockSubCatFetch();
      setAllSubCategoriesRaw(subCatData || []);

      // Mock fetching Child Sub Categories (replace with actual API call when created)
      const mockChildSubCatFetch = () => new Promise<ChildSubCategory[]>(resolve => setTimeout(() => resolve(mockChildSubCategories), 200));
      const childSubCatData = await mockChildSubCatFetch();
      setAllChildSubCategoriesRaw(childSubCatData || []);

    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'An error occurred while fetching categories.');
    } finally {
      setLoading(false);
    }
  };

  // Function to save category details (add new or update existing for any type)
  const saveCategoryDetails = async () => {
    setMessage(null);
    setMessageType(null);

    // Basic client-side validation
    if (!editFormData.name || editFormData.name.trim() === '') {
      alert('กรุณากรอกชื่อหมวดหมู่');
      setMessage('Validation Error: Category name is required.');
      setMessageType('error');
      return;
    }

    if (editFormData.type !== 'main' && editFormData.parentId === null) {
      alert('กรุณาเลือกหมวดหมู่แม่สำหรับหมวดหมู่ย่อยและย่อยย่อย');
      setMessage('Validation Error: Parent category is required for sub/child categories.');
      setMessageType('error');
      return;
    }

    let apiEndpoint = '';
    let payload: any = {}; // Payload structure depends on category type

    if (editFormData.type === 'main') {
      apiEndpoint = '/api/admin/categories';
      payload = { Name: editFormData.name.trim() };
      if (editFormData.id) payload.Category_ID = editFormData.id;
    } else if (editFormData.type === 'sub') {
      apiEndpoint = `/api/admin/sub-categories`; // Placeholder - You'll create this API
      payload = {
        Category_ID: editFormData.parentId,
        Name: editFormData.name.trim()
      };
      if (editFormData.id) payload.Sub_Category_ID = editFormData.id;
    } else if (editFormData.type === 'child') {
      apiEndpoint = `/api/admin/child-sub-categories`; // Placeholder - You'll create this API
      payload = {
        Sub_Category_ID: editFormData.parentId,
        Name: editFormData.name.trim()
      };
      if (editFormData.id) payload.Child_ID = editFormData.id;
    }

    let method = editFormData.id ? 'PATCH' : 'POST';

    try {
      // In a real application, you'd handle specific API calls here
      // For now, we'll just simulate success and re-fetch mock data
      const response = await fetch(apiEndpoint, { // This will hit the /api/admin/categories for main
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || response.statusText || 'API request failed.');
      }

      setMessage(result.message || (editFormData.id ? 'Category updated successfully!' : 'Category added successfully!'));
      setMessageType('success');
      
      setEditFormData(initialFormState);
      setShowCategoryModal(false);
      fetchAllCategories(); // Re-fetch all categories to update UI
    } catch (err: any) {
        console.error('Error submitting category details:', err);
        setMessage(err.message || 'An error occurred during category submission.');
        setMessageType('error');
    }
  };

  // Function to delete a category by its ID and type
  const deleteCategory = async (categoryToDelete: CategoryDisplayItem) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ ${categoryToDelete.name} (ID: ${categoryToDelete.id})?`)) {
      return;
    }

    setMessage(null);
    setMessageType(null);
    let apiEndpoint = '';

    if (categoryToDelete.type === 'main') {
      apiEndpoint = `/api/admin/admin/categories?id=${categoryToDelete.id}`;
    } else if (categoryToDelete.type === 'sub') {
      apiEndpoint = `/api/admin/sub-categories?id=${categoryToDelete.id}`; // Placeholder - You'll create this API
    } else if (categoryToDelete.type === 'child') {
      apiEndpoint = `/api/admin/child-sub-categories?id=${categoryToDelete.id}`; // Placeholder - You'll create this API
    }

    try {
      // In a real application, you'd handle specific API calls here
      const response = await fetch(apiEndpoint, { // This will hit the /api/admin/categories for main
          method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.message || response.statusText || 'API request failed.');
      }

      setMessage(result.message || 'Category deleted successfully!');
      setMessageType('success');
      setShowCategoryModal(false);
      fetchAllCategories(); // Re-fetch categories after deletion
    } catch (err: any) {
        console.error('Error deleting category:', err);
        setMessage(err.message || 'An error occurred during deletion.');
        setMessageType('error');
    }
  };

  // --- UI Interaction Functions ---

  const openCategoryModal = (category: CategoryDisplayItem | null, initialMode: 'view' | 'edit') => {
    if (category) {
      setSelectedCategoryItem(category);
      // Populate form data based on selected category type
      let selectedMain = null;
      let selectedSub = null;

      if (category.type === 'sub') {
        selectedMain = category.parentId;
      } else if (category.type === 'child') {
        const parentSubCat = allSubCategoriesRaw.find(sc => sc.Sub_Category_ID === category.parentId);
        selectedSub = category.parentId;
        if (parentSubCat) {
          selectedMain = parentSubCat.Category_ID;
        }
      }

      setEditFormData({
        id: category.id,
        name: category.name,
        type: category.type,
        parentId: category.parentId,
        selectedMainCategory: selectedMain,
        selectedSubCategory: selectedSub,
      });
    } else {
      // For adding new category, reset form to initial state
      setEditFormData(initialFormState);
      setSelectedCategoryItem(null);
    }
    setIsEditing(initialMode === 'edit');
    setShowCategoryModal(true);
    setMessage(null);
    setMessageType(null);
  };

  const toggleEditMode = () => {
    // Logic to re-populate form from selectedCategoryItem if switching from view to edit
    if (!isEditing && selectedCategoryItem) {
      let selectedMain = null;
      let selectedSub = null;

      if (selectedCategoryItem.type === 'sub') {
        selectedMain = selectedCategoryItem.parentId;
      } else if (selectedCategoryItem.type === 'child') {
        const parentSubCat = allSubCategoriesRaw.find(sc => sc.Sub_Category_ID === selectedCategoryItem.parentId);
        selectedSub = selectedCategoryItem.parentId;
        if (parentSubCat) {
          selectedMain = parentSubCat.Category_ID;
        }
      }

      setEditFormData({
        id: selectedCategoryItem.id,
        name: selectedCategoryItem.name,
        type: selectedCategoryItem.type,
        parentId: selectedCategoryItem.parentId,
        selectedMainCategory: selectedMain,
        selectedSubCategory: selectedSub,
      });
    }
    // If canceling edit mode, revert form data to current selectedCategoryItem state
    if (isEditing && selectedCategoryItem) {
        setEditFormData({
            id: selectedCategoryItem.id,
            name: selectedCategoryItem.name,
            type: selectedCategoryItem.type,
            parentId: selectedCategoryItem.parentId,
            selectedMainCategory: selectedCategoryItem.type === 'sub' ? selectedCategoryItem.parentId : (selectedCategoryItem.type === 'child' ? allSubCategoriesRaw.find(sc => sc.Sub_Category_ID === selectedCategoryItem.parentId)?.Category_ID : null),
            selectedSubCategory: selectedCategoryItem.type === 'child' ? selectedCategoryItem.parentId : null,
        });
    }
    setIsEditing(prev => !prev);
    setMessage(null);
    setMessageType(null);
  };

  const handleAddCategoryClick = () => {
    openCategoryModal(null, 'edit');
  };

  // --- Form Change Handler ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setEditFormData(prev => {
      const newState = { ...prev };

      if (name === 'name') {
        newState.name = value;
      } else if (name === 'type') {
        newState.type = value as 'main' | 'sub' | 'child';
        newState.parentId = null; // Reset parent when type changes
        newState.selectedMainCategory = null;
        newState.selectedSubCategory = null;
      } else if (name === 'selectedMainCategory') {
        const mainCatId = Number(value);
        newState.selectedMainCategory = mainCatId;
        // If type is sub, parentId is the selectedMainCategory
        if (newState.type === 'sub') {
            newState.parentId = mainCatId;
        }
        newState.selectedSubCategory = null; // Reset sub-category
      } else if (name === 'selectedSubCategory') {
        const subCatId = Number(value);
        newState.selectedSubCategory = subCatId;
        // If type is child, parentId is the selectedSubCategory
        if (newState.type === 'child') {
            newState.parentId = subCatId;
        }
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
    setCurrentPage(1); // Reset to first page
  };

  // --- Category Statistics (Memoized) ---
  interface CategoryStats {
    total: number;
    mainCount: number;
    subCount: number;
    childCount: number;
  }

  const getCategoryStats = useMemo((): CategoryStats => {
    return {
      total: allCategoryDisplayItems.length,
      mainCount: allCategoryDisplayItems.filter(item => item.type === 'main').length,
      subCount: allCategoryDisplayItems.filter(item => item.type === 'sub').length,
      childCount: allCategoryDisplayItems.filter(item => item.type === 'child').length,
    };
  }, [allCategoryDisplayItems]);

  const stats: CategoryStats = getCategoryStats;

  // --- Memoized Filtered Dropdown Options for Modal ---
  const availableSubCategories = useMemo(() => {
    if (editFormData.selectedMainCategory === null) return [];
    return allSubCategoriesRaw.filter(sub => sub.Category_ID === editFormData.selectedMainCategory);
  }, [editFormData.selectedMainCategory, allSubCategoriesRaw]);

  // --- useEffect Hooks ---

  // Effect to combine raw data into display items whenever raw data changes
  useEffect(() => {
    const combinedItems: CategoryDisplayItem[] = [];

    // Add main categories
    allCategoriesRaw.forEach(cat => {
      combinedItems.push({
        id: cat.Category_ID,
        name: cat.Name,
        type: 'main',
        parentId: null,
        fullPathName: cat.Name,
      });
    });

    // Add sub categories
    allSubCategoriesRaw.forEach(sub => {
      combinedItems.push({
        id: sub.Sub_Category_ID,
        name: sub.Name,
        type: 'sub',
        parentId: sub.Category_ID,
        fullPathName: getCategoryFullPath({ id: sub.Sub_Category_ID, name: sub.Name, type: 'sub', parentId: sub.Category_ID }, allCategoriesRaw, allSubCategoriesRaw, allChildSubCategoriesRaw),
      });
    });

    // Add child sub categories
    allChildSubCategoriesRaw.forEach(child => {
      combinedItems.push({
        id: child.Child_ID,
        name: child.Name,
        type: 'child',
        parentId: child.Sub_Category_ID,
        fullPathName: getCategoryFullPath({ id: child.Child_ID, name: child.Name, type: 'child', parentId: child.Sub_Category_ID }, allCategoriesRaw, allSubCategoriesRaw, allChildSubCategoriesRaw),
      });
    });

    setAllCategoryDisplayItems(combinedItems);
  }, [allCategoriesRaw, allSubCategoriesRaw, allChildSubCategoriesRaw]);


  // Effect for applying filters and search, and resetting pagination
  useEffect(() => {
    let filtered: CategoryDisplayItem[] = allCategoryDisplayItems;

    // Search by Name or ID or Full Path
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toString().includes(searchTerm) ||
        (item.fullPathName && item.fullPathName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by Category Type
    if (categoryTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === categoryTypeFilter);
    }

    // Filter by Parent Main Category
    if (parentMainCategoryFilter !== 'all') {
        filtered = filtered.filter(item => {
            if (item.type === 'sub' && item.parentId === parentMainCategoryFilter) {
                return true;
            }
            if (item.type === 'child') {
                const parentSub = allSubCategoriesRaw.find(sub => sub.Sub_Category_ID === item.parentId);
                return parentSub && parentSub.Category_ID === parentMainCategoryFilter;
            }
            return false; // Main categories don't have parents
        });
    }

    // Filter by Parent Sub Category
    if (parentSubCategoryFilter !== 'all') {
        filtered = filtered.filter(item => item.type === 'child' && item.parentId === parentSubCategoryFilter);
    }

    setFilteredCategoryDisplayItems(filtered);
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [searchTerm, categoryTypeFilter, parentMainCategoryFilter, parentSubCategoryFilter, allCategoryDisplayItems, allSubCategoriesRaw]);

  // Effect for pagination logic
  useEffect(() => {
    const startIndex: number = (currentPage - 1) * itemsPerPage;
    const endIndex: number = startIndex + itemsPerPage;
    const paginated: CategoryDisplayItem[] = filteredCategoryDisplayItems.slice(startIndex, endIndex);

    setPaginatedCategoryDisplayItems(paginated);
    setTotalPages(Math.ceil(filteredCategoryDisplayItems.length / itemsPerPage));
  }, [filteredCategoryDisplayItems, currentPage, itemsPerPage]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchAllCategories();
  }, []); // Empty dependency array means this runs once on mount

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">จัดการหมวดหมู่สินค้า</h1>
              <p className="text-base-content/70 mt-1">จัดการและติดตามหมวดหมู่สินค้าทั้งหมด (หลัก, ย่อย, ย่อยย่อย)</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddCategoryClick}>
                <FiPlus className="w-4 h-4" />
                เพิ่มหมวดหมู่ใหม่
              </button>
              <button className="btn btn-outline w-full sm:w-auto">
                <FiDownload className="w-4 h-4" />
                ส่งออกข้อมูล
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral/10 rounded-lg">
                <FiTag className="w-5 h-5 text-neutral" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">หมวดหมู่ทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FiTag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">หมวดหมู่หลัก</p>
                <p className="text-2xl font-bold">{stats.mainCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <FiTag className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">หมวดหมู่ย่อย</p>
                <p className="text-2xl font-bold">{stats.subCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-base-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FiTag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-base-content/70">หมวดหมู่ย่อยย่อย</p>
                <p className="text-2xl font-bold">{stats.childCount}</p>
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
                  placeholder="ค้นหาด้วยชื่อ, รหัสหมวดหมู่..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            {/* Filter by Category Type */}
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={categoryTypeFilter}
                onChange={(e) => setCategoryTypeFilter(e.target.value as 'all' | 'main' | 'sub' | 'child')}
              >
                <option value="all">ทุกระดับหมวดหมู่</option>
                <option value="main">หมวดหมู่หลัก</option>
                <option value="sub">หมวดหมู่ย่อย</option>
                <option value="child">หมวดหมู่ย่อยย่อย</option>
              </select>
            </div>
            {/* Filter by Parent Main Category */}
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={parentMainCategoryFilter}
                onChange={(e) => setParentMainCategoryFilter(Number(e.target.value))}
                disabled={categoryTypeFilter === 'main'} // Disable if filtering for only main categories
              >
                <option value="all">ทุกหมวดหมู่หลักแม่</option>
                {allCategoriesRaw.map(cat => (
                  <option key={`filter-main-${cat.Category_ID}`} value={cat.Category_ID}>{cat.Name}</option>
                ))}
              </select>
            </div>
            {/* Filter by Parent Sub Category */}
            <div className="w-full sm:w-auto flex-grow">
              <select
                className="select select-bordered w-full"
                value={parentSubCategoryFilter}
                onChange={(e) => setParentSubCategoryFilter(Number(e.target.value))}
                disabled={categoryTypeFilter !== 'child' && parentMainCategoryFilter === 'all'} // Only enable if filtering for child or main is selected
              >
                <option value="all">ทุกหมวดหมู่ย่อยแม่</option>
                {allSubCategoriesRaw
                    .filter(sub => parentMainCategoryFilter === 'all' || sub.Category_ID === parentMainCategoryFilter)
                    .map(sub => (
                    <option key={`filter-sub-${sub.Sub_Category_ID}`} value={sub.Sub_Category_ID}>{sub.Name}</option>
                ))}
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
                <p className="ml-4 text-lg text-base-content/70">กำลังโหลดหมวดหมู่...</p>
            </div>
        )}
        {error && (
            <div className="text-center p-6 bg-error/10 text-error rounded-lg shadow-md max-w-xl mx-auto my-8">
                <p className="font-bold text-xl mb-2">เกิดข้อผิดพลาด!</p>
                <p>{error}</p>
            </div>
        )}
        
        {/* Categories Table - Desktop View */}
        {!loading && !error && (
        <div className="hidden md:block bg-base-100 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>รหัสหมวดหมู่</th>
                  <th>ชื่อหมวดหมู่</th>
                  <th>ระดับ</th>
                  <th>หมวดหมู่แม่</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategoryDisplayItems.map((category: CategoryDisplayItem) => (
                  <CategoryRow
                    key={`${category.type}-${category.id}`} // Unique key
                    category={category}
                    openCategoryModal={openCategoryModal}
                    deleteCategory={deleteCategory}
                    allCategories={allCategoriesRaw}
                    allSubCategories={allSubCategoriesRaw}
                    allChildSubCategories={allChildSubCategoriesRaw} // Passed for full path (if needed)
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Categories List - Mobile View */}
        {!loading && !error && (
        <div className="block md:hidden bg-base-100 rounded-lg shadow-sm p-4">
          {paginatedCategoryDisplayItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {paginatedCategoryDisplayItems.map((category: CategoryDisplayItem) => (
                <CategoryCard
                  key={`${category.type}-${category.id}`} // Unique key
                  category={category}
                  openCategoryModal={openCategoryModal}
                  allCategories={allCategoriesRaw}
                  allSubCategories={allSubCategoriesRaw}
                  allChildSubCategories={allChildSubCategoriesRaw} // Passed for full path (if needed)
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiTag className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70">ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>
        )}

        {/* No categories found message - only show if not loading and no error, and filters result in no categories */}
        {!loading && !error && paginatedCategoryDisplayItems.length === 0 && filteredCategoryDisplayItems.length === 0 && (
          <div className="text-center py-12">
            <FiTag className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70">ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}


        {/* Pagination Section */}
        {!loading && !error && filteredCategoryDisplayItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-base-100 rounded-b-lg shadow-sm mt-4">
            <div className="text-sm text-base-content/70">
              แสดงรายการ {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredCategoryDisplayItems.length)} จากทั้งหมด {filteredCategoryDisplayItems.length} รายการ
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

        {/* Add/Edit Category Modal */}
        {showCategoryModal && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-2xl">
              <h3 className="font-bold text-lg mb-4">
                {isEditing ? `แก้ไขหมวดหมู่ ID: ${editFormData.id || ''}` : `รายละเอียดหมวดหมู่ ID: ${selectedCategoryItem?.id || ''}`}
              </h3>
              <div className="bg-base-200 rounded-lg p-4">
                {isEditing ? (
                  <>
                    <div className="form-control mb-2">
                      <label className="label"><span className="label-text">ชื่อหมวดหมู่</span></label>
                      <input
                        type="text"
                        name="name"
                        className="input input-bordered w-full"
                        value={editFormData.name}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="form-control mb-2">
                      <label className="label"><span className="label-text">ระดับหมวดหมู่</span></label>
                      <select
                        name="type"
                        className="select select-bordered w-full"
                        value={editFormData.type}
                        onChange={handleFormChange}
                        disabled={editFormData.id !== null} // Disable type change if editing existing category
                      >
                        <option value="main">หมวดหมู่หลัก</option>
                        <option value="sub">หมวดหมู่ย่อย</option>
                        <option value="child">หมวดหมู่ย่อยย่อย</option>
                      </select>
                    </div>

                    {(editFormData.type === 'sub' || editFormData.type === 'child') && (
                      <div className="form-control mb-2">
                        <label className="label"><span className="label-text">หมวดหมู่หลักแม่</span></label>
                        <select
                          name="selectedMainCategory"
                          className="select select-bordered w-full"
                          value={editFormData.selectedMainCategory || ''}
                          onChange={handleFormChange}
                        >
                          <option value="">เลือกหมวดหมู่หลัก</option>
                          {allCategoriesRaw.map(cat => (
                            <option key={`modal-main-${cat.Category_ID}`} value={cat.Category_ID}>{cat.Name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editFormData.type === 'child' && (
                      <div className="form-control mb-2">
                        <label className="label"><span className="label-text">หมวดหมู่ย่อยแม่</span></label>
                        <select
                          name="selectedSubCategory"
                          className="select select-bordered w-full"
                          value={editFormData.selectedSubCategory || ''}
                          onChange={handleFormChange}
                          disabled={!editFormData.selectedMainCategory}
                        >
                          <option value="">เลือกหมวดหมู่ย่อย</option>
                          {availableSubCategories.map(sub => (
                            <option key={`modal-sub-${sub.Sub_Category_ID}`} value={sub.Sub_Category_ID}>{sub.Name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  selectedCategoryItem && (
                    <>
                      <p><strong>รหัสหมวดหมู่:</strong> {selectedCategoryItem.id}</p>
                      <p><strong>ชื่อหมวดหมู่:</strong> {selectedCategoryItem.name}</p>
                      <p><strong>ระดับ:</strong> {
                        selectedCategoryItem.type === 'main' ? 'หมวดหมู่หลัก' :
                        selectedCategoryItem.type === 'sub' ? 'หมวดหมู่ย่อย' :
                        'หมวดหมู่ย่อยย่อย'
                      }</p>
                      {selectedCategoryItem.parentId !== null && (
                        <p><strong>หมวดหมู่แม่:</strong> {getParentNameForDisplay(selectedCategoryItem, allCategoriesRaw, allSubCategoriesRaw)}</p>
                      )}
                      {selectedCategoryItem.fullPathName && (
                        <p><strong>Full Path:</strong> {selectedCategoryItem.fullPathName}</p>
                      )}
                    </>
                  )
                )}
              </div>

              <div className="modal-action flex-col sm:flex-row mt-6">
                {isEditing ? (
                  <>
                    <button className="btn btn-ghost w-full sm:w-auto" onClick={toggleEditMode}>
                      <FiX className="w-4 h-4" /> ยกเลิก
                    </button>
                    <button className="btn btn-primary w-full sm:w-auto" onClick={saveCategoryDetails}>
                      <FiSave className="w-4 h-4" /> บันทึก
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn w-full sm:w-auto" onClick={() => setShowCategoryModal(false)}>
                      <FiX className="w-4 h-4" /> ปิด
                    </button>
                    {selectedCategoryItem && (
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
