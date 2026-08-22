import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// ใช้คอนฟิกชั้น Edge เท่านั้น — ถ้า import จาก "@/auth" ไดรเวอร์ MongoDB จะถูกดึงเข้า
// bundle ของ middleware ซึ่งรันบน Edge runtime แล้วพังทั้งแอป
const { auth } = NextAuth(authConfig);

// เส้นทางที่ต้องเข้าสู่ระบบก่อน — หน้า "/" เป็นหน้าสาธารณะ ห้ามใส่ในลิสต์นี้
// เพราะหน้าแรกคือ landing page ที่คนสแกน QR เข้ามาเจอก่อนตัดสินใจสมัคร
//
// ที่นี่ตรวจได้แค่ "ล็อกอินหรือยัง" เท่านั้น ตรวจบทบาทไม่ได้
// เพราะ Edge runtime อ่าน MongoDB ไม่ได้ และเราตั้งใจไม่เก็บ role ไว้ใน JWT
// การกัน /admin และ /partner ตามบทบาทจึงอยู่ใน layout ของแต่ละส่วน (guardRole)
const protectedPrefixes = ["/apply", "/me", "/partner", "/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    // ต้องพก search string ไปด้วย ไม่ใช่แค่ pathname — หน้าอย่าง /apply/success?id=…
    // หรือ /me/SG-…?saved=1 ใช้ query จริง ๆ เพื่อกลับมาที่จุดเดิมพอดีหลังล็อกอิน
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/apply/:path*",
    "/me/:path*",
    "/partner/:path*",
    "/admin/:path*",
    "/apply",
    "/me",
  ],
};
