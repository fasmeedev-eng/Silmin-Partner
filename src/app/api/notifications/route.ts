import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { countUnread, listNotifications } from "@/lib/db/notifications";

/**
 * รายการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่
 *
 * กระดิ่งเรนเดอร์ครั้งแรกด้วยข้อมูลจากฝั่งเซิร์ฟเวอร์อยู่แล้ว เส้นทางนี้มีไว้ให้มัน
 * ถามซ้ำเป็นระยะ เพื่อให้เจ้าหน้าที่ที่เปิดหน้าคิวค้างไว้ทั้งวันเห็นใบใหม่โดยไม่ต้องรีเฟรช
 *
 * ไม่รับ userId จาก query — อ่านจาก session เท่านั้น ไม่งั้นใครก็ดูแจ้งเตือนของคนอื่นได้
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(session.user.id),
    countUnread(session.user.id),
  ]);

  // ห้ามแคช — เป็นข้อมูลเฉพาะบุคคลและเปลี่ยนตลอดเวลา
  return NextResponse.json({ items, unread }, { headers: { "Cache-Control": "no-store" } });
}
