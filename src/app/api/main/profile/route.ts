import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../auth/utils';
import { getUserProfileById, updateUserProfile } from '../../services/user/userServices'; // << Import service
import { checkRequire } from '@/app/utils/client';
import { logger } from '@/server/logger';

export async function GET(req: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const userProfile = await getUserProfileById(Number(auth.userId));
        if (!userProfile) return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 });
        return NextResponse.json({ user: userProfile });
    } catch (err: any) {
        logger.error("API GET Error:", { error: err });
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    try {
        const body = await req.json();
        const success = await updateUserProfile(Number(auth.userId), body);
        if (!success) throw new Error('Update failed');
        return NextResponse.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
    } catch (err) {
        logger.error("API PATCH Error:", { error: err });
        return NextResponse.json({ message: 'Update Error' }, { status: 500 });
    }
}