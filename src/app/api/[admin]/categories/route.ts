import { NextRequest, NextResponse } from 'next/server';
import { checkStockMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { addCategory, deleteCategory, updateCategory } from '../../services/admin/categoryMgrService';
import { CategoryFormData } from '@/types';

/**
 * POST: สำหรับสร้างหมวดหมู่ใหม่ (main, sub, child)
 * Body: { type: 'main' | 'sub' | 'child', payload: { name, parentId? } }
 */
export async function POST(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const data: CategoryFormData = await req.json();
        const newData = await addCategory(data.Type, data);
        if (!newData) {
            return NextResponse.json({ message: 'เพิ่มหมวดหมู่ล้มเหลว!' }, { status: 500 });
        }
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
        const data: CategoryFormData = await req.json();
        const updatedData = await updateCategory(data.Type, Number(data.ID), data);
        if (!updatedData) {
            return NextResponse.json({ message: 'อัปเดตหมวดหมู่ล้มเหลว!' }, { status: 500 });
        }
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
        
        const result = await deleteCategory(type, { id });

        if (!result) {
            return NextResponse.json({ message: `ไม่พบ Category ID: ${id}` }, { status: 404 });
        }

        return NextResponse.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'API Error' }, { status: 500 });
    }
}