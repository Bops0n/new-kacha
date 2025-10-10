import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "../../lib/db";
import { hmacMd5Hex } from "@/app/utils/cryptor";

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
          const { rows } = await pool.query(`SELECT * FROM public."SP_AUTH_LOGIN"($1, $2);`, [
            credentials.username,
            hmacMd5Hex(credentials.password, process.env.SALT_SECRET),
          ]);

          const row = rows[0];
          if (!row) throw new Error("No response from authentication function");

          switch (row.Status_Code) {
            case 200:
              return {
                id: row.User_ID,
                name: row.Full_Name,
                email: row.Email,
                accessLevel: row.Access_Level,
                rememberMe: credentials.rememberMe === "true",
                message: row.Message,
              };
            default: throw new Error(row.Message);
          }
        } catch (error : any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Internal Server Error");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session } : any) {
      if (user) {
        const IsRemember = user.rememberMe === true;
        token.rememberMe = IsRemember;

        const now = Math.floor(Date.now() / 1000);
        token.shortExp = now + (IsRemember ? LONG : SHORT);

        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        if (user.accessLevel !== undefined) {
          token.accessLevel = user.accessLevel;
        }
      }
      if (trigger === "update" && session) {
        if (typeof session.rememberMe === "boolean") {
          token.rememberMe = session.rememberMe;
          const now = Math.floor(Date.now() / 1000);
          token.shortExp = now + ((token.rememberMe as boolean) ? LONG : SHORT);
        }
      }
      return token;
    },
    async session({ session, token } : any) {
      session.rememberMe = token.rememberMe ?? false;
      session.shortExp = token.shortExp;

      const now = Math.floor(Date.now() / 1000);
      if (token.shortExp && now > token.shortExp) {
        return null;
      }

      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        accessLevel: token.accessLevel,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
