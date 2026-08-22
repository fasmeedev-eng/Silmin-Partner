"use server";

import { revalidatePath } from "next/cache";
import { guardRole } from "@/lib/auth/guard";
import { addInternalNote, changeStatus, type ApplicationStatus } from "@/lib/db/applications";
import { STATUS_META } from "@/lib/application/status";
import { requiresMessage } from "@/lib/application/transitions";
import { can, type PermissionId } from "@/lib/auth/permissions";

export interface StaffActionResult {
  ok: boolean;
  message?: string;
}

/**
 * ทุก action ตรวจบทบาทเองที่นี่ ไม่พึ่ง layout
 *
 * layout กันแค่การเปิดหน้า แต่ server action ถูกเรียกตรงได้โดยไม่ผ่านหน้าไหนเลย
 * ถ้าไม่ตรวจซ้ำ คนที่ไม่ใช่เจ้าหน้าที่ก็ยิงเปลี่ยนสถานะได้
 */
async function requireStaff(permission: PermissionId) {
  const result = await guardRole(["admin", "employee"]);
  if (!result.allowed) return null;
  // ตรวจสิทธิ์รายการกระทำด้วย ไม่ใช่แค่บทบาท — แอดมินอาจปิดสิทธิ์นี้ของพนักงานไว้
  return (await can(result.staff.role, permission)) ? result.staff : null;
}

export async function changeStatusAction(input: {
  applicationId: string;
  to: string;
  message: string;
  internalNote: string;
}): Promise<StaffActionResult> {
  const staff = await requireStaff("changeStatus");
  if (!staff) return { ok: false, message: "บัญชีของคุณไม่มีสิทธิ์เปลี่ยนสถานะใบสมัคร" };

  const to = input.to as ApplicationStatus;
  if (!STATUS_META[to]) return { ok: false, message: "สถานะไม่ถูกต้อง" };

  const message = input.message.trim();
  if (requiresMessage(to) && message.length === 0) {
    return {
      ok: false,
      message: `สถานะ "${STATUS_META[to].label}" ต้องระบุข้อความถึงผู้สมัคร เพื่อให้ร้านรู้ว่าต้องทำอะไรต่อ`,
    };
  }

  const actor = { userId: staff.userId, label: staff.name || staff.email };
  const result = await changeStatus(input.applicationId, actor, to, message);

  if (!result.ok) {
    if (result.reason === "not_found") return { ok: false, message: "ไม่พบใบสมัครนี้" };
    if (result.reason === "not_allowed") {
      return {
        ok: false,
        message: `เปลี่ยนจาก "${STATUS_META[result.current!].label}" เป็น "${STATUS_META[to].label}" ไม่ได้ ต้องเดินตามลำดับ`,
      };
    }
    return {
      ok: false,
      message: "มีคนเปลี่ยนสถานะใบนี้ไปแล้วระหว่างที่คุณเปิดหน้าอยู่ กรุณารีเฟรช",
    };
  }

  const note = input.internalNote.trim();
  if (note && (await can(staff.role, "internalNotes"))) {
    await addInternalNote(input.applicationId, actor, note);
  }

  revalidatePath(`/admin/${input.applicationId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function addNoteAction(input: {
  applicationId: string;
  note: string;
}): Promise<StaffActionResult> {
  const staff = await requireStaff("internalNotes");
  if (!staff) return { ok: false, message: "บัญชีของคุณไม่มีสิทธิ์เขียนโน้ตภายใน" };

  const note = input.note.trim();
  if (!note) return { ok: false, message: "กรอกข้อความก่อนบันทึก" };

  const added = await addInternalNote(
    input.applicationId,
    { userId: staff.userId, label: staff.name || staff.email },
    note,
  );
  if (!added) return { ok: false, message: "ไม่พบใบสมัครนี้" };

  revalidatePath(`/admin/${input.applicationId}`);
  return { ok: true };
}
