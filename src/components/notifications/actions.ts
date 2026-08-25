"use server";

import { auth } from "@/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/db/notifications";

/**
 * ทั้งสอง action อ่านผู้ใช้จาก session เท่านั้น ไม่รับ userId เข้ามาเป็นพารามิเตอร์
 * server action ถูกยิงตรงได้โดยไม่ผ่านหน้าจอ ถ้ารับ userId มาก็เท่ากับเปิดให้ใครก็ได้
 * ไปกดอ่านการแจ้งเตือนของคนอื่น — ชั้น DB ยังใส่ userId ใน filter ซ้ำอีกชั้นด้วย
 */
export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await markAllNotificationsRead(session.user.id);
  return { ok: true };
}

export async function markReadAction(id: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await markNotificationRead(session.user.id, id);
  return { ok: true };
}
