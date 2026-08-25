import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * ปกติคือ ".next" ตามค่าเริ่มต้น ตัวแปรนี้มีไว้ให้รันเซิร์ฟเวอร์ตัวที่สองเพื่อตรวจงาน
   * โดยไม่ไปเขียนทับโฟลเดอร์ build ของ dev server ที่เปิดค้างอยู่
   *
   *   NEXT_DIST_DIR=.next-check npx next dev -p 3001
   *
   * เคยเกิดมาแล้วครั้งหนึ่งว่า build ระหว่าง dev server รันอยู่ทำให้ .next พังทั้งก้อน
   * แล้วทุกหน้าตอบ 500 จนกว่าจะลบทิ้งแล้วเริ่มใหม่
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
