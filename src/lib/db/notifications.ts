import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./mongo";

/**
 * การแจ้งเตือนในระบบ (in-app)
 *
 * เก็บเป็น "หนึ่งแถวต่อหนึ่งผู้รับ" ไม่ใช่หนึ่งแถวต่อหนึ่งเหตุการณ์แล้วให้ผู้รับหลายคนอ่านร่วมกัน
 * เพราะสถานะ "อ่านแล้ว" เป็นของแต่ละคน ถ้าใช้แถวเดียวร่วมกัน พนักงานคนแรกที่กดอ่าน
 * จะทำให้คนอื่นเห็นว่าอ่านแล้วไปด้วย ซึ่งผิด — คิวงานของแต่ละคนต้องแยกจากกัน
 *
 * แลกกับการที่ใบสมัครหนึ่งใบสร้างหลายแถว (เท่าจำนวนเจ้าหน้าที่) ซึ่งยอมรับได้
 * เพราะจำนวนเจ้าหน้าที่มีหลักสิบ ไม่ใช่หลักหมื่น
 */
export type NotificationType = "application_submitted" | "status_changed";

export interface NotificationDoc {
  _id: ObjectId;
  /** users._id ของผู้รับ (เป็นสตริง เหมือน ownerUserId ที่อื่นในระบบ) */
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ปลายทางเมื่อกดที่การแจ้งเตือน */
  href: string;
  applicationId: string;
  readAt?: Date;
  createdAt: Date;
}

export interface PublicNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  applicationId: string;
  read: boolean;
  createdAt: string;
}

/** ดึงมาแสดงในกระดิ่งแค่นี้พอ — ถ้าค้างเกินนี้คือไม่ได้เข้ามาดูนานมาก การไล่อ่านทั้งหมดไม่ช่วยแล้ว */
export const NOTIFICATION_PAGE_SIZE = 15;

let indexesReady: Promise<void> | undefined;

async function notifications(): Promise<Collection<NotificationDoc>> {
  const db = await getDb();
  const col = db.collection<NotificationDoc>("notifications");

  indexesReady ??= (async () => {
    // คิวรีหลักคือ "ของฉัน เรียงใหม่สุดก่อน" — ดัชนีนี้รองรับทั้งการดึงรายการและการนับที่ยังไม่อ่าน
    await col.createIndex({ userId: 1, createdAt: -1 });
    // ล้างของเก่าอัตโนมัติหลัง 90 วัน กันคอลเลกชันโตไม่รู้จบ
    // การแจ้งเตือนเป็นของชั่วคราว ประวัติจริงอยู่ใน activities ซึ่งไม่ถูกลบ
    await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
  })();
  await indexesReady;

  return col;
}

function toPublic(doc: NotificationDoc): PublicNotification {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    href: doc.href,
    applicationId: doc.applicationId,
    read: Boolean(doc.readAt),
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  applicationId: string;
}

/** เขียนหลายรายการพร้อมกัน — ใช้ตอนกระจายให้เจ้าหน้าที่ทุกคน */
export async function createNotifications(items: NewNotification[]): Promise<void> {
  if (items.length === 0) return;
  const col = await notifications();
  const now = new Date();
  await col.insertMany(items.map((item) => ({ ...item, createdAt: now }) as NotificationDoc));
}

export async function listNotifications(
  userId: string,
  limit = NOTIFICATION_PAGE_SIZE,
): Promise<PublicNotification[]> {
  const col = await notifications();
  const docs = await col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map(toPublic);
}

export async function countUnread(userId: string): Promise<number> {
  const col = await notifications();
  // นับแบบมีเพดาน — ตัวเลขบนกระดิ่งแสดงแค่ "9+" อยู่แล้ว การนับ 400 รายการให้ครบไม่มีประโยชน์
  return col.countDocuments({ userId, readAt: { $exists: false } }, { limit: 99 });
}

/** อ่านรายการเดียว — ใช้ตอนผู้ใช้กดที่การแจ้งเตือนนั้น */
export async function markNotificationRead(userId: string, id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const col = await notifications();
  // userId อยู่ใน filter ด้วยเสมอ — กันการกดอ่านของคนอื่นด้วยการเดา id
  await col.updateOne(
    { _id: new ObjectId(id), userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const col = await notifications();
  await col.updateMany(
    { userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
}
