import { NextRequest, NextResponse } from 'next/server';
import { checkStockMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';
import { increaseProductQtyInStock } from '@/app/api/services/admin/productMgrService';
import { AddStockRequestBody } from '@/types';

export async function PATCH(req: NextRequest) {
    const auth = await checkStockMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const { productId, amountToAdd }: AddStockRequestBody = await req.json();

        if (!productId || typeof productId !== 'number') {
            return NextResponse.json({ message: 'Valid Product ID is required.' }, { status: 400 });
        }
        if (!amountToAdd || typeof amountToAdd !== 'number' || amountToAdd <= 0) {
            return NextResponse.json({ message: 'Amount to add must be a positive number.' }, { status: 400 });
        }

        const { data, result } = await increaseProductQtyInStock(productId, amountToAdd);

        if (!result) {
            return NextResponse.json({ message: `Product with ID ${productId} not found.` }, { status: 404 });
        }

        return NextResponse.json({ 
            message: `Successfully added ${amountToAdd} to stock for product ${data.Name}.`,
            product: data
        });
    } catch (error) {
        console.error('API Error adding stock:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: 'Failed to add stock.', error: errorMessage }, { status: 500 });
    }
}
