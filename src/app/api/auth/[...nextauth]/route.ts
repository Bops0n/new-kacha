import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "../../lib/db";

export const authOptions : AuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้/อีเมล", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const { rows } = await pool.query(`SELECT * FROM public."SP_AUTH_LOGIN"($1, $2);`, [
            credentials.username,
            credentials.password,
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
    async jwt({ token, user } : any) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        if (user.accessLevel !== undefined) {
          token.accessLevel = user.accessLevel;
        }
      }
      return token;
    },
    async session({ session, token } : any) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          accessLevel: token.accessLevel,
        };
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
