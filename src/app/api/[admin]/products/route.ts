import { NextRequest, NextResponse } from 'next/server';
import { checkStockMgrRequire } from '@/app/api/auth/utils';
import * as productService from '@/app/api/services/admin/productMgrService';
import { checkRequire } from '@/app/utils/client';

/**
 * GET /api/admin/products
 * ดึงข้อมูลสินค้าทั้งหมดสำหรับ Admin
 */
export async function GET() {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const products = await productService.getAllAdminProducts();
        return NextResponse.json({ products });
    } catch (error) {
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}

/**
 * POST /api/admin/products
 * เพิ่มสินค้าใหม่
 */
export async function POST(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const body = await req.json();
        // Basic validation
        if (!body.Name || !body.Child_ID) {
            return NextResponse.json({ message: "Missing required fields: Name, Child_ID" }, { status: 400 });
        }
        const newProduct = await productService.addProduct(body, Number(auth.userId));
        return NextResponse.json({ message: 'เพิ่มสินค้าสำเร็จ', product: newProduct }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/products
 * อัปเดตข้อมูลสินค้า
 */
export async function PATCH(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const body = await req.json();

        if (!body.Product_ID) {
            return NextResponse.json({ message: "Product_ID is required for update" }, { status: 400 });
        }

        const result = await productService.updateProduct(body.Product_ID, Number(auth.userId), body);
        if (!result) {
            return NextResponse.json({ message: `ไม่พบสินค้า ID: ${body.Product_ID}` }, { status: 404 });
        }
        return NextResponse.json({ message: 'อัปเดตสินค้าสำเร็จ' });
    } catch (error) {
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/products
 * ลบสินค้า
 */
export async function DELETE(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const productId = req.nextUrl.searchParams.get('id');
    if (!productId) {
        return NextResponse.json({ message: "Product ID is required as a query parameter" }, { status: 400 });
    }

    try {
        const success = await productService.deleteProduct(Number(productId), Number(auth.userId));
        if (!success) {
            return NextResponse.json({ message: `ไม่พบสินค้า ID: ${productId}` }, { status: 404 });
        }
        return NextResponse.json({ message: `ลบสินค้า ID: ${productId} สำเร็จ` });
    } catch (error) {
        return NextResponse.json({ message: "Server Error", error: (error as Error).message }, { status: 500 });
    }
}