/**
 * แปลงปลายทางหลังเข้าสู่ระบบให้ปลอดภัย
 *
 * ค่าที่รับเข้ามามีได้สามแบบ
 *   1. path ภายในเว็บ เช่น "/apply"                         → ใช้ได้เลย
 *   2. URL เต็มของเว็บเราเอง เช่น "http://localhost:3000/"   → ตัดเหลือ path
 *      (NextAuth ส่งแบบนี้มาเมื่อเข้าผ่าน /api/auth/signin)
 *   3. อย่างอื่นทั้งหมด รวมถึงโดเมนภายนอกและ "//evil.com"    → ทิ้ง ใช้ค่าสำรอง
 *
 * ข้อ 3 คือหัวใจ ถ้าปล่อยผ่านจะกลายเป็นช่อง open redirect
 * ที่ใช้หลอกผู้ใช้ไปหน้าปลอมโดยอ้างว่ามาจากเว็บเรา
 */
export function resolveRedirect(
  candidate: string | null | undefined,
  origin: string,
  fallback = "/apply",
): string {
  if (!candidate) return fallback;

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    if (url.origin === origin) {
      return `${url.pathname}${url.search}` || "/";
    }
  } catch {
    // ไม่ใช่ URL ที่ parse ได้ ตกไปใช้ค่าสำรอง
  }

  return fallback;
}
