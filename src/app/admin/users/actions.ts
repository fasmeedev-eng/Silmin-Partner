"use server";

import { revalidatePath } from "next/cache";
import { guardRole, ROLE_LABELS } from "@/lib/auth/guard";
import { writeAdminAudit } from "@/lib/db/audit";
import {
  countActiveAdmins,
  findUserById,
  setUserActive,
  setUserRole,
  type Role,
} from "@/lib/db/users";

export interface AdminResult {
  ok: boolean;
  message?: string;
}

const ROLES: Role[] = ["customer", "employee", "admin"];

/** หน้าจัดการผู้ใช้เปิดให้ admin เท่านั้น — employee เข้าหลังบ้านได้แต่แก้สิทธิ์ใครไม่ได้ */
async function requireAdmin() {
  const result = await guardRole(["admin"]);
  return result.allowed ? result.staff : null;
}

export async function changeRoleAction(input: {
  userId: string;
  role: string;
}): Promise<AdminResult> {
  const actor = await requireAdmin();
  if (!actor) return { ok: false, message: "เฉพาะแอดมินเท่านั้นที่แก้บทบาทได้" };

  const role = input.role as Role;
  if (!ROLES.includes(role)) return { ok: false, message: "บทบาทไม่ถูกต้อง" };

  // กันล็อกตัวเองออก — ถ้าแอดมินลดบทบาทตัวเองพลาด จะกู้คืนผ่านหน้าเว็บไม่ได้อีกเลย
  if (input.userId === actor.userId) {
    return {
      ok: false,
      message: "เปลี่ยนบทบาทของตัวเองไม่ได้ ให้แอดมินคนอื่นเปลี่ยนให้ เพื่อกันการล็อกตัวเองออกจากระบบ",
    };
  }

  const target = await findUserById(input.userId);
  if (!target) return { ok: false, message: "ไม่พบผู้ใช้" };
  if (target.role === role) return { ok: true };

  // ต้องเหลือแอดมินที่ใช้งานได้อย่างน้อยหนึ่งคนเสมอ
  if (target.role === "admin" && target.active && (await countActiveAdmins()) <= 1) {
    return {
      ok: false,
      message: "นี่คือแอดมินคนสุดท้ายที่ใช้งานอยู่ ต้องตั้งแอดมินคนใหม่ก่อนจึงจะลดบทบาทคนนี้ได้",
    };
  }

  await setUserRole(input.userId, role);
  await writeAdminAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    action: "role_changed",
    targetEmail: target.email,
    detail: `${ROLE_LABELS[target.role]} → ${ROLE_LABELS[role]}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleActiveAction(input: {
  userId: string;
  active: boolean;
}): Promise<AdminResult> {
  const actor = await requireAdmin();
  if (!actor) return { ok: false, message: "เฉพาะแอดมินเท่านั้นที่ปิดบัญชีได้" };

  if (input.userId === actor.userId) {
    return { ok: false, message: "ปิดบัญชีของตัวเองไม่ได้" };
  }

  const target = await findUserById(input.userId);
  if (!target) return { ok: false, message: "ไม่พบผู้ใช้" };
  if (target.active === input.active) return { ok: true };

  if (!input.active && target.role === "admin" && (await countActiveAdmins()) <= 1) {
    return {
      ok: false,
      message: "นี่คือแอดมินคนสุดท้ายที่ใช้งานอยู่ ปิดบัญชีไม่ได้",
    };
  }

  await setUserActive(input.userId, input.active);
  await writeAdminAudit({
    actorUserId: actor.userId,
    actorEmail: actor.email,
    action: "active_changed",
    targetEmail: target.email,
    detail: input.active ? "เปิดใช้งานบัญชี" : "ปิดใช้งานบัญชี",
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
