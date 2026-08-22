import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * ส่วนที่รันบน Edge ได้ — ห้ามมี import ที่แตะ MongoDB ในไฟล์นี้
 *
 * middleware ของ Next.js รันบน Edge runtime ซึ่งไม่มี Node API ที่ไดรเวอร์ MongoDB ต้องใช้
 * ถ้า middleware ดึง auth ตัวเต็มเข้ามา bundle จะพัง จึงต้องแยกคอนฟิกเป็นสองชั้น
 * ชั้นนี้ให้ middleware ใช้ ส่วน src/auth.ts เอาไปต่อ callback ที่คุยกับฐานข้อมูล
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
