// next-auth.d.ts
// นี่คือไฟล์ Type Declaration สำหรับ NextAuth.js
// เพื่อให้ TypeScript รู้จัก Properties เพิ่มเติมที่เราใส่เข้าไปใน Session และ JWT

import { DefaultSession, DefaultJWT } from "next-auth";

// 1. ขยาย Type ของ Session interface
//    เพื่อให้ TypeScript รู้จัก properties 'id' และ 'accessLevel' ใน session.user
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;         // เพิ่ม 'id' (อาจเป็น string หรือ number ขึ้นอยู่กับ ID ผู้ใช้จริง)
      accessLevel?: number; // เพิ่ม 'accessLevel' (เช่น '0', '1', 'admin')
    } & DefaultSession["user"]; // รวม properties เดิมของ DefaultSession.user (name, email, image)
  }
}

// 2. ขยาย Type ของ JWT interface
//    เพื่อให้ TypeScript รู้จัก properties 'id' และ 'accessLevel' ใน JWT token
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;          // เพิ่ม 'id' ลงใน JWT token
    accessLevel?: number; // เพิ่ม 'accessLevel' ลงใน JWT token
  }
}