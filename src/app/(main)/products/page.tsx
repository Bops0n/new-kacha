'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import {
  FiTag,
  FiBox,
  FiDollarSign,
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';

import {
  ProductInventory,
  Category,
  SubCategory,
  ChildSubCategory,
  FullCategoryPath
} from '../../../types';

import ProductDisplayCard from '../components/ProductDisplayCard';

// --- Mock Data for Products and Categories ---
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
    Unit: 'Pcs', Quantity: 50, Sale_Cost: 25000, Sale_Price: 22500, Reorder_Point: 10, Visibility: true, // Added discount example
    Review_Rating: 4.5, Image_URL: 'https://via.placeholder.com/400x300/FFDAB9/000000?text=S23',
  },
  {
    Product_ID: 2, Child_ID: 1003, Name: 'Acer Predator Helios 300', Brand: 'Acer', Description: 'High-performance gaming laptop',
    Unit: 'Pcs', Quantity: 15, Sale_Cost: 42000, Sale_Price: 42000, Reorder_Point: 5, Visibility: true,
    Review_Rating: 4, Image_URL: 'https://via.placeholder.com/400x300/B0E0E6/000000?text=Helios300',
  },
  {
    Product_ID: 3, Child_ID: 3001, Name: 'Modern Fabric Sofa', Brand: 'IKEA', Description: 'Comfortable 3-seater sofa for living room',
    Unit: 'Pcs', Quantity: 5, Sale_Cost: 15000, Sale_Price: 12000, Reorder_Point: 2, Visibility: true, // Added discount example
    Review_Rating: 3.8, Image_URL: 'https://via.placeholder.com/400x300/D8BFD8/000000?text=Sofa',
  },
  {
    Product_ID: 4, Child_ID: 2001, Name: 'Philips Blender HR2118', Brand: 'Philips', Description: 'Powerful blender for smoothies and more',
    Unit: 'Pcs', Quantity: 30, Sale_Cost: 2500, Sale_Price: 2200, Reorder_Point: 10, Visibility: true, // Added discount example
    Review_Rating: 4.2, Image_URL: 'https://via.placeholder.co/400x300/FFD700/000000?text=Blender',
  },
  {
    Product_ID: 5, Child_ID: 3004, Name: 'Wooden Wardrobe', Brand: 'HomePro', Description: 'Spacious wardrobe with sliding doors',
    Unit: 'Pcs', Quantity: 7, Sale_Cost: 15000, Sale_Price: 15000, Reorder_Point: 3, Visibility: true,
    Review_Rating: 5, Image_URL: 'https://via.placeholder.co/400x300/A2DAA2/000000?text=Wardrobe',
  },
  {
    Product_ID: 6, Child_ID: 1002, Name: 'iPhone 15 Pro Max', Brand: 'Apple', Description: 'Apple\'s top-tier smartphone',
    Unit: 'Pcs', Quantity: 20, Sale_Cost: 45000, Sale_Price: 43000, Reorder_Point: 8, Visibility: true, // Added discount example
    Review_Rating: 4.9, Image_URL: 'https://via.placeholder.co/400x300/C0C0C0/000000?text=iPhone15',
  },
  {
    Product_ID: 7, Child_ID: 1004, Name: 'Dell XPS 15', Brand: 'Dell', Description: 'Premium ultrabook for professionals',
    Unit: 'Pcs', Quantity: 10, Sale_Cost: 48000, Sale_Price: 48000, Reorder_Point: 4, Visibility: true,
    Review_Rating: 4.7, Image_URL: 'https://placehold.co/400x300/F8F8FF/000000?text=DellXPS',
  },
  {
    Product_ID: 8, Child_ID: 2002, Name: 'Panasonic Microwave NN-ST25JW', Brand: 'Panasonic', Description: 'Compact and efficient microwave oven',
    Unit: 'Pcs', Quantity: 25, Sale_Cost: 3000, Sale_Price: 2800, Reorder_Point: 7, Visibility: true, // Added discount example
    Review_Rating: 4.1, Image_URL: 'https://placehold.co/400x300/E0FFFF/000000?text=Microwave',
  },
  {
    Product_ID: 9, Child_ID: 3002, Name: 'Glass Coffee Table', Brand: 'Chic Home', Description: 'Sleek design with tempered glass top',
    Unit: 'Pcs', Quantity: 8, Sale_Cost: 5000, Sale_Price: 4500, Reorder_Point: 2, Visibility: true, // Added discount example
    Review_Rating: 3.5, Image_URL: 'https://placehold.co/400x300/F5DEB3/000000?text=CoffeeTable',
  },
  {
    Product_ID: 10, Child_ID: 3003, Name: 'Queen Size Bed Frame', Brand: 'SleepWell', Description: 'Sturdy wooden bed frame',
    Unit: 'Pcs', Quantity: 6, Sale_Cost: 12000, Sale_Price: 10000, Reorder_Point: 2, Visibility: true, // Added discount example
    Review_Rating: 4.0, Image_URL: 'https://placehold.co/400x300/FFC0CB/000000?text=BedFrame',
  },
];

