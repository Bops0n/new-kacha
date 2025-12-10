import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    rememberMe: boolean;
    shortExp?: number;
    user: (DefaultSession["user"] & {
      id: number | string;
      name: string;
      email: string;
      accessLevel: number;

      Sys_Admin: boolean;
      User_Mgr: boolean;
      Stock_Mgr: boolean;
      Order_Mgr: boolean;
      Report: boolean;
      Dashboard: boolean;
    }) | null;
  }

  interface User {
    id: number | string;
    name: string;
    email: string;
    rememberMe?: boolean;
    accessLevel?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: number | string;
    name?: string;
    email?: string;

    rememberMe?: boolean;
    shortExp?: number;
    accessLevel?: number;

    Sys_Admin?: boolean;
    User_Mgr?: boolean;
    Stock_Mgr?: boolean;
    Order_Mgr?: boolean;
    Report?: boolean;
    Dashboard?: boolean;
  }
}