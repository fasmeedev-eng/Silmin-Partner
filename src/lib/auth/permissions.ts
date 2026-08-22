import { getDb } from "@/lib/db/mongo";
import type { Role } from "./roles";
import {
  DEFAULT_PERMISSIONS,
  PERMISSION_DEFS,
  type EmployeePermissions,
  type PermissionId,
} from "./permission-defs";

// นิยามอยู่ในไฟล์ที่ไม่ import อะไรเลย เพื่อให้ client component ใช้ได้โดยไม่ลากไดรเวอร์ตาม
export {
  DEFAULT_PERMISSIONS,
  PERMISSION_DEFS,
  type EmployeePermissions,
  type PermissionId,
} from "./permission-defs";

interface PermissionsDoc {
  _id: string;
  employee: EmployeePermissions;
  updatedAt: Date;
  updatedBy: string;
}

// แคชสั้นเหมือน role — ปรับสิทธิ์แล้วมีผลภายในครึ่งนาที ไม่ต้องให้ใครออกจากระบบ
const CACHE_TTL_MS = 30_000;
let cache: { value: EmployeePermissions; expiresAt: number } | undefined;

export async function getEmployeePermissions(): Promise<EmployeePermissions> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const db = await getDb();
  const doc = await db.collection<PermissionsDoc>("settings").findOne({ _id: "permissions" });

  // เติมค่าเริ่มต้นให้สิทธิ์ที่ยังไม่เคยถูกบันทึก เพื่อให้เพิ่มสิทธิ์ใหม่ในโค้ดได้โดยไม่ต้องย้ายข้อมูล
  const value = { ...DEFAULT_PERMISSIONS, ...(doc?.employee ?? {}) };
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function saveEmployeePermissions(
  next: EmployeePermissions,
  updatedBy: string,
): Promise<void> {
  const db = await getDb();
  await db.collection<PermissionsDoc>("settings").updateOne(
    { _id: "permissions" },
    { $set: { employee: next, updatedAt: new Date(), updatedBy } },
    { upsert: true },
  );
  cache = undefined;
}

/**
 * แอดมินมีสิทธิ์ทุกอย่างเสมอและปรับไม่ได้ — ไม่งั้นจะมีทางที่แอดมินตัดสิทธิ์ตัวเองจนแก้กลับไม่ได้
 * customer ไม่มีสิทธิ์ใด ๆ ในหลังบ้านเลย
 */
export async function can(role: Role | undefined, permission: PermissionId): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "employee") return false;
  const permissions = await getEmployeePermissions();
  return permissions[permission] === true;
}

/** ใช้ตรวจว่าสิทธิ์ที่ส่งมาจากฟอร์มมีอยู่จริง ก่อนเขียนลงฐานข้อมูล */
export function sanitizePermissions(input: Record<string, boolean>): EmployeePermissions {
  const next = { ...DEFAULT_PERMISSIONS };
  for (const def of PERMISSION_DEFS) {
    next[def.id] = input[def.id] === true;
  }
  return next;
}
