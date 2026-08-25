import { createNotifications, type NewNotification } from "@/lib/db/notifications";
import { listActiveStaffIds } from "@/lib/db/users";
import { STATUS_META } from "@/lib/application/status";
import type { ApplicationStatus } from "@/lib/db/applications";

/**
 * ชั้นส่งการแจ้งเตือน
 *
 * ตอนนี้มีช่องทางเดียวคือในระบบ (in-app) ตามที่ผู้ใช้กำหนด — ไม่ส่งอีเมลและไม่ส่ง LINE
 * แต่จุดเรียกใช้ทั้งหมดเรียกผ่าน `deliver()` ไม่ได้เรียก createNotifications ตรง ๆ
 * การเพิ่มช่องทางในอนาคต (LINE OA ที่เลื่อนไว้) จึงเป็นการเพิ่มฟังก์ชันในไฟล์นี้ไฟล์เดียว
 * ไม่ต้องไปแก้ทุกที่ที่เกิดเหตุการณ์
 *
 * **การแจ้งเตือนล้มเหลวต้องไม่ทำให้การกระทำหลักล้มเหลว** ทุกจุดเรียกจึงหุ้ม try/catch ไว้
 * คนส่งใบสมัครต้องส่งได้แม้ระบบแจ้งเตือนพัง — ใบสมัครคือของจริง การแจ้งเตือนคือของประกอบ
 */
async function deliver(items: NewNotification[]): Promise<void> {
  await createNotifications(items);
}

/** ตัดข้อความยาวให้พอดีกับกระดิ่ง โดยไม่ตัดกลางคำจนอ่านไม่รู้เรื่อง */
function truncate(text: string, max = 120): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/**
 * ใบสมัครใหม่เข้ามา → แจ้งเจ้าหน้าที่ทุกคน
 *
 * ไม่แจ้งผู้สมัคร เพราะเขาเป็นคนกดส่งเอง และเพิ่งเห็นหน้า "ส่งใบสมัครสำเร็จ" ไปแล้ว
 * การแจ้งเตือนสิ่งที่ผู้ใช้เพิ่งทำเองคือเสียงรบกวน
 */
export async function notifyStaffOfNewApplication(input: {
  applicationId: string;
  shopName: string;
  province?: string;
}): Promise<void> {
  const staffIds = await listActiveStaffIds();
  if (staffIds.length === 0) return;

  const where = input.province ? ` · ${input.province}` : "";
  await deliver(
    staffIds.map((userId) => ({
      userId,
      type: "application_submitted" as const,
      title: "ใบสมัครใหม่รอตรวจ",
      body: truncate(`${input.shopName || "ไม่ได้ระบุชื่อร้าน"}${where}`),
      href: `/admin/${input.applicationId}`,
      applicationId: input.applicationId,
    })),
  );
}

/**
 * สถานะเปลี่ยน → แจ้งผู้สมัครเจ้าของใบ
 *
 * ไม่แจ้งเจ้าหน้าที่ เพราะเจ้าหน้าที่เป็นคนกดเปลี่ยนเอง
 * ข้อความใช้ประโยค "แล้วยังไงต่อ" จาก STATUS_META ซึ่งเป็นแหล่งเดียวกับที่หน้า /me ใช้
 * ถ้าเจ้าหน้าที่เขียนข้อความถึงร้านมาด้วย ให้ข้อความนั้นแทน เพราะเจาะจงกว่าคำอธิบายทั่วไป
 */
export async function notifyApplicantOfStatusChange(input: {
  applicationId: string;
  ownerUserId: string;
  to: ApplicationStatus;
  message?: string;
}): Promise<void> {
  const meta = STATUS_META[input.to];
  await deliver([
    {
      userId: input.ownerUserId,
      type: "status_changed",
      title: `ใบสมัครของคุณ: ${meta.label}`,
      body: truncate(input.message?.trim() || meta.detail),
      href: `/me/${input.applicationId}`,
      applicationId: input.applicationId,
    },
  ]);
}
