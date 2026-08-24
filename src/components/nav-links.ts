/**
 * เมนูไปยังส่วนต่าง ๆ ของหน้าแรก
 *
 * ชี้เป็น "/#id" ไม่ใช่ "#id" เพราะแถบนำทางใช้ร่วมกันทุกหน้า — ถ้าใช้ "#id" เฉย ๆ
 * การกดจากหน้า /apply จะไปหาหัวข้อในหน้านั้นแทนที่จะกลับมาหน้าแรก
 *
 * ไฟล์นี้ไม่ import อะไรเลยโดยตั้งใจ ทั้ง server component (SiteHeader) และ
 * client component (MobileNav) จึงใช้ร่วมกันได้โดยไม่ลากอะไรเข้าบันเดิลฝั่ง browser
 */
export interface NavLink {
  href: string;
  label: string;
}

export const SECTION_LINKS: readonly NavLink[] = [
  { href: "/#top", label: "หน้าหลัก" },
  { href: "/#benefits", label: "สิทธิประโยชน์" },
  { href: "/#process", label: "ขั้นตอนการสมัคร" },
  { href: "/#faq", label: "คำถามที่พบบ่อย" },
  { href: "/#contact", label: "ติดต่อเรา" },
];
