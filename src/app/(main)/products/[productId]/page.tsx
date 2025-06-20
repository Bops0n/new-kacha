'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiPlus, FiMinus, FiShoppingCart, FiPhone, FiMessageCircle, FiStar } from 'react-icons/fi';
import { usePathname } from 'next/navigation';

// Assuming these types are defined in src/types.ts
interface ProductInventory {
  Product_ID: string;
  Child_ID: number;
  Name: string;
  Brand: string;
  Description: string;
  Unit: string;
  Quantity: number; // Stock quantity
  Sale_Cost: number; // Original price
  Sale_Price: number; // Discounted price
  Reorder_Point: number;
  Visibility: boolean;
  Review_Rating: number | null;
  Image_URL: string;
  Dimensions?: string;
  Material?: string;
}

// Mock Product Data - tailored to the image provided
const mockProducts: ProductInventory[] = [
  {
    Product_ID: '00000',
    Child_ID: 3001,
    Name: 'HENDRIK โซฟาปรับนอน HENDRIK 180 × 91 × 84 ซม.',
    Brand: 'HENDRIK',
    Description: 'โซฟาปรับนอน วัสดุการผลิต: หุ้มผ้า ทนทาน หรือหุ้มหนังอย่างดี ขาเหล็ก',
    Unit: 'ชิ้น',
    Quantity: 30,
    Sale_Cost: 8990,
    Sale_Price: 8990,
    Reorder_Point: 5,
    Visibility: true,
    Review_Rating: 4.5,
    Image_URL: 'https://placehold.co/600x400/D8BFD8/000000?text=Sofa+Bed+HENDRIK&format=png', // Added &format=png
    Dimensions: '180 x 91 x 84 ซม.',
    Material: 'หุ้มผ้า/ขาเหล็ก',
  },
  {
    Product_ID: '00001',
  Child_ID: 3001,
    Name: 'โซฟาผ้า L-Shape รุ่น MODERN',
    Brand: 'MODERN',
    Description: 'โซฟาดีไซน์ทันสมัย เหมาะสำหรับพื้นที่จำกัด',
    Unit: 'ชุด',
    Quantity: 10,
    Sale_Cost: 18000,
    Sale_Price: 15900,
    Reorder_Point: 3,
    Visibility: true,
    Review_Rating: 4.2,
    Image_URL: 'https://placehold.co/600x400/B0E0E6/000000?text=L-Shape+Fabric+Sofa&format=png', // Added &format=png
    Dimensions: '200 x 150 x 80 ซม.',
    Material: 'ผ้า/ไม้',
  },
  {
    Product_ID: '00002',
    Child_ID: 3002,
    Name: 'โต๊ะกาแฟกระจก รุ่น GLOSSY',
    Brand: 'GLOSSY',
    Description: 'โต๊ะกาแฟกระจกนิรภัยดีไซน์เรียบหรู',
    Unit: 'ชิ้น',
    Quantity: 25,
    Sale_Cost: 3500,
    Sale_Price: 3000,
    Reorder_Point: 7,
    Visibility: true,
    Review_Rating: 4.0,
    Image_URL: 'https://placehold.co/600x400/FFD700/000000?text=Glass+Coffee+Table&format=png', // Added &format=png
    Dimensions: '100 x 60 x 45 ซม.',
    Material: 'กระจกนิรภัย/สเตนเลส',
  },
  {
    Product_ID: '00003',
    Child_ID: 3003,
    Name: 'เตียงนอนไม้สัก 5 ฟุต รุ่น CLASSIC',
    Brand: 'CLASSIC',
    Description: 'เตียงนอนไม้สักแท้ แข็งแรงทนทาน',
    Unit: 'ชิ้น',
    Quantity: 8,
    Sale_Cost: 22000,
    Sale_Price: 22000,
    Reorder_Point: 2,
    Visibility: true,
    Review_Rating: 4.8,
    Image_URL: 'https://placehold.co/600x400/A2DAA2/000000?text=Teak+Wood+Bed&format=png', // Added &format=png
    Dimensions: '160 x 210 x 100 ซม.',
    Material: 'ไม้สัก',
  },
];


// Helper to format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(price);
};

