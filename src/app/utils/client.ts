import { NextResponse } from "next/server";

export const requireAdmin = (auth : any) => {
    if (!auth.authenticated) {
        return auth.response;
    }
    if (auth.accessLevel !== 9) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};
