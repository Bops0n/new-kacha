import { NextRequest, NextResponse } from 'next/server';
import { pool, poolQuery } from '@/app/api/lib/db';
import { authenticateRequest } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

interface AddStockRequestBody {
  productId: number;
  amountToAdd: number;
}

export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest();
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

        const { rows, rowCount } = await poolQuery(
            'UPDATE "Product" SET "Quantity" = "Quantity" + $1 WHERE "Product_ID" = $2 RETURNING "Product_ID", "Name", "Quantity"',
            [amountToAdd, productId]
        );

        if (rowCount === 0) {
            return NextResponse.json({ message: `Product with ID ${productId} not found.` }, { status: 404 });
        }

        return NextResponse.json({ 
            message: `Successfully added ${amountToAdd} to stock for product ${rows[0].Name}.`,
            product: rows[0] 
        });
    } catch (error) {
        console.error('API Error adding stock:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: 'Failed to add stock.', error: errorMessage }, { status: 500 });
    }
}
