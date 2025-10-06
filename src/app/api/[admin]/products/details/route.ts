import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/auth/utils';
import { poolQuery } from '@/app/api/lib/db';
import { SimpleProductDetail } from '@/types';

const requireAdmin = (auth) => {
    if (!auth.authenticated || auth.accessLevel !== '9') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};

/**
 * POST /api/admin/products/details
 * รับ Product IDs (array) และ trả về ข้อมูลสินค้าที่เกี่ยวข้องทั้งหมด
 */
export async function POST(req: NextRequest) {
    const auth = await authenticateRequest();
    const adminCheck = requireAdmin(auth);
    if (adminCheck) return adminCheck;

    try {
        const { productIds } = await req.json();
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ message: 'productIds must be a non-empty array.' }, { status: 400 });
        }

        // --- START: แก้ไข SQL Query ---
        const result = await poolQuery(
            `SELECT "Product_ID", "Name", "Image_URL", "Quantity", "Total_Sales", "Cancellation_Count"
             FROM "Product" 
             WHERE "Product_ID" = ANY($1::int[])`,
            [productIds]
        );
        // --- END: แก้ไข SQL Query ---

        const productDetails: SimpleProductDetail[] = result.rows;
        return NextResponse.json(productDetails);

    } catch (error) {
        console.error('Error fetching bulk product details:', error);
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}