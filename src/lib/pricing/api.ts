import { NextResponse } from "next/server";
import { guardRole, type StaffSession } from "@/lib/auth/guard";

/**
 * ด่านตรวจและตัวช่วยตอบกลับของเส้นทาง /api/admin/* ทั้งหมดในฟีเจอร์ราคาจัด
 *
 * ไฟล์นี้ import @/auth ซึ่งลากไปถึง MongoDB — **เรียกได้จากฝั่งเซิร์ฟเวอร์เท่านั้น**
 * กติกาและรูปทรงข้อมูลที่ client component ต้องใช้อยู่ใน ./schema.ts ซึ่งไม่ import อะไรนอกจาก zod
 *
 * ── ทำไมเป็น admin เท่านั้น ──────────────────────────────────────────
 * layout ของ /admin ปล่อยทั้ง admin และ employee เข้ามาได้ แต่ราคาจัดคือตัวเลขที่ผูกกับเงิน
 * และไม่มี audit trail รายรายการเหมือนการเปลี่ยนสถานะใบสมัคร จึงถูกจัดชั้นเดียวกับ
 * /admin/users และ /admin/permissions คือ admin ล้วน
 *
 * ทางเลือกอีกทางคือเพิ่มสิทธิ์ใหม่ลง PERMISSION_DEFS ให้เปิดให้ employee ได้ตามต้องการ
 * ซึ่งสถาปัตยกรรมรองรับอยู่แล้ว แต่เป็นการตัดสินใจเชิงนโยบายที่สเปกไม่ได้สั่ง จึงเลือกทางที่แคบกว่าไว้ก่อน
 * ถ้าจะเปิดให้ employee: เพิ่ม managePricing ใน permission-defs.ts แล้วเปลี่ยน requireAdmin
 * ตรงนี้ให้เรียก can() — ต้องแก้ที่นี่ที่เดียวเพราะทุกเส้นทางเรียกผ่านฟังก์ชันนี้
 */
export async function requireAdmin(): Promise<
  { ok: true; staff: StaffSession } | { ok: false; response: NextResponse }
> {
  const result = await guardRole(["admin"]);

  if (result.allowed) return { ok: true, staff: result.staff };

  // 401 = ยังไม่ได้เข้าสู่ระบบ, 403 = เข้าระบบแล้วแต่ไม่มีสิทธิ์ — สองเรื่องนี้แก้คนละวิธี
  // ผู้เรียกจึงต้องแยกออกจากรหัสตอบกลับได้โดยไม่ต้องอ่านข้อความ
  return result.reason === "unauthenticated"
    ? { ok: false, response: jsonError("ต้องเข้าสู่ระบบก่อน", 401) }
    : { ok: false, response: jsonError("เฉพาะแอดมินเท่านั้นที่จัดการราคาจัดได้", 403) };
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

/** อ่าน JSON body แบบไม่ระเบิดเมื่อ body ว่างหรือไม่ใช่ JSON — ทั้งสองกรณีคือ 400 ไม่ใช่ 500 */
export async function readJsonBody(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/**
 * ห่อ handler ให้ข้อผิดพลาดที่ไม่ได้ดักไว้กลายเป็น 500 พร้อมข้อความไทย แทนที่จะเป็นหน้า error ของ Next
 *
 * เขียน console.error ไว้ด้วยเสมอ: ข้อความที่ส่งกลับหน้าเว็บตั้งใจให้กว้าง (ไม่บอกโครงสร้างภายใน)
 * ถ้าไม่ log ไว้ฝั่งเซิร์ฟเวอร์ จะไม่เหลืออะไรให้ไล่หาสาเหตุเลย
 */
export async function handle(
  label: string,
  run: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    console.error(`[pricing] ${label} ล้มเหลว`, error);
    return jsonError("ระบบขัดข้อง ลองใหม่อีกครั้ง", 500);
  }
}