// Create a map for quick lookup of category paths
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

// Helper for currency formatting
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

// Main Product Listing Page Component
export default function ProductsPage() {
  const searchParams = useSearchParams(); // Initialize useSearchParams

  // Get filter values from URL search parameters
  const categoryIdParam = searchParams.get('categoryId');
  const subCategoryIdParam = searchParams.get('subCategoryId');
  const childCategoryIdParam = searchParams.get('childCategoryId');
  const discountParam = searchParams.get('discount');

  const [products] = useState<ProductInventory[]>(mockProducts); // No need for setProducts if using mock directly
  const [filteredProducts, setFilteredProducts] = useState<ProductInventory[]>(mockProducts);

  // Filter products whenever URL search parameters change
  useEffect(() => {
    let currentFilteredProducts = products.filter(product => product.Visibility);

    // Apply discount filter first if present
    if (discountParam === 'true') {
        currentFilteredProducts = currentFilteredProducts.filter(product => product.Sale_Price < product.Sale_Cost);
    }

    if (childCategoryIdParam) {
      const childId = Number(childCategoryIdParam);
      currentFilteredProducts = currentFilteredProducts.filter(product =>
        product.Child_ID === childId
      );
    } else if (subCategoryIdParam) {
      const subId = Number(subCategoryIdParam);
      currentFilteredProducts = currentFilteredProducts.filter(product => {
        const productCatPath = allCategoriesMap.get(product.Child_ID);
        return productCatPath && productCatPath.Sub_Category_ID === subId;
      });
    } else if (categoryIdParam) {
      const catId = Number(categoryIdParam);
      currentFilteredProducts = currentFilteredProducts.filter(product => {
        const productCatPath = allCategoriesMap.get(product.Child_ID);
        return productCatPath && productCatPath.Category_ID === catId;
      });
    }

    setFilteredProducts(currentFilteredProducts);
  }, [categoryIdParam, subCategoryIdParam, childCategoryIdParam, discountParam, products]);


  // Helper function to check if a category is currently active (most specific selected)
  const isCategoryActive = (category: Category) => {
    return categoryIdParam === String(category.Category_ID) && !subCategoryIdParam && !childCategoryIdParam && discountParam !== 'true';
  };

  // Helper function to check if a sub-category is currently active (most specific selected)
  const isSubCategoryActive = (subCategory: SubCategory) => {
    return subCategoryIdParam === String(subCategory.Sub_Category_ID) && !childCategoryIdParam && discountParam !== 'true';
  };

  // Helper function to check if a child-category is currently active (most specific selected)
  const isChildCategoryActive = (childCategory: ChildSubCategory) => {
    return childCategoryIdParam === String(childCategory.Child_ID) && discountParam !== 'true';
  };

  // Helper function to check if a category is an ancestor of the currently selected category
  const isCategoryAncestor = (categoryId: number) => {
    if (discountParam === 'true') return false; // Ancestor highlight not for discount page

    if (childCategoryIdParam) {
      const selectedChildPath = allCategoriesMap.get(Number(childCategoryIdParam));
      return selectedChildPath?.Category_ID === categoryId;
    }
    if (subCategoryIdParam) {
      const selectedSubPath = mockSubCategories.find(sub => sub.Sub_Category_ID === Number(subCategoryIdParam));
      return selectedSubPath?.Category_ID === categoryId;
    }
    return false;
  };

  // Helper function to check if a sub-category is an ancestor of the currently selected child-category
  const isSubCategoryAncestor = (subCategoryId: number) => {
    if (discountParam === 'true') return false; // Ancestor highlight not for discount page

    if (childCategoryIdParam) {
      const selectedChildPath = allCategoriesMap.get(Number(childCategoryIdParam));
      return selectedChildPath?.Sub_Category_ID === subCategoryId;
    }
    return false;
  };


  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Category Menu */}
        <aside className="w-full lg:w-72 bg-base-100 rounded-lg shadow-md p-6 sticky top-4 self-start">
          <h2 className="text-2xl font-bold mb-6 text-base-content">หมวดหมู่สินค้า</h2>
          <ul className="menu bg-base-100 rounded-box text-base-content w-full">
            {/* All Products Option */}
            <li>
              <a
                className={`flex items-center w-full px-4 py-2 rounded-md ${!categoryIdParam && !subCategoryIdParam && !childCategoryIdParam && discountParam !== 'true' ? 'bg-yellow-600 text-primary-content font-bold' : 'hover:bg-base-200'}`}
                href="/products" // Link to base products page
              >
                ทั้งหมด
              </a>
            </li>
            {mockCategories.map(category => (
              <li key={category.Category_ID}>
                <details
                  // Control open state based on current selection to ensure relevant branches are open
                  open={
                    isCategoryActive(category) ||
                    isCategoryAncestor(category.Category_ID)
                  }
                >
                  <summary
                    className={`flex items-center justify-between pr-4 cursor-pointer
                      ${
                        isCategoryActive(category)
                          ? 'bg-yellow-600 text-primary-content font-bold' // Exact match
                          : isCategoryAncestor(category.Category_ID)
                            ? 'bg-base-300 font-semibold' // Ancestor highlight
                            : 'hover:bg-base-200'
                      }`}
                  >
                    <a
                      className="flex-1 px-4 py-2 -ml-4 rounded-md" // Removed highlight classes from here
                      href={`/products?categoryId=${category.Category_ID}`} // Use href directly
                      onClick={(e) => e.stopPropagation()} // Prevents details toggle
                    >
                      {category.Name}
                    </a>
                  </summary>
                  <ul className="p-2 bg-base-100 rounded-box w-full">
                    {/* All Subcategories Option for this main category */}
                    <li>
                      <a
                        className={`flex items-center w-full px-4 py-2 rounded-md ${
                          subCategoryIdParam === 'all' &&
                          categoryIdParam === String(category.Category_ID) &&
                          !childCategoryIdParam && discountParam !== 'true' // Check if "All in this category" is active
                            ? 'bg-yellow-600 text-primary-content font-bold'
                            : 'hover:bg-base-200'
                        }`}
                        href={`/products?categoryId=${category.Category_ID}`} // Link to all in this main category
                      >
                        ทั้งหมดใน {category.Name}
                      </a>
                    </li>
                    {mockSubCategories.filter(sub => sub.Category_ID === category.Category_ID).map(subCategory => (
                      <li key={subCategory.Sub_Category_ID}>
                        <details
                           // Control open state for sub-categories
                           open={
                            isSubCategoryActive(subCategory) ||
                            isSubCategoryAncestor(subCategory.Sub_Category_ID)
                           }
                        >
                          <summary
                            className={`flex items-center justify-between pr-4 cursor-pointer
                              ${
                                isSubCategoryActive(subCategory)
                                  ? 'bg-yellow-600 text-primary-content font-bold'
                                  : isSubCategoryAncestor(subCategory.Sub_Category_ID)
                                    ? 'bg-base-300 font-semibold'
                                    : 'hover:bg-base-200'
                              }`}
                          >
                            <a
                              className="flex-1 px-4 py-2 -ml-4 rounded-md" // Removed highlight classes from here
                              href={`/products?categoryId=${subCategory.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`} // Link to this subcategory
                              onClick={(e) => e.stopPropagation()} // Prevents details toggle
                            >
                              {subCategory.Name}
                            </a>
                          </summary>
                          <ul className="p-2 bg-base-100 rounded-box w-full">
                            {/* All Child Subcategories Option for this subcategory */}
                            <li>
                              <a
                                className={`flex items-center w-full px-4 py-2 rounded-md ${
                                  !childCategoryIdParam &&
                                  subCategoryIdParam === String(subCategory.Sub_Category_ID) &&
                                  discountParam !== 'true' // Check if "All in this subcategory" is active
                                    ? 'bg-yellow-600 text-primary-content font-bold'
                                    : 'hover:bg-base-200'
                                }`}
                                href={`/products?categoryId=${subCategory.Category_ID}&subCategoryId=${subCategory.Sub_Category_ID}`} // Link to all in this sub category
                              >
                                ทั้งหมดใน {subCategory.Name}
                              </a>
                            </li>
                            {mockChildSubCategories.filter(child =>
                              child.Category_ID === subCategory.Category_ID && child.Sub_Category_ID === subCategory.Sub_Category_ID
                            ).map(childCategory => (
                              <li key={childCategory.Child_ID}>
                                <a
                                  className={`flex items-center w-full px-4 py-2 rounded-md ${isChildCategoryActive(childCategory) ? 'bg-yellow-600 text-primary-content font-bold' : 'hover:bg-base-200'}`}
                                  href={`/products?categoryId=${childCategory.Category_ID}&subCategoryId=${childCategory.Sub_Category_ID}&childCategoryId=${childCategory.Child_ID}`} // Link to this child category
                                >
                                  {childCategory.Name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Content - Product Grid */}
        <main className="flex-1">
          <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-base-content mb-2">
              {discountParam === 'true' ? (
                `สินค้าลดราคา`
              ) : childCategoryIdParam ? (
                `สินค้าในหมวดหมู่ ${allCategoriesMap.get(Number(childCategoryIdParam))?.Child_Name}`
              ) : subCategoryIdParam ? (
                `สินค้าในหมวดหมู่ ${mockSubCategories.find(sub => sub.Sub_Category_ID === Number(subCategoryIdParam))?.Name}`
              ) : categoryIdParam ? (
                `สินค้าในหมวดหมู่ ${mockCategories.find(cat => cat.Category_ID === Number(categoryIdParam))?.Name}`
              ) : (
                `สินค้าทั้งหมด`
              )}
            </h1>
            <p className="text-base-content/70">แสดงสินค้าทั้งหมด {filteredProducts.length} รายการ</p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductDisplayCard
                  key={product.Product_ID}
                  product={product}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-base-100 rounded-lg shadow-md">
              <FiBox className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-base-content/70 text-lg">ไม่พบสินค้าในหมวดหมู่ที่เลือก</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
