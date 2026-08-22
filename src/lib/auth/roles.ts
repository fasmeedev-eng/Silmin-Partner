/**
 * บทบาทและคำแปล — ข้อมูลล้วน ไม่ import อะไรเลย
 *
 * แยกไฟล์นี้ออกมาโดยเจตนา client component ต้องใช้ค่าเหล่านี้
 * ถ้าปล่อยให้อยู่ใน guard.ts (ซึ่ง import auth → MongoDB) ตัวไดรเวอร์จะถูกลากเข้า bundle
 * ของเบราว์เซอร์ แล้ว build พังด้วยข้อความ "Can't resolve 'child_process'" ที่ไม่บอกสาเหตุจริง
 */
export type Role = "customer" | "employee" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "แอดมิน",
  employee: "พนักงานร้าน",
  customer: "ลูกค้า",
};

export const ROLES: Role[] = ["customer", "employee", "admin"];
