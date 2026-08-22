"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { draftSchema, validateForSubmit } from "@/lib/application/schema";
import { missingCategories } from "@/lib/application/categories";
import {
  listApplicationDocuments,
  listDraftDocuments,
  saveDraft,
  submitApplication,
  updateOwnApplication,
} from "@/lib/db/applications";

export interface ActionResult {
  ok: boolean;
  /** error รายช่อง — key คือ path เช่น "contact.phone" */
  errors?: Record<string, string>;
  message?: string;
  applicationId?: string;
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function saveDraftAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "ข้อมูลที่ส่งมาไม่ถูกรูปแบบ" };

  await saveDraft(userId, parsed.data);
  return { ok: true };
}

/**
 * แก้ไขใบสมัครที่ส่งไปแล้ว
 *
 * เงื่อนไขเดียวกับตอนส่ง คือข้อมูลต้องครบตามที่ PRD กำหนด
 * และตรวจสิทธิ์ + สถานะบนเซิร์ฟเวอร์เสมอ ปุ่มที่หายไปบนหน้าเว็บไม่ใช่การป้องกัน
 */
export async function updateApplicationAction(
  applicationId: string,
  input: unknown,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  const result = validateForSubmit(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors, message: "ข้อมูลยังไม่ครบ กรุณาตรวจสอบอีกครั้ง" };
  }

  const documents = await listApplicationDocuments(userId, applicationId);
  const missingOnUpdate = missingCategories(documents);
  if (missingOnUpdate.length > 0) {
    return {
      ok: false,
      message: `ต้องมี${missingOnUpdate.map((c) => c.label).join(" และ ")} อย่างน้อยอย่างละ 1 ไฟล์`,
    };
  }

  const updated = await updateOwnApplication(userId, applicationId, result.data);
  if (!updated.ok) {
    return {
      ok: false,
      message:
        updated.reason === "locked"
          ? "ใบสมัครนี้ถูกล็อกแล้วเพราะสถานะเปลี่ยนไป จึงแก้ไขไม่ได้ กรุณารีเฟรชหน้านี้"
          : "ไม่พบใบสมัครนี้",
    };
  }

  return { ok: true, applicationId };
}

export async function submitAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };

  // ตรวจซ้ำบนเซิร์ฟเวอร์เสมอ การตรวจฝั่ง client เป็นแค่ UX
  // คนที่ยิง request ตรงข้ามหน้าเว็บต้องไม่สามารถบันทึกข้อมูลที่ไม่ครบได้
  const result = validateForSubmit(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors, message: "ข้อมูลยังไม่ครบ กรุณาตรวจสอบอีกครั้ง" };
  }

  // เอกสารบังคับไม่ได้อยู่ใน ApplicationData (เป็นตัวชี้ไป Drive) จึงต้องตรวจแยกที่นี่
  // ไม่ปล่อยให้การบล็อกปุ่มฝั่ง client เป็นด่านเดียว
  const documents = await listDraftDocuments(userId);
  const missing = missingCategories(documents);
  if (missing.length > 0) {
    return {
      ok: false,
      message: `ต้องแนบ${missing.map((c) => c.label).join(" และ ")} อย่างน้อยอย่างละ 1 ไฟล์ กลับไปที่ขั้นตอนเอกสารเพื่อแนบไฟล์`,
    };
  }

  // เก็บหลักฐานการให้ความยินยอม — บูลีนอย่างเดียวใช้เป็นหลักฐานตาม PDPA ไม่ได้
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "";
  const userAgent = requestHeaders.get("user-agent") ?? "";

  const applicationId = await submitApplication(userId, result.data, { ip, userAgent });
  return { ok: true, applicationId };
}
