import { getDb } from "./mongo";

/**
 * ร่องรอยการเปลี่ยนสิทธิ์และบทบาท
 *
 * แยกจาก activities เพราะ activities ผูกกับใบสมัคร แต่เรื่องพวกนี้ผูกกับตัวระบบ
 * และเป็นสิ่งแรกที่ต้องเปิดดูเวลามีคำถามว่า "ใครให้สิทธิ์คนนี้"
 */
export interface AdminAuditEntry {
  actorUserId: string;
  actorEmail: string;
  action: "role_changed" | "active_changed" | "permissions_changed";
  /** อีเมลของคนที่ถูกกระทำ — ว่างไว้ถ้าเป็นการตั้งค่าระดับระบบ */
  targetEmail?: string;
  detail: string;
  at: Date;
}

let adminAuditIndexesReady: Promise<void> | undefined;
async function ensureAdminAuditIndexes(): Promise<void> {
  adminAuditIndexesReady ??= (async () => {
    const db = await getDb();
    await db.collection<AdminAuditEntry>("adminAudit").createIndex({ at: -1 });
  })();
  await adminAuditIndexesReady;
}

export async function writeAdminAudit(entry: Omit<AdminAuditEntry, "at">): Promise<void> {
  await ensureAdminAuditIndexes();
  const db = await getDb();
  const col = db.collection<AdminAuditEntry>("adminAudit");
  await col.insertOne({ ...entry, at: new Date() });
}

export async function listAdminAudit(limit = 30): Promise<AdminAuditEntry[]> {
  const db = await getDb();
  return db
    .collection<AdminAuditEntry>("adminAudit")
    .find({})
    .sort({ at: -1 })
    .limit(limit)
    .toArray();
}
