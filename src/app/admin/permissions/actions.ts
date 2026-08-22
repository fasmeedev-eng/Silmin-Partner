"use server";

import { revalidatePath } from "next/cache";
import { guardRole } from "@/lib/auth/guard";
import { writeAdminAudit } from "@/lib/db/audit";
import {
  PERMISSION_DEFS,
  getEmployeePermissions,
  sanitizePermissions,
  saveEmployeePermissions,
} from "@/lib/auth/permissions";

export async function savePermissionsAction(
  input: Record<string, boolean>,
): Promise<{ ok: boolean; message?: string }> {
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    return { ok: false, message: "เฉพาะแอดมินเท่านั้นที่แก้สิทธิ์ได้" };
  }

  const before = await getEmployeePermissions();

  // รับเฉพาะคีย์ที่รู้จัก — ค่าที่ส่งมาจากเบราว์เซอร์แก้ได้ ห้ามเขียนลงฐานข้อมูลตรง ๆ
  const next = sanitizePermissions(input);

  const changes = PERMISSION_DEFS.filter((def) => before[def.id] !== next[def.id]).map(
    (def) => `${def.label}: ${before[def.id] ? "เปิด" : "ปิด"} → ${next[def.id] ? "เปิด" : "ปิด"}`,
  );

  if (changes.length === 0) return { ok: true };

  await saveEmployeePermissions(next, guard.staff.email);
  await writeAdminAudit({
    actorUserId: guard.staff.userId,
    actorEmail: guard.staff.email,
    action: "permissions_changed",
    detail: changes.join(" · "),
  });

  revalidatePath("/admin/permissions");
  revalidatePath("/admin/users");
  return { ok: true };
}