export default function ProductDisplayPage() {
  const pathname = usePathname();
  const productId = pathname.split('/').pop() || '';

  const [product, setProduct] = useState<ProductInventory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<ProductInventory[]>([]);

  useEffect(() => {
    const fetchedProduct = mockProducts.find(p => p.Product_ID === productId);
    setProduct(fetchedProduct || null);
    setQuantity(1);

    if (fetchedProduct) {
      setRelatedProducts(
        mockProducts.filter(p => p.Product_ID !== productId && p.Child_ID === fetchedProduct.Child_ID)
      );
    } else {
      setRelatedProducts(mockProducts.filter(p => p.Product_ID !== productId).slice(0, 4));
    }
  }, [productId]);

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    setQuantity(prevQty => {
      if (!product) return prevQty;

      if (type === 'increase') {
        return Math.min(prevQty + 1, product.Quantity);
      } else {
        return Math.max(prevQty - 1, 1);
      }
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    console.log(`Adding ${quantity} of ${product.Name} (ID: ${product.Product_ID}) to cart.`);
    alert(`เพิ่ม ${product.Name} จำนวน ${quantity} ชิ้น ลงในตะกร้าแล้ว!`);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="ml-4 text-base-content">Loading product information...</p>
      </div>
    );
  }

  const hasDiscount = product.Sale_Price < product.Sale_Cost;
  const discountPercentage = hasDiscount ? ((1 - product.Sale_Price / product.Sale_Cost) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-base-200 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 lg:p-8">
        {/* Product Detail Section */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product Image */}
          <div className="lg:w-1/2 flex justify-center items-center p-4 bg-gray-100 rounded-lg shadow-inner relative">
            <img
              src={product.Image_URL || 'https://placehold.co/600x400/CCCCCC/666666?text=Image+Not+Found&format=png'} // Added &format=png
              alt={product.Name}
              width={600}
              height={400}
              className="rounded-lg"
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/48x48/CCCCCC/666666?text=Img+Error'; }} // Added &format=png
            />
            {hasDiscount && (
              <span className="badge badge-error absolute top-4 left-4 text-white font-bold text-lg px-4 py-3 z-10 rounded-lg shadow-md">
                ลด {discountPercentage}%
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-base-content leading-tight">
              {product.Name}
            </h1>

            {/* Price Display with Discount */}
            <div className="flex flex-col">
              {hasDiscount && (
                <p className="text-xl text-base-content/60 line-through">
                  {formatPrice(product.Sale_Cost)} / {product.Unit}
                </p>
              )}
              <p className="text-3xl font-bold text-primary">
                {formatPrice(product.Sale_Price)} / {product.Unit}
              </p>
            </div>


            <div className="text-base-content/80 text-sm">
              <p><strong>Product ID:</strong> {product.Product_ID}</p>
              <p className={`font-semibold ${product.Quantity > 0 ? 'text-success' : 'text-error'}`}>
                Stock: {product.Quantity} items
              </p>
              {product.Dimensions && <p><strong>Dimensions:</strong> {product.Dimensions}</p>}
              {product.Material && <p><strong>Material:</strong> {product.Material}</p>}
              {product.Review_Rating !== null && (
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={`w-5 h-5 ${i < Math.floor(product.Review_Rating!) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-base-content/70">({product.Review_Rating} reviews)</span>
                </div>
              )}
            </div>

            <div className="divider text-base-content/30"></div>

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base-content text-lg">Quantity:</span>
                <div className="join border border-base-300 rounded-lg">
                  <button
                    className="join-item btn btn-sm btn-outline"
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={quantity <= 1}
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="join-item btn btn-sm pointer-events-none min-w-[40px] text-center font-bold">
                    {quantity}
                  </span>
                  <button
                    className="join-item btn btn-sm btn-outline"
                    onClick={() => handleQuantityChange('increase')}
                    disabled={quantity >= product.Quantity}
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg w-full sm:w-auto flex-1 md:flex-none py-3 shadow-lg hover:scale-105 transition-transform duration-300"
                onClick={handleAddToCart}
                disabled={product.Quantity === 0}
              >
                <FiShoppingCart className="w-6 h-6 mr-2" />
                Add to Cart
              </button>
            </div>

            <div className="divider text-base-content/30"></div>

            {/* Contact Info */}
            <div className="space-y-2 text-base-content">
              <h3 className="text-lg font-bold">Contact Us</h3>
              <div className="flex items-center gap-2">
                <FiMessageCircle className="w-5 h-5 text-green-500" />
                <span>kacha982</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="w-5 h-5 text-blue-500" />
                <span>081-896-2687</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="mt-12 p-6 bg-base-100 rounded-lg shadow-md border border-base-300">
          <h2 className="text-2xl font-bold text-base-content mb-4">Product Details</h2>
          <p className="text-base-content/90 leading-relaxed">
            {product.Description || 'No additional product details available for this item.'}
            <br />
            {product.Dimensions && `Dimensions: ${product.Dimensions}`}
            <br />
            {product.Material && `Material: ${product.Material}`}
          </p>
          <h3 className="text-xl font-bold text-base-content mt-6 mb-2">Key Features:</h3>
          <ul className="list-disc list-inside text-base-content/80 space-y-1">
            <li>Sturdy and durable construction, designed for long-lasting use.</li>
            <li>Simple design that complements various decor styles.</li>
            <li>Easily convertible into a bed, comfortable and ideal for small spaces.</li>
            <li>High-quality materials, easy to clean.</li>
            <li>Excellent weight-bearing capacity.</li>
          </ul>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-base-content mb-6 text-center">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <Link
                  href={`/product/${relatedProduct.Product_ID}`}
                  key={relatedProduct.Product_ID}
                  className="card bg-base-100 shadow-xl compact transition-transform transform hover:scale-105 duration-300"
                >
                  <figure className="h-40 relative">
                    <Image
                      src={relatedProduct.Image_URL || 'https://placehold.co/400x300/EEEEEE/333333?text=No+Image&format=png'} // Added &format=png
                      alt={relatedProduct.Name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/CCCCCC/666666?text=Image+Error&format=png'; }} // Added &format=png
                    />
                  </figure>
                  <div className="card-body p-4">
                    <h3 className="card-title text-base-content text-lg leading-tight mb-1">{relatedProduct.Name}</h3>
                    <p className="text-sm text-base-content/70 line-clamp-2">{relatedProduct.Description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-bold text-primary text-md">{formatPrice(relatedProduct.Sale_Price)}</span>
                      <button className="btn btn-primary btn-sm btn-outline">
                        <FiShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
