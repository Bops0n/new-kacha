'use server'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type Guard = (req: NextRequest) => Promise<NextResponse | null> | NextResponse | null;
type HTTP_METHOD = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";


function redirectToLogin(req: NextRequest) {
  const url = new URL("/login", req.url);
  url.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(url);
}

export const requireAuth =
  (opts?: { allow?: string[] }) =>
  async (req: NextRequest): Promise<NextResponse | null> => {
    const url = new URL(req.url);
    const allow = opts?.allow ?? ["/", "/login", "/api/main"];
    if (allow.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) {
      return null;
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return redirectToLogin(req);

    const now = Math.floor(Date.now() / 1000);
    const shortExp = token.shortExp as number | undefined;
    if (shortExp && now > shortExp) return redirectToLogin(req);

    return null;
  };

export const requireRole =
  (policy: Record<string, number[]>) =>
  async (req: NextRequest) => {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.accessLevel as number;
    const path = new URL(req.url).pathname;
    for (const [prefix, allowed] of Object.entries(policy)) {
      if (path.startsWith(prefix)) {
        if (!role || !allowed.includes(role)) {
          return NextResponse.redirect(new URL("/403", req.url));
        }
        break;
      }
    }
    return null;
  };

export const requireMethods =
  (map: Record<string, HTTP_METHOD[]>) =>
  (req: NextRequest) => {
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
  requireAuth({ allow: ["/", "/login", "/api/main", "/api/main/cart/"] }),
  requireRole({ "/admin": [1, 2, 3, 4, 999] }),
  requireMethods({ 
    "/api/admin": ["GET", "POST", "PATCH", "PUT", "DELETE"], 
    "/api/master": ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }),
];

export async function middleware(req: NextRequest) {
  for (const guard of guards) {
    const res = await guard(req);
    if (res) return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico|products|uploads).*)"]
}