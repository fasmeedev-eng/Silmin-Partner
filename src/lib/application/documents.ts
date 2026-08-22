import type { DocumentCategoryId } from "./categories";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** ชนิดไฟล์ที่รับ — ตรวจซ้ำบนเซิร์ฟเวอร์เสมอ accept ของ <input> เป็นแค่ตัวช่วยเลือกไฟล์ */
export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export const ALLOWED_LABEL = "JPG PNG หรือ PDF ขนาดไม่เกิน 10 MB ต่อไฟล์";

export interface DocumentRef {
  /** id ของเราเอง ใช้อ้างอิงตอนลบ ไม่เปิดเผย driveFileId ออกไปตรง ๆ */
  id: string;
  category: DocumentCategoryId;
  driveFileId: string;
  /** ชื่อไฟล์เดิมของผู้ใช้ ใช้แสดงบนหน้าจอ */
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  /** pending = ยังอยู่ใน _pending, filed = ย้ายเข้าโฟลเดอร์หมวดแล้ว */
  driveState: "pending" | "filed";
}

export function extensionFor(mimeType: string): string | undefined {
  return ALLOWED_MIME[mimeType];
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ทำชื่อร้านให้ใช้เป็นส่วนหนึ่งของชื่อไฟล์ได้
 * ตัดอักขระที่ทำให้ชื่อไฟล์เพี้ยนออก แต่คงตัวอักษรไทยไว้ เพราะชื่อร้านส่วนใหญ่เป็นไทย
 */
export function shopSlug(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return cleaned || "shop";
}

/** ชื่อไฟล์ตอนย้ายเข้าโฟลเดอร์หมวด: SG-2026-000125_ABC-Mobile_01.jpg */
export function filedFileName(
  applicationId: string,
  shopName: string,
  index: number,
  mimeType: string,
): string {
  const ext = extensionFor(mimeType) ?? "bin";
  return `${applicationId}_${shopSlug(shopName)}_${String(index).padStart(2, "0")}.${ext}`;
}

/** ชื่อไฟล์ตอนพักไว้ใน _pending — ผูกกับเจ้าของร่างเพื่อให้กวาดของค้างได้ */
export function pendingFileName(ownerUserId: string, id: string, mimeType: string): string {
  const ext = extensionFor(mimeType) ?? "bin";
  return `draft_${ownerUserId}_${id}.${ext}`;
}
