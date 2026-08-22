import { ObjectId, type Collection, type Filter } from "mongodb";
import { getDb } from "./mongo";
import { draftSchema, emptyApplication, type ApplicationData } from "@/lib/application/schema";
import { filedFileName, type DocumentRef } from "@/lib/application/documents";
import { diffApplicationData, type FieldChange } from "@/lib/application/diff";
import { REQUIRED_CATEGORIES } from "@/lib/application/categories";
import { EDITABLE_STATUSES, STATUS_META, isEditable } from "@/lib/application/status";
import { canTransition } from "@/lib/application/transitions";
import { moveAndRename } from "@/lib/drive/client";
import { ensureFolders } from "@/lib/drive/folders";

export type ApplicationStatus =
  | "Draft"
  | "New"
  | "Reviewing"
  | "NeedMoreInfo"
  | "Approved"
  | "Rejected"
  | "Onboarding"
  | "ActivePartner";

export interface ConsentRecord {
  accepted: boolean;
  at: Date;
}

export interface ApplicationDoc {
  _id: ObjectId;
  /** มีค่าเมื่อส่งใบสมัครแล้วเท่านั้น ร่างยังไม่กินเลขที่ */
  applicationId?: string;
  ownerUserId: string;
  status: ApplicationStatus;
  data: ApplicationData;
  /** ตัวชี้ไปยังไฟล์บน Drive — ฐานข้อมูลไม่เก็บตัวไฟล์ */
  documents?: DocumentRef[];
  consent?: {
    truthful: ConsentRecord;
    pdpa: ConsentRecord;
    policyVersion: string;
    ip: string;
    userAgent: string;
  };
  /** ข้อความล่าสุดจากเจ้าหน้าที่ถึงผู้สมัคร — ผู้สมัครเห็นบนหน้า /me */
  statusMessage?: string;
  statusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

/** เวอร์ชันนโยบายที่ผู้ใช้กดยอมรับ ต้องขยับเลขทุกครั้งที่แก้เนื้อหานโยบาย
 *  ไม่งั้นจะพิสูจน์ไม่ได้ว่าตอนนั้นเขายอมรับข้อความแบบไหน */
export const PRIVACY_POLICY_VERSION = "2026-08-21";

let indexesReady: Promise<void> | undefined;

async function applications(): Promise<Collection<ApplicationDoc>> {
  const db = await getDb();
  const col = db.collection<ApplicationDoc>("applications");

  indexesReady ??= (async () => {
    // เลขที่ใบสมัครห้ามซ้ำ แต่ร่างยังไม่มีเลข จึงต้องเป็น partial ไม่ใช่ unique เฉย ๆ
    await col.createIndex(
      { applicationId: 1 },
      { unique: true, partialFilterExpression: { applicationId: { $type: "string" } } },
    );
    // หนึ่งคนมีร่างได้ใบเดียว กันร่างค้างซ้อนกันจากการเปิดหลายแท็บ
    await col.createIndex(
      { ownerUserId: 1 },
      { unique: true, partialFilterExpression: { status: "Draft" } },
    );
    await col.createIndex({ ownerUserId: 1, submittedAt: -1 });
    await col.createIndex({ status: 1, submittedAt: -1 });
  })();
  await indexesReady;

  return col;
}

/** อ่านร่างของผู้ใช้ ถ้ายังไม่มีก็คืนฟอร์มเปล่า (ยังไม่เขียนฐานข้อมูลจนกว่าจะกรอกจริง) */
export async function loadDraft(ownerUserId: string): Promise<ApplicationData> {
  const col = await applications();
  const doc = await col.findOne({ ownerUserId, status: "Draft" });
  if (!doc) return emptyApplication();

  // ร่างเก่าอาจมีรูปทรงไม่ตรงกับสคีมาปัจจุบัน เติมค่าที่ขาดแทนที่จะพัง
  const parsed = draftSchema.safeParse(doc.data);
  return parsed.success ? parsed.data : emptyApplication();
}

export async function saveDraft(ownerUserId: string, data: ApplicationData): Promise<void> {
  const col = await applications();
  const now = new Date();
  await col.updateOne(
    { ownerUserId, status: "Draft" },
    {
      $set: { data, updatedAt: now },
      $setOnInsert: { ownerUserId, status: "Draft" as const, createdAt: now },
    },
    { upsert: true },
  );
}

/* ── เอกสารแนบของร่าง ─────────────────────────────────────────── */

export async function listDraftDocuments(ownerUserId: string): Promise<DocumentRef[]> {
  const col = await applications();
  const doc = await col.findOne(
    { ownerUserId, status: "Draft" },
    { projection: { documents: 1 } },
  );
  return doc?.documents ?? [];
}

export async function addDocumentToDraft(
  ownerUserId: string,
  ref: DocumentRef,
): Promise<void> {
  const col = await applications();
  const now = new Date();
  await col.updateOne(
    { ownerUserId, status: "Draft" },
    {
      $push: { documents: ref },
      $set: { updatedAt: now },
      $setOnInsert: {
        ownerUserId,
        status: "Draft" as const,
        data: emptyApplication(),
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

/** คืน driveFileId ที่ต้องลบบน Drive ถ้าไม่พบเอกสารของเจ้าของคนนี้จะได้ undefined */
export async function removeDocumentFromDraft(
  ownerUserId: string,
  documentId: string,
): Promise<string | undefined> {
  const col = await applications();
  const doc = await col.findOne(
    { ownerUserId, status: "Draft" },
    { projection: { documents: 1 } },
  );
  const target = doc?.documents?.find((d) => d.id === documentId);
  if (!target) return undefined;

  await col.updateOne(
    { ownerUserId, status: "Draft" },
    { $pull: { documents: { id: documentId } }, $set: { updatedAt: new Date() } },
  );
  return target.driveFileId;
}

/** ใช้โดยพร็อกซีอ่านไฟล์ — ต้องยืนยันว่าเอกสารเป็นของผู้ใช้คนนี้ก่อนเสมอ */
export async function findOwnedDocument(
  ownerUserId: string,
  documentId: string,
): Promise<DocumentRef | undefined> {
  const col = await applications();
  const doc = await col.findOne(
    { ownerUserId, "documents.id": documentId },
    { projection: { documents: 1 } },
  );
  return doc?.documents?.find((d) => d.id === documentId);
}

/** ใช้โดยเจ้าหน้าที่เท่านั้น — ไม่ผูกกับเจ้าของ จึงต้องมีด่านตรวจบทบาทคุมก่อนเรียก */
export async function findDocumentAnyOwner(documentId: string): Promise<
  { document: DocumentRef; applicationId?: string; ownerUserId: string } | undefined
> {
  const col = await applications();
  const doc = await col.findOne(
    { "documents.id": documentId },
    { projection: { documents: 1, applicationId: 1, ownerUserId: 1 } },
  );
  const document = doc?.documents?.find((d) => d.id === documentId);
  if (!doc || !document) return undefined;
  return { document, applicationId: doc.applicationId, ownerUserId: doc.ownerUserId };
}

interface DocumentAccessLog {
  documentId: string;
  applicationId?: string;
  fileName: string;
  actorUserId: string;
  actorEmail: string;
  at: Date;
}

// การเปิดดูรูปหนึ่งครั้งยิงพร็อกซีหลายรอบ (thumbnail แล้วกดเปิดเต็ม) ถ้าบันทึกทุกครั้ง
// บันทึกจะท่วมจนหาของจริงไม่เจอ จึงรวมการเข้าถึงของคนเดิมกับไฟล์เดิมภายใน 10 นาทีเป็นครั้งเดียว
const ACCESS_DEDUPE_MS = 10 * 60 * 1000;
const recentAccess = new Map<string, number>();

let documentAccessIndexesReady: Promise<void> | undefined;
async function ensureDocumentAccessIndexes(): Promise<void> {
  // ครั้งเดียวต่อ process เหมือน indexesReady ของ applications() — ไม่ใช่ยิงทุกครั้งที่บันทึก
  documentAccessIndexesReady ??= (async () => {
    const db = await getDb();
    const col = db.collection<DocumentAccessLog>("documentAccess");
    await col.createIndex({ applicationId: 1, at: -1 });
    await col.createIndex({ actorUserId: 1, at: -1 });
  })();
  await documentAccessIndexesReady;
}

/**
 * บันทึกว่าเจ้าหน้าที่คนไหนเปิดเอกสารอะไรเมื่อไหร่
 *
 * เก็บแยก collection ไม่ปนกับ activities เพราะนี่คือร่องรอยเพื่อการตรวจสอบความปลอดภัย
 * ไม่ใช่เรื่องราวของใบสมัครที่ผู้สมัครควรเห็น และปริมาณต่างกันคนละระดับ
 */
export async function logDocumentAccess(entry: Omit<DocumentAccessLog, "at">): Promise<void> {
  const key = `${entry.actorUserId}:${entry.documentId}`;
  const now = Date.now();
  const last = recentAccess.get(key);
  if (last && now - last < ACCESS_DEDUPE_MS) return;
  recentAccess.set(key, now);

  // แมปนี้อยู่ยาวตลอดอายุ process — ล้างคู่ที่หมดอายุหน้าต่างกันดักซ้ำทุกครั้งที่เขียน
  // ไม่งั้นทุกคู่เจ้าหน้าที่/เอกสารที่เคยเปิดดูจะค้างอยู่ในหน่วยความจำตลอดไป
  for (const [k, t] of recentAccess) {
    if (now - t >= ACCESS_DEDUPE_MS) recentAccess.delete(k);
  }

  await ensureDocumentAccessIndexes();
  const db = await getDb();
  const col = db.collection<DocumentAccessLog>("documentAccess");
  await col.insertOne({ ...entry, at: new Date() });
}

/**
 * ออกเลขที่ใบสมัครแบบอะตอมมิก
 *
 * ห้ามใช้ countDocuments() + 1 เด็ดขาด — ถ้าสองคนกดส่งพร้อมกันจะได้เลขเดียวกัน
 * findOneAndUpdate + $inc ทำงานเป็นหน่วยเดียวในระดับเอกสาร จึงไม่มีทางชนกัน
 * และยังมี unique index บน applicationId คอยกันไว้อีกชั้น
 */
async function nextApplicationId(year: number): Promise<string> {
  const db = await getDb();
  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: `application-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = result?.seq ?? 1;
  return `SG-${year}-${String(seq).padStart(6, "0")}`;
}

export interface SubmitMeta {
  ip: string;
  userAgent: string;
}

/** เมื่อไม่พบร่างให้แปลง — หาใบที่ส่งไปแล้วล่าสุดของเจ้าของคนนี้แทนการสร้างใบใหม่ซ้ำ
 *  เกิดได้เมื่อดับเบิลคลิกปุ่มส่งหรือเปิดสองแท็บพร้อมกัน คำขอที่มาทีหลังต้องคืนใบเดิม ไม่ใช่ใบใหม่ */
async function mostRecentSubmitted(
  col: Collection<ApplicationDoc>,
  ownerUserId: string,
): Promise<string | undefined> {
  const doc = await col.findOne(
    { ownerUserId, status: { $ne: "Draft" } },
    { sort: { submittedAt: -1 }, projection: { applicationId: 1 } },
  );
  return doc?.applicationId;
}

/** เปลี่ยนร่างเป็นใบสมัครจริง คืนเลขที่ใบสมัคร */
export async function submitApplication(
  ownerUserId: string,
  data: ApplicationData,
  meta: SubmitMeta,
): Promise<string> {
  const col = await applications();
  const now = new Date();

  const draft = await col.findOne(
    { ownerUserId, status: "Draft" },
    { projection: { documents: 1 } },
  );
  if (!draft) {
    // ไม่มีร่างให้แปลง แปลว่าถูกส่งไปแล้วโดยคำขอที่ชนกัน — คืนใบเดิม อย่าสร้างใบซ้ำ
    const existing = await mostRecentSubmitted(col, ownerUserId);
    if (existing) return existing;
    throw new Error("ไม่พบร่างใบสมัคร กรุณากรอกใหม่อีกครั้ง");
  }

  // ออกเลขที่ใบสมัครหลังยืนยันว่ามีร่างจริงแล้วเท่านั้น เพื่อไม่ให้เลขถูกใช้ทิ้งเปล่า ๆ
  const applicationId = await nextApplicationId(now.getFullYear());
  const documents = await fileDocuments(draft.documents ?? [], applicationId, data.shop.name);

  const consent = {
    truthful: { accepted: true, at: now },
    pdpa: { accepted: true, at: now },
    policyVersion: PRIVACY_POLICY_VERSION,
    ip: meta.ip,
    userAgent: meta.userAgent,
  };

  // upsert: false โดยตั้งใจ — ถ้าไม่เจอร่างแล้ว (ถูกแปลงไปแล้วระหว่างที่กำลังย้ายไฟล์)
  // ต้องไม่สร้างใบสมัครใหม่ซ้อนขึ้นมา
  const result = await col.findOneAndUpdate(
    { ownerUserId, status: "Draft" },
    {
      $set: {
        applicationId,
        status: "New" as const,
        data,
        documents,
        consent,
        submittedAt: now,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    const existing = await mostRecentSubmitted(col, ownerUserId);
    if (existing) return existing;
    throw new Error("ส่งใบสมัครไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  // กันร่างผีฟื้น — ถ้า autosave ที่ตั้งเวลาไว้ฝั่ง client ยิงตามหลังการส่ง
  // มันจะ upsert ร่างใบใหม่ด้วยข้อมูลชุดเดิม แล้วผู้ใช้จะเห็นร่างค้างและอาจส่งซ้ำ
  // ฝั่ง client กันไว้แล้ว แต่เซิร์ฟเวอร์ต้องกันเองด้วย ห้ามเชื่อว่า client ทำถูกเสมอ
  await col.deleteMany({ ownerUserId, status: "Draft" });

  await writeActivity({
    applicationId,
    actorUserId: ownerUserId,
    type: "submitted",
    message: "ผู้สมัครส่งใบสมัคร",
    at: now,
  });

  return result.applicationId ?? applicationId;
}

/**
 * ย้ายไฟล์จาก _pending เข้าโฟลเดอร์หมวด พร้อมตั้งชื่อตามเลขที่ใบสมัคร
 *
 * ตอนอัปโหลดยังไม่มีเลขที่ใบสมัคร (เลขเกิดตอนกดส่ง) ไฟล์จึงต้องพักไว้ก่อนแล้วค่อยย้าย
 * ใช้ files.update ของ Drive ไม่ได้อัปโหลดซ้ำ จึงเร็วและไม่กินโควตาเพิ่ม
 *
 * ถ้าย้ายไฟล์ใดไม่สำเร็จ จะคงสถานะ pending ไว้แล้วไปต่อ — ใบสมัครต้องถูกบันทึกให้ได้
 * เสียอย่างยิ่งกว่าคือผู้ใช้กดส่งแล้วล้มเหลวทั้งใบเพราะไฟล์เดียวย้ายไม่ผ่าน
 */
async function fileDocuments(
  documents: DocumentRef[],
  applicationId: string,
  shopName: string,
): Promise<DocumentRef[]> {
  const pending = documents.filter((d) => d.driveState === "pending");
  if (pending.length === 0) return documents;

  const folders = await ensureFolders();
  const counters = new Map<string, number>();

  return Promise.all(
    documents.map(async (document) => {
      if (document.driveState === "filed") return document;

      const index = (counters.get(document.category) ?? 0) + 1;
      counters.set(document.category, index);

      const target = folders.categories[document.category];
      if (!target) return document;

      const name = filedFileName(applicationId, shopName, index, document.mimeType);
      try {
        await moveAndRename(document.driveFileId, name, target, folders.pending);
        return { ...document, fileName: document.fileName, driveState: "filed" as const };
      } catch (error) {
        console.error(`ย้ายไฟล์ ${document.driveFileId} ไม่สำเร็จ`, error);
        return document;
      }
    }),
  );
}

export async function listOwnApplications(ownerUserId: string) {
  const col = await applications();
  return col
    .find(
      { ownerUserId, status: { $ne: "Draft" } },
      {
        projection: {
          applicationId: 1,
          status: 1,
          submittedAt: 1,
          documents: 1,
          "data.shop.name": 1,
          "data.shop.address.province": 1,
        },
      },
    )
    .sort({ submittedAt: -1 })
    .limit(50)
    .toArray();
}

/* ── คิวงานหลังบ้าน ───────────────────────────────────────────
   เจ้าหน้าที่ทุกคนเห็นทุกใบ (ไม่มีการมอบหมายผู้ดูแล) ความต่างของบทบาท
   อยู่ที่ "ทำอะไรได้" ไม่ใช่ "เห็นอะไร" — ดู guardRole และตารางสิทธิ์ */

export const ADMIN_PAGE_SIZE = 20;

export interface AdminListFilters {
  /** กรองด้วยสถานะเดียว หรือด้วยกองงาน (bucket) ที่รวมหลายสถานะ */
  status?: ApplicationStatus;
  statuses?: ApplicationStatus[];
  province?: string;
  documents?: "complete" | "incomplete";
  q?: string;
  sort?: "newest" | "oldest";
  page?: number;
}

/** กันอักขระพิเศษของ regex ไม่ให้คำค้นกลายเป็นแพตเทิร์นที่ทำเซิร์ฟเวอร์ช้าหรือพัง */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** เอกสารครบ = มีครบทุกหมวดที่บังคับ สร้างเงื่อนไขจาก REQUIRED_CATEGORIES
 *  เพื่อไม่ให้นิยามในฐานข้อมูลกับในฟอร์มหลุดจากกัน */
function documentsFilter(mode: "complete" | "incomplete") {
  const hasAll = REQUIRED_CATEGORIES.map((category) => ({
    "documents.category": category.id,
  }));
  return mode === "complete" ? { $and: hasAll } : { $nor: [{ $and: hasAll }] };
}

function buildQuery(filters: AdminListFilters): Filter<ApplicationDoc> {
  const query: Filter<ApplicationDoc> = { status: { $ne: "Draft" } };

  if (filters.status) query.status = filters.status;
  else if (filters.statuses?.length) query.status = { $in: filters.statuses };
  if (filters.province) query["data.shop.address.province"] = filters.province;

  const conditions: Filter<ApplicationDoc>[] = [];
  if (filters.documents) conditions.push(documentsFilter(filters.documents));

  const term = filters.q?.trim();
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    // ค้นเบอร์โทรด้วยตัวเลขล้วน เพราะฐานข้อมูลเก็บแบบไม่มีขีดคั่น
    const digits = term.replace(/\D/g, "");
    const or: Filter<ApplicationDoc>[] = [
      { applicationId: pattern },
      { "data.shop.name": pattern },
      { "data.contact.fullName": pattern },
    ];
    if (digits.length >= 3) or.push({ "data.contact.phone": new RegExp(escapeRegex(digits)) });
    conditions.push({ $or: or });
  }

  if (conditions.length > 0) query.$and = conditions;
  return query;
}

export async function listAllApplications(filters: AdminListFilters) {
  const col = await applications();
  const query = buildQuery(filters);
  const page = Math.max(1, filters.page ?? 1);

  const [items, total] = await Promise.all([
    col
      .find(query, {
        projection: {
          applicationId: 1,
          status: 1,
          submittedAt: 1,
          updatedAt: 1,
          documents: 1,
          "data.shop.name": 1,
          "data.shop.address.province": 1,
          "data.contact.fullName": 1,
          "data.contact.phone": 1,
        },
      })
      .sort({ submittedAt: filters.sort === "oldest" ? 1 : -1 })
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .toArray(),
    col.countDocuments(query),
  ]);

  return { items, total, page, pageSize: ADMIN_PAGE_SIZE };
}

/** จำนวนใบในแต่ละสถานะ ใช้ทำแถวสรุปด้านบนคิวงาน */
export async function countByStatus(): Promise<Record<string, number>> {
  const col = await applications();
  const rows = await col
    .aggregate<{ _id: ApplicationStatus; count: number }>([
      { $match: { status: { $ne: "Draft" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((row) => [row._id, row.count]));
}

/** จังหวัดที่มีใบสมัครจริง ใช้ทำตัวเลือกฟิลเตอร์ ไม่ต้องโชว์ครบ 77 จังหวัด */
export async function listUsedProvinces(): Promise<string[]> {
  const col = await applications();
  const values = await col.distinct("data.shop.address.province", {
    status: { $ne: "Draft" },
  });
  return values.filter((value): value is string => Boolean(value)).sort();
}

/**
 * อ่านใบสมัครหนึ่งใบของผู้ใช้คนนี้
 * กรองด้วย ownerUserId ในคิวรีเสมอ ไม่ใช่ดึงมาแล้วค่อยเช็คทีหลัง
 * และไม่ใช่แค่ซ่อนลิงก์ในหน้าเว็บ — คนที่เดาเลขที่ใบสมัครต้องไม่เห็นอะไรเลย
 */
export async function findOwnApplication(ownerUserId: string, applicationId: string) {
  const col = await applications();
  return col.findOne({ ownerUserId, applicationId });
}

export async function findOwnDraft(ownerUserId: string) {
  const col = await applications();
  return col.findOne(
    { ownerUserId, status: "Draft" },
    { projection: { updatedAt: 1, "data.shop.name": 1 } },
  );
}

export interface Activity {
  applicationId: string;
  actorUserId: string;
  type: string;
  message: string;
  at: Date;
  /**
   * internal = เจ้าหน้าที่เท่านั้นที่เห็น · applicant = ผู้สมัครเห็นด้วย
   * ค่าที่ไม่ได้ระบุถือว่า applicant เพื่อให้ activity เก่าที่บันทึกก่อนมีฟิลด์นี้ยังแสดงถูก
   */
  visibility?: "internal" | "applicant";
  /** ชื่อหรืออีเมลของผู้ทำ ใช้แสดงในไทม์ไลน์หลังบ้าน */
  actorLabel?: string;
  /** รายการช่องที่เปลี่ยน มีเฉพาะ activity ประเภทแก้ไขข้อมูล */
  changes?: FieldChange[];
}

let activityIndexesReady: Promise<void> | undefined;
async function ensureActivityIndexes(): Promise<void> {
  activityIndexesReady ??= (async () => {
    const db = await getDb();
    await db.collection<Activity>("activities").createIndex({ applicationId: 1, at: -1 });
  })();
  await activityIndexesReady;
}

/** บันทึกร่องรอยการเปลี่ยนแปลง — ทุกการเปลี่ยนสถานะต้องรู้ว่าใครทำ เมื่อไหร่ เพราะอะไร */
async function writeActivity(activity: Activity): Promise<void> {
  await ensureActivityIndexes();
  const db = await getDb();
  const col = db.collection<Activity>("activities");
  await col.insertOne(activity);
}

/**
 * ค่าเริ่มต้นคืน "เฉพาะที่ผู้สมัครเห็นได้" โดยตั้งใจ
 * ถ้าค่าเริ่มต้นเป็นคืนทุกอย่าง วันหนึ่งจะมีคนเรียกจากหน้าผู้สมัครแล้วโน้ตภายในหลุด
 */
export async function listActivities(
  applicationId: string,
  options: { includeInternal?: boolean } = {},
): Promise<Activity[]> {
  const db = await getDb();
  const filter: Filter<Activity> = options.includeInternal
    ? { applicationId }
    : { applicationId, visibility: { $ne: "internal" } };

  return db
    .collection<Activity>("activities")
    .find(filter)
    .sort({ at: -1 })
    .limit(100)
    .toArray();
}

/* ── การดำเนินการของเจ้าหน้าที่ ───────────────────────────────── */

export interface StaffActor {
  userId: string;
  label: string;
}

export type StatusChangeResult =
  | { ok: true; from: ApplicationStatus; to: ApplicationStatus }
  | { ok: false; reason: "not_found" | "not_allowed" | "changed"; current?: ApplicationStatus };

/**
 * เปลี่ยนสถานะโดยเจ้าหน้าที่
 *
 * ใส่สถานะปัจจุบันไว้ในเงื่อนไขของ updateOne ด้วย ไม่ใช่แค่เช็คก่อนเขียน
 * เพราะถ้าเจ้าหน้าที่สองคนเปิดใบเดียวกันแล้วกดพร้อมกัน คนที่กดทีหลังจะเขียนทับ
 * การตัดสินใจของคนแรกโดยที่ทั้งคู่ไม่รู้ตัว
 *
 * message คือข้อความถึงผู้สมัคร — เก็บไว้บนใบสมัครเพื่อให้หน้า /me อ่านได้
 * ส่วน internalNote เป็นคนละเรื่อง เก็บเป็น activity ที่ผู้สมัครมองไม่เห็น
 */
export async function changeStatus(
  applicationId: string,
  actor: StaffActor,
  to: ApplicationStatus,
  message: string,
): Promise<StatusChangeResult> {
  const col = await applications();
  const current = await col.findOne(
    { applicationId },
    { projection: { status: 1 } },
  );
  if (!current) return { ok: false, reason: "not_found" };
  if (!canTransition(current.status, to)) {
    return { ok: false, reason: "not_allowed", current: current.status };
  }

  const now = new Date();
  const result = await col.updateOne(
    { applicationId, status: current.status },
    {
      $set: {
        status: to,
        statusMessage: message,
        statusChangedAt: now,
        updatedAt: now,
      },
    },
  );
  if (result.matchedCount === 0) {
    return { ok: false, reason: "changed", current: current.status };
  }

  await writeActivity({
    applicationId,
    actorUserId: actor.userId,
    actorLabel: actor.label,
    type: "status_changed",
    message: message
      ? `เปลี่ยนสถานะเป็น "${STATUS_META[to].label}" — ${message}`
      : `เปลี่ยนสถานะเป็น "${STATUS_META[to].label}"`,
    visibility: "applicant",
    at: now,
  });

  return { ok: true, from: current.status, to };
}

export async function addInternalNote(
  applicationId: string,
  actor: StaffActor,
  note: string,
): Promise<boolean> {
  const col = await applications();
  const exists = await col.findOne({ applicationId }, { projection: { _id: 1 } });
  if (!exists) return false;

  await writeActivity({
    applicationId,
    actorUserId: actor.userId,
    actorLabel: actor.label,
    type: "note",
    message: note,
    visibility: "internal",
    at: new Date(),
  });
  return true;
}

export async function findApplication(applicationId: string) {
  const col = await applications();
  return col.findOne({ applicationId });
}

/* ── การแก้ไขใบสมัครหลังส่ง ───────────────────────────────────── */

export type UpdateResult =
  | { ok: true; changes: FieldChange[] }
  | { ok: false; reason: "not_found" | "locked"; status?: ApplicationStatus };

/**
 * ผู้สมัครแก้ไขใบสมัครของตัวเอง
 *
 * ตรวจสองอย่างในคิวรีเดียว — เป็นของคนนี้จริง และสถานะยังแก้ได้
 * ใช้ status อยู่ในเงื่อนไขของ updateOne ด้วย เพื่อกันกรณีที่เจ้าหน้าที่เปลี่ยนสถานะ
 * ระหว่างที่ผู้สมัครกำลังกรอกอยู่ การเขียนจะไม่ทับสิ่งที่กำลังถูกตรวจ
 */
export async function updateOwnApplication(
  ownerUserId: string,
  applicationId: string,
  data: ApplicationData,
): Promise<UpdateResult> {
  const col = await applications();
  const current = await col.findOne({ ownerUserId, applicationId });
  if (!current) return { ok: false, reason: "not_found" };
  if (!isEditable(current.status)) {
    return { ok: false, reason: "locked", status: current.status };
  }

  const changes = diffApplicationData(current.data, data);
  if (changes.length === 0) return { ok: true, changes: [] };

  const now = new Date();
  const result = await col.updateOne(
    { ownerUserId, applicationId, status: current.status },
    { $set: { data, updatedAt: now } },
  );
  if (result.matchedCount === 0) {
    return { ok: false, reason: "locked", status: current.status };
  }

  await writeActivity({
    applicationId,
    actorUserId: ownerUserId,
    type: "edited",
    message: `ผู้สมัครแก้ไขข้อมูล ${changes.length} รายการ`,
    at: now,
    changes,
  });

  return { ok: true, changes };
}

/* ── เอกสารของใบสมัครที่ส่งแล้ว ───────────────────────────────── */

export async function listApplicationDocuments(
  ownerUserId: string,
  applicationId: string,
): Promise<DocumentRef[]> {
  const col = await applications();
  const doc = await col.findOne(
    { ownerUserId, applicationId },
    { projection: { documents: 1 } },
  );
  return doc?.documents ?? [];
}

/** คืน false เมื่อไม่ใช่ของคนนี้ หรือสถานะล็อกแล้ว */
export async function addDocumentToApplication(
  ownerUserId: string,
  applicationId: string,
  ref: DocumentRef,
): Promise<boolean> {
  const col = await applications();
  const now = new Date();
  // ใช้ EDITABLE_STATUSES เดียวกับ isEditable() แทนการฮาร์ดโค้ด "New" ตรง ๆ
  // ไม่งั้นวันที่นิยาม "แก้ไขได้" ถูกขยายที่เดียว อีกที่จะหลุดตามไม่ทัน
  const result = await col.updateOne(
    { ownerUserId, applicationId, status: { $in: EDITABLE_STATUSES } },
    { $push: { documents: ref }, $set: { updatedAt: now } },
  );
  if (result.matchedCount === 0) return false;

  await writeActivity({
    applicationId,
    actorUserId: ownerUserId,
    type: "document_added",
    message: `ผู้สมัครแนบเอกสารเพิ่ม: ${ref.fileName}`,
    at: now,
  });
  return true;
}

export async function removeDocumentFromApplication(
  ownerUserId: string,
  applicationId: string,
  documentId: string,
): Promise<string | undefined> {
  const col = await applications();
  const doc = await col.findOne(
    { ownerUserId, applicationId, status: { $in: EDITABLE_STATUSES } },
    { projection: { documents: 1 } },
  );
  const target = doc?.documents?.find((d) => d.id === documentId);
  if (!target) return undefined;

  const now = new Date();
  await col.updateOne(
    { ownerUserId, applicationId, status: { $in: EDITABLE_STATUSES } },
    { $pull: { documents: { id: documentId } }, $set: { updatedAt: now } },
  );
  await writeActivity({
    applicationId,
    actorUserId: ownerUserId,
    type: "document_removed",
    message: `ผู้สมัครลบเอกสาร: ${target.fileName}`,
    at: now,
  });
  return target.driveFileId;
}
