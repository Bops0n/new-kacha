'use server'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ACCESS_FLAG } from "./types";

type Guard = (req: NextRequest) => Promise<NextResponse | null> | NextResponse | null;
type HTTP_METHOD = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AccessPolicy = Record<string, ACCESS_FLAG[]>;

function redirectToLogin(req: NextRequest) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(url);
}

function redirect403(req: NextRequest) {
    return NextResponse.redirect(new URL("/403", req.url));
}

const requireAuth = (paths: string[]) => async (req: NextRequest) => {
    const pathname = new URL(req.url).pathname;

    if (!paths.some(p => pathname.startsWith(p))) {
        return null;
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return redirectToLogin(req);

    const now = Math.floor(Date.now() / 1000);
    if (token.shortExp && now > token.shortExp) {
        return redirectToLogin(req);
    }

    return null;
};

const requireAccess = (policy: AccessPolicy) => async (req: NextRequest) => {
    const pathname = new URL(req.url).pathname;

    const matched = Object.entries(policy).find(([prefix]) => pathname.startsWith(prefix));

    if (!matched) return null;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return redirect403(req);

    const [, requiredFlags] = matched;

    const hasPermission = requiredFlags.some((flag) => token[flag] === true);

    if (!hasPermission) {
        return redirect403(req);
    }

    return null;
};


const requireMethods = (map: Record<string, HTTP_METHOD[]>) => (req: NextRequest) => {
    const path = new URL(req.url).pathname;
    const method = req.method as HTTP_METHOD;

    for (const [prefix, methods] of Object.entries(map)) {
        if (path.startsWith(prefix) && !methods.includes(method)) {
            return new NextResponse(null, { status: 405 });
        }
    }
    return null;
};


const guards: Guard[] = [
    requireAuth([
        "/cart",
        "/orders-history",
        "/profile",
        "/admin",
        "/api/main",
        "/api/admin",
        "/api/master",
    ]),
    
    requireAccess({
        "/admin/dashboard": ["Dashboard"],
        "/admin/user-management": ["User_Mgr"],
        "/admin/product-management": ["Stock_Mgr"],
        "/admin/order-management": ["Order_Mgr"],
        "/admin/report": ["Report"],
        "/admin/system-management": ["Sys_Admin"],
        "/api/admin": ["Sys_Admin"],
        "/api/master": ["Sys_Admin"],
    }),

    requireMethods({
        "/api/admin": ["GET", "POST", "PATCH", "PUT", "DELETE"],
        "/api/master": ["GET", "POST", "PATCH", "PUT", "DELETE"],
    }),
];

export async function proxy(req: NextRequest) {
    for (const guard of guards) {
        const res = await guard(req);
        if (res) return res;
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|api|static|favicon.ico).*)"]
}