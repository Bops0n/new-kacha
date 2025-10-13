import { NextRequest, NextResponse } from 'next/server';
import { poolQuery } from '../../lib/db';
import { checkStockMgrRequire } from '@/app/api/auth/utils';
import * as categoryService from '@/app/api/services/admin/categoryService';
import { checkRequire } from '@/app/utils/client';

interface Category {
    Category_ID: number;
    Name: string;
}

/**
 * GET: สำหรับดึงข้อมูล Category ทั้งหมด
 */
export async function GET(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
        
    const categoryId = req.nextUrl.searchParams.get('id');
    
    let categories: Category[] = [];
    let sql: string;
    let queryParams: (string | number)[] = [];

    const selectColumns = `"Category_ID", "Name"`;

    if (categoryId) {
        sql = `SELECT ${selectColumns} FROM public."Category" WHERE "Category_ID" = $1`;
        queryParams.push(parseInt(categoryId, 10));
    } else {
        sql = `SELECT ${selectColumns} FROM public."Category" ORDER BY "Category_ID" ASC`;
    }

    try {
        const result = await poolQuery(sql, queryParams);
        categories = result.rows;
        if (categoryId && categories.length === 0) {
            return NextResponse.json({ message: 'Category not found' }, { status: 404 });
        }
        return NextResponse.json({ categories }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error fetching categories:", dbError);
        return NextResponse.json({ message: "Failed to fetch categories", error: dbError.message }, { status: 500 });
    }
}

/**
 * POST: สำหรับสร้างหมวดหมู่ใหม่ (main, sub, child)
 * Body: { type: 'main' | 'sub' | 'child', payload: { name, parentId? } }
 */
export async function POST(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const { type, payload } = await req.json();
        const newData = await categoryService.addCategory(type, payload);
        return NextResponse.json({ message: 'เพิ่มหมวดหมู่สำเร็จ', data: newData }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'API Error' }, { status: 500 });
    }
}

/**
 * PATCH: สำหรับอัปเดตข้อมูลหมวดหมู่ (main, sub, child)
 * Body: { type: 'main' | 'sub' | 'child', payload: { id, name } }
 */
export async function PATCH(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const { type, payload } = await req.json();
        const updatedData = await categoryService.updateCategory(type, payload);
        return NextResponse.json({ message: 'อัปเดตหมวดหมู่สำเร็จ', data: updatedData });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'API Error' }, { status: 500 });
    }
}

/**
 * DELETE: สำหรับลบหมวดหมู่
 * Query Params: ?type=main&id=123
 */
export async function DELETE(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as 'main' | 'sub' | 'child';
        const id = Number(searchParams.get('id'));

        if (!type || !id) {
            return NextResponse.json({ message: 'Missing type or id query parameter' }, { status: 400 });
        }
        
        await categoryService.deleteCategory(type, { id });
        return NextResponse.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'API Error' }, { status: 500 });
    }
}