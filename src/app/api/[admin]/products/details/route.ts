import { NextRequest, NextResponse } from 'next/server';
import { checkStockMgrRequire } from '@/app/api/auth/utils';
import { SimpleProductDetail } from '@/types';
import { checkRequire } from '@/app/utils/client';
import { getProductDetailByID } from '@/app/api/services/admin/productMgrService';

/**
 * POST /api/admin/products/details
 * รับ Product IDs (array) และ trả về ข้อมูลสินค้าที่เกี่ยวข้องทั้งหมด
 */
export async function POST(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const { productIds } = await req.json();
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ message: 'productIds must be a non-empty array.' }, { status: 400 });
        }

        // --- START: แก้ไข SQL Query ---
        const result = await getProductDetailByID(productIds);
        // --- END: แก้ไข SQL Query ---

        const productDetails: SimpleProductDetail[] = result;
        return NextResponse.json(productDetails);

    } catch (error) {
        console.error('Error fetching bulk product details:', error);
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}