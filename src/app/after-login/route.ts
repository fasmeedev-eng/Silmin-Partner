import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * ปลายทางหลังเข้าสู่ระบบเมื่อยังไม่รู้ว่าผู้ใช้ตั้งใจไปไหน
 *
 * บทบาทรู้ได้ก็ต่อเมื่อล็อกอินเสร็จแล้ว ตอนกดปุ่ม "เข้าสู่ระบบ" ระบบยังไม่รู้ว่าคนนี้เป็นใคร
 * จึงส่งมาที่นี่ก่อนแล้วค่อยแยกทาง — เจ้าหน้าที่เข้าหลังบ้าน ร้านค้าไปหน้าใบสมัครของตัวเอง
 *
 * ปุ่มที่มีเจตนาชัดอยู่แล้ว (เช่น "สมัครเป็นพาร์ทเนอร์" → /apply) ไม่ต้องผ่านที่นี่
 * เพราะเจตนาของผู้ใช้สำคัญกว่าบทบาท แอดมินที่กดสมัครก็ควรได้ไปหน้าสมัครจริง ๆ
 */
export async function GET(request: Request) {
  const session = await auth();
  const origin = new URL(request.url).origin;

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const role = session.user.role;
  const isStaff = session.user.active !== false && (role === "admin" || role === "employee");

  return NextResponse.redirect(new URL(isStaff ? "/admin" : "/me", origin));
}
