import { NextResponse } from "next/server";

export const checkRequire = (auth : any) => {
    if (!auth.authenticated) {
        return auth.response;
    }
    if (auth.accessLevel < 1) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
};