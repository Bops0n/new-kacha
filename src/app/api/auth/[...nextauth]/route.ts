// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// นี่คือข้อมูลผู้ใช้จำลอง (MOCK_USERS)
// ในระบบจริง คุณจะต้องเชื่อมต่อกับฐานข้อมูลของคุณ (เช่น PostgreSQL)
// เพื่อดึงข้อมูลผู้ใช้และตรวจสอบรหัสผ่าน
const MOCK_USERS = [
  { id: "103", username: "somchai.k", password: "password123", fullName: "สมชาย คชาโฮม", email: "somchai.k@example.com", accessLevel: "0" },
  { id: "102", username: "suda.p", password: "password123", fullName: "สุดา พลังสร้าง", email: "suda.p@example.com", accessLevel: "0" },
  { id: "101", username: "admin", password: "adminpassword", fullName: "แอดมิน ระบบ", email: "admin@example.com", accessLevel: "1" },
];

export const authOptions = {
  // ตั้งค่า Session Strategy เป็น JWT (แนะนำสำหรับ App Router)
  session: {
    strategy: 'jwt',
    // กำหนดเวลาหมดอายุของ Session ในหน่วยวินาที (เช่น 30 วัน)
    // NextAuth จะใช้ค่านี้นำไปกำหนด exp (expiration time) ใน JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // กำหนดว่า session จะถูกอัปเดตเมื่อไหร่เมื่อผู้ใช้ยัง Active
    // เช่น ทุกๆ 24 ชั่วโมง จะตรวจสอบ session และต่ออายุให้
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // กำหนด Providers ที่ใช้ในการ Login
  providers: [
    CredentialsProvider({
      name: "Credentials", // ชื่อของ Provider ที่จะแสดงในหน้า Login (ถ้ามี)
      credentials: {
        username: { label: "ชื่อผู้ใช้/อีเมล", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials, req) {
        // ในส่วนนี้คือ Logic สำหรับการตรวจสอบ Username/Password
        // คุณจะต้องดึงข้อมูลผู้ใช้จากฐานข้อมูลจริง และ hash รหัสผ่าน
        const user = MOCK_USERS.find(
          (u) => u.username === credentials?.username || u.email === credentials?.username
        );

        // ตรวจสอบรหัสผ่าน (ใน Production ต้องใช้ bcrypt หรือ hash อื่นๆ)
        if (user && user.password === credentials?.password) {
          // ถ้าตรวจสอบสำเร็จ ให้ return object ผู้ใช้
          // ข้อมูลใน object นี้จะถูกเก็บใน JWT token
          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            accessLevel: user.accessLevel, // เพิ่ม custom property accessLevel
          };
        }
        // ถ้าตรวจสอบไม่สำเร็จ ให้ return null
        // การ return null จะทำให้ NextAuth.js สร้าง error code "CredentialsSignin"
        return null;
      },
    }),
    // คุณสามารถเพิ่ม Providers อื่นๆ ได้ที่นี่ เช่น GoogleProvider, GitHubProvider
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  // Callbacks สำหรับการจัดการ JWT และ Session
  callbacks: {
    // JWT Callback: ถูกเรียกเมื่อสร้าง JWT token หรือเมื่อ JWT token ถูกอัปเดต
    // และเมื่อมีการเรียกใช้ getSession() หรือ useSession()
    async jwt({ token, user, account }) {
      if (user) {
        // เมื่อผู้ใช้ Login สำเร็จ (user object จะมีค่าจากการ authorize)
        // เพิ่มข้อมูล custom properties จาก user ไปยัง token
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        // ตรวจสอบว่า user มี accessLevel ก่อน assign เพื่อหลีกเลี่ยง undefined
        if ((user as any).accessLevel !== undefined) {
          token.accessLevel = (user as any).accessLevel;
        }
      }
      // สำคัญมาก: ไม่ว่ากรณีใดๆ ต้อง return `token` (ซึ่งเป็น object)
      // ห้าม return false หรือ null ตรงนี้!
      // ถ้า return false จะทำให้เกิด "JWT Claims Set MUST be an object" error
      return token;
    },
    // Session Callback: ถูกเรียกเมื่อ Session ถูกตรวจสอบ (เช่น เมื่อใช้ useSession ใน client-side)
    // ข้อมูลจาก JWT token จะถูกนำมาใส่ใน session object ที่ส่งไปยัง client
    async session({ session, token }) {
      if (token) {
        // ดึงข้อมูลจาก JWT token มาใส่ใน session.user
        // ตรวจสอบว่า session.user เป็น object ก่อน assign
        if (!session.user) {
          session.user = {};
        }
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.accessLevel = token.accessLevel;
      }
      return session;
    },
    // Redirect Callback: กำหนด URL ที่จะ redirect หลังจากการ Sign-in/Sign-out สำเร
  },
  // Secret Key สำหรับการเข้ารหัส JWT
  // ต้องเป็นค่าที่ซับซ้อนและเก็บเป็น Environment Variable (ใน .env.local)
  secret: process.env.NEXTAUTH_SECRET,
  // ตั้งค่าหน้า UI ที่กำหนดเอง
  // เพิ่มการตั้งค่าสำหรับ Debugging หากจำเป็น
  // debug: process.env.NODE_ENV === "development",
};

// Next.js App Router (v13+) ใช้ Route Handler สำหรับ API routes
const handler = NextAuth(authOptions);

// Export GET และ POST handler
export { handler as GET, handler as POST };
