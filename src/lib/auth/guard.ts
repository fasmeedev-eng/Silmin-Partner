import { auth } from "@/auth";
import type { Role } from "./roles";

export interface StaffSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export type GuardResult =
  | { allowed: true; staff: StaffSession }
  | { allowed: false; reason: "unauthenticated" }
  | { allowed: false; reason: "inactive" | "forbidden"; role: Role; email: string };

/**
 * ด่านตรวจบทบาทสำหรับหน้าหลังบ้าน
 *
 * ต้องเรียกจาก layout หรือ page ที่รันบน Node runtime เท่านั้น ห้ามย้ายไป middleware
 * เพราะ middleware รันบน Edge ซึ่งอ่าน MongoDB ไม่ได้ และเราตั้งใจไม่เก็บ role ไว้ใน JWT
 * (จะได้แก้ role ในฐานข้อมูลแล้วมีผลทันทีโดยไม่ต้องให้ผู้ใช้ออกจากระบบ)
 * middleware ทำได้แค่กันคนที่ยังไม่ล็อกอิน — การกันตามบทบาทเกิดที่นี่
 *
 * role ใน session มาจาก getUserAccess ซึ่งอ่านฐานข้อมูลใหม่ทุก 30 วินาที
 * การถอดสิทธิ์คนจึงมีผลภายในครึ่งนาที ไม่ต้องรอให้เขาออกจากระบบ
 */
export async function guardRole(allowed: readonly Role[]): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user?.id) return { allowed: false, reason: "unauthenticated" };

  const role = session.user.role ?? "customer";
  const email = session.user.email ?? "";

  // บัญชีที่ถูกปิดใช้งานต้องเข้าไม่ได้ แม้บทบาทจะยังเป็น admin อยู่
  if (session.user.active === false) {
    return { allowed: false, reason: "inactive", role, email };
  }
  if (!allowed.includes(role)) {
    return { allowed: false, reason: "forbidden", role, email };
  }

  return {
    allowed: true,
    staff: {
      userId: session.user.id,
      email,
      name: session.user.name ?? email,
      role,
    },
  };
}

// คำแปลบทบาทอยู่ในไฟล์ข้อมูลล้วน เพื่อให้ client component ใช้ได้โดยไม่ลาก MongoDB ตาม
export { ROLE_LABELS, ROLES, type Role } from "./roles";
