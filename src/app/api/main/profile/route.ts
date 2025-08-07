import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../auth/utils';
import { getUserProfileById, updateUserProfile } from '../../services/userServices'; // << Import service

export async function GET(req: NextRequest) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) return auth.response!;
    
    try {
        const userProfile = await getUserProfileById(auth.userId);
        if (!userProfile) return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 });
        return NextResponse.json({ user: userProfile });
    } catch (err) {
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.userId) return auth.response!;
    
    try {
        const body = await req.json();
        const success = await updateUserProfile(auth.userId, body);
        if (!success) throw new Error('Update failed');
        return NextResponse.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
    } catch (err) {
        return NextResponse.json({ message: 'Update Error' }, { status: 500 });
    }
}