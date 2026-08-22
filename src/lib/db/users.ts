import { ObjectId, type Collection } from "mongodb";
import { getDb } from "./mongo";

export type { Role } from "@/lib/auth/roles";
import type { Role } from "@/lib/auth/roles";

export interface UserDoc {
  _id: ObjectId;
  googleId: string;
  email: string;
  name?: string;
  image?: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface UserAccess {
  role: Role;
  active: boolean;
}

let indexesReady: Promise<void> | undefined;

async function usersCollection(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  // สร้างครั้งเดียวต่อ process — createIndex เป็น idempotent อยู่แล้ว แต่ไม่ควรยิงทุก request
  indexesReady ??= (async () => {
    await users.createIndex({ googleId: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
  })();
  await indexesReady;

  return users;
}

/**
 * บันทึกผู้ใช้เมื่อเข้าสู่ระบบด้วย Google
 *
 * role และ active อยู่ใน $setOnInsert เท่านั้น การล็อกอินครั้งถัดไปจึงไม่เขียนทับ
 * บทบาทที่แอดมินแก้ไว้ในฐานข้อมูล
 */
export async function upsertUserOnSignIn(input: {
  googleId: string;
  email: string;
  name?: string;
  image?: string;
}): Promise<string> {
  const users = await usersCollection();
  const now = new Date();

  const result = await users.findOneAndUpdate(
    { googleId: input.googleId },
    {
      $set: {
        email: input.email,
        name: input.name,
        image: input.image,
        updatedAt: now,
        lastLoginAt: now,
      },
      $setOnInsert: {
        googleId: input.googleId,
        role: "customer" as Role,
        active: true,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!result) {
    throw new Error("บันทึกผู้ใช้ไม่สำเร็จ");
  }
  return result._id.toString();
}

/**
 * หา _id จากอีเมล ใช้ซ่อมโทเคนเก่าที่ยังไม่มี uid
 * โทเคนที่ออกก่อนระบบมีฐานข้อมูล (หรือออกตอนที่การบันทึกผู้ใช้ล้มเหลว) จะไม่มี uid
 * คนนั้นจะกลายเป็น customer ไปตลอดจนกว่าจะออกจากระบบแล้วเข้าใหม่ ซึ่งไม่มีอะไรบอกให้เขารู้
 */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const users = await usersCollection();
  const doc = await users.findOne({ email }, { projection: { _id: 1 } });
  return doc ? doc._id.toString() : null;
}

/**
 * แคชบทบาทอายุสั้น
 *
 * บทบาทถูกแก้ด้วยมือในฐานข้อมูล ไม่มีหน้า UI ให้แก้ ถ้าฝัง role ไว้ใน JWT
 * การแก้ในฐานข้อมูลจะไม่มีผลจนกว่าจะออกจากระบบแล้วเข้าใหม่ ซึ่งดูเหมือนระบบพัง
 * จึงอ่านจากฐานข้อมูลใหม่เสมอ แต่แคชสั้น ๆ ไม่ให้ยิง query ทุก request
 */
const CACHE_TTL_MS = 30_000;
const accessCache = new Map<string, { value: UserAccess; expiresAt: number }>();

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const cached = accessCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (!ObjectId.isValid(userId)) return null;

  const users = await usersCollection();
  const doc = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { role: 1, active: 1 } },
  );
  if (!doc) return null;

  const value: UserAccess = { role: doc.role ?? "customer", active: doc.active ?? true };
  accessCache.set(userId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** ล้างแคชทันที ใช้หลังเปลี่ยนบทบาทจากในระบบเอง */
export function invalidateUserAccess(userId: string): void {
  accessCache.delete(userId);
}

/* ── จัดการผู้ใช้จากหลังบ้าน ───────────────────────────────────── */

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: Role;
  active: boolean;
  createdAt?: Date;
  lastLoginAt?: Date;
}

export async function listUsers(): Promise<UserSummary[]> {
  const users = await usersCollection();
  const docs = await users
    .find({}, { projection: { email: 1, name: 1, image: 1, role: 1, active: 1, createdAt: 1, lastLoginAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name ?? "",
    image: doc.image,
    role: doc.role ?? "customer",
    active: doc.active ?? true,
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt,
  }));
}

export async function countActiveAdmins(): Promise<number> {
  const users = await usersCollection();
  return users.countDocuments({ role: "admin", active: true });
}

export async function findUserById(userId: string): Promise<UserSummary | null> {
  if (!ObjectId.isValid(userId)) return null;
  const users = await usersCollection();
  const doc = await users.findOne({ _id: new ObjectId(userId) });
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name ?? "",
    image: doc.image,
    role: doc.role ?? "customer",
    active: doc.active ?? true,
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt,
  };
}

/** เขียนบทบาทตรง ๆ — ผู้เรียกต้องตรวจกติกากันล็อกตัวเองออกมาก่อนแล้ว */
export async function setUserRole(userId: string, role: Role): Promise<void> {
  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role, updatedAt: new Date() } },
  );
  // ล้างแคชทันที ไม่ต้องรอ 30 วินาที เพราะการถอดสิทธิ์ควรมีผลเดี๋ยวนั้น
  invalidateUserAccess(userId);
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const users = await usersCollection();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { active, updatedAt: new Date() } },
  );
  invalidateUserAccess(userId);
}
