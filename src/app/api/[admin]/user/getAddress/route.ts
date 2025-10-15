import { NextRequest, NextResponse } from 'next/server';
import { getAddressesByUserId } from '@/app/api/services/user/userServices';
import { checkUserMgrRequire } from '@/app/api/auth/utils';
import { checkRequire } from '@/app/utils/client';

export async function GET(req: NextRequest) {
    const auth = await checkUserMgrRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const userId = req.nextUrl.searchParams.get('UserId');
    
    try {
        const result = await getAddressesByUserId(Number(userId));
        return NextResponse.json({
            message: "Addresses fetched successfully",
            status: 200,
            addresses: result
        });

    } catch (dbError: any) {
        console.error("Error fetching addresses from database:", dbError);
        return NextResponse.json(
            { message: "Failed to fetch addresses from database", error: dbError.message },
            { status: 500 }
        );
    }
}