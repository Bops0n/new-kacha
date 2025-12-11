import { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAccessByLevel } from "../../services/admin/accessMgrService";
import { signIn } from "../../services/auth/authService";
import { logger } from "@/server/logger";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";

const SHORT = 24 * 60 * 60;
const LONG  = 30 * 24 * 60 * 60;

export const authOptions : AuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: LONG,
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้/อีเมล", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
        rememberMe: { label: "จดจำฉัน", type: "checkbox" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        
        try {
          const result = await signIn(credentials.username, credentials.password);

          if (!result) throw new Error("No response from authentication function");

          switch (result.Status_Code) {
            case 200:
              const access = await getAccessByLevel(result.Access_Level);

              return {
                id: result.User_ID,
                name: result.Full_Name,
                email: result.Email,
                accessLevel: result.Access_Level as number,

                Sys_Admin: access ? access.Sys_Admin : false,
                User_Mgr: access ? access.User_Mgr : false,
                Stock_Mgr: access ? access.Stock_Mgr : false,
                Order_Mgr: access ? access.Order_Mgr : false,
                Report: access ? access.Report : false,
                Dashboard: access ? access.Dashboard : false,

                rememberMe: credentials.rememberMe === "true",
                message: result.Message,
              };
            default: throw new Error(result.Message);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
          logger.error("Auth error:", { error: error });
          throw new Error(message || "Internal Server Error");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ 
      token, 
      user, 
      trigger, 
      session 
    }: { 
      token: JWT;
      user?: User | AdapterUser  | null;
      trigger?: "update" | "signIn" | "signUp";
      session?: Session 
    }) {
      if (user) {
        const IsRemember = user.rememberMe === true;
        token.rememberMe = IsRemember;

        const now = Math.floor(Date.now() / 1000);
        token.shortExp = now + (IsRemember ? LONG : SHORT);

        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        if (user.accessLevel !== undefined) {
          token.accessLevel = user.accessLevel as number;

          const access = await getAccessByLevel(token.accessLevel);

          if (access) {
            token.Sys_Admin = access.Sys_Admin;
            token.User_Mgr = access.User_Mgr;
            token.Stock_Mgr = access.Stock_Mgr;
            token.Order_Mgr = access.Order_Mgr;
            token.Report = access.Report;
            token.Dashboard = access.Dashboard;
          }
        }
      }
      if (trigger === "update" && session) {
        if (!session.user) return token;
        
        if (typeof session.rememberMe === "boolean") {
          token.rememberMe = session.rememberMe;
          const now = Math.floor(Date.now() / 1000);
          token.shortExp = now + ((token.rememberMe as boolean) ? LONG : SHORT);
        }

        token.accessLevel = session.user.accessLevel;

        const access = await getAccessByLevel(token.accessLevel);

        if (access) {
          token.Sys_Admin = access.Sys_Admin;
          token.User_Mgr = access.User_Mgr;
          token.Stock_Mgr = access.Stock_Mgr;
          token.Order_Mgr = access.Order_Mgr;
          token.Report = access.Report;
          token.Dashboard = access.Dashboard;
        }

        token.name = session.user.name;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      const now = Math.floor(Date.now() / 1000);
      if (token.shortExp && now > token.shortExp) {
        return {
          ...session,
          user: null,
          rememberMe: false,
          shortExp: undefined,
        };
      }

      session.rememberMe = token.rememberMe ?? false;
      session.shortExp = token.shortExp;
      session.user = {
        id: token.id!,
        name: token.name!,
        email: token.email!,
        accessLevel: token.accessLevel!,

        Sys_Admin: token.Sys_Admin ?? false,
        User_Mgr: token.User_Mgr ?? false,
        Stock_Mgr: token.Stock_Mgr ?? false,
        Order_Mgr: token.Order_Mgr ?? false,
        Report: token.Report ?? false,
        Dashboard: token.Dashboard ?? false
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};