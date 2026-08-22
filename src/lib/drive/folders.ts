import { createFolder, findFolder } from "./client";
import {
  DOCUMENT_CATEGORIES,
  PENDING_FOLDER,
  ROOT_FOLDER_NAME,
} from "@/lib/application/categories";
import { getDb } from "@/lib/db/mongo";

// ค่าคงที่ของหมวดอยู่ในไฟล์ที่ไม่ import อะไรเลย เพื่อให้ client component ใช้ได้โดยไม่ลากไดรเวอร์ตาม
export {
  DOCUMENT_CATEGORIES,
  PENDING_FOLDER,
  ROOT_FOLDER_NAME,
  categoryById,
  type DocumentCategoryId,
} from "@/lib/application/categories";

export interface FolderMap {
  root: string;
  pending: string;
  categories: Record<string, string>;
}

interface DriveSettings {
  _id: string;
  parentId: string;
  folders: FolderMap;
  updatedAt: Date;
}

let inFlight: Promise<FolderMap> | undefined;

/**
 * สร้างโครงโฟลเดอร์ให้ครบแบบ idempotent
 *
 * Drive ยอมให้มีโฟลเดอร์ชื่อซ้ำกันในที่เดียวกันได้ ถ้าเขียนเป็น "สร้างก่อนบันทึกทุกครั้ง"
 * จะได้ silmin_partner เป็นสิบใบภายในไม่กี่วัน จึงต้องค้นด้วยชื่อ+พาเรนต์ก่อน แล้วสร้างเฉพาะที่ยังไม่มี
 * และเก็บ id ที่ได้ลง settings เพื่อไม่ต้องยิงค้นหาซ้ำทุกครั้งที่มีคนอัปโหลด
 */
export async function ensureFolders(): Promise<FolderMap> {
  inFlight ??= provision().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

async function provision(): Promise<FolderMap> {
  const parentId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentId) throw new Error("GOOGLE_DRIVE_FOLDER_ID ไม่ได้ตั้งค่าไว้ใน .env");

  const db = await getDb();
  const settings = db.collection<DriveSettings>("settings");

  const cached = await settings.findOne({ _id: "drive" });
  // ถ้าโฟลเดอร์แม่ถูกเปลี่ยนใน .env ต้องสร้างโครงใหม่ ไม่ใช้ id เดิมที่ชี้ไปคนละที่
  if (cached?.folders && cached.parentId === parentId) {
    const hasAll = DOCUMENT_CATEGORIES.every((c) => cached.folders.categories[c.id]);
    if (hasAll && cached.folders.root && cached.folders.pending) return cached.folders;
  }

  const root = (await findFolder(ROOT_FOLDER_NAME, parentId)) ?? (await createFolder(ROOT_FOLDER_NAME, parentId));

  const pending = (await findFolder(PENDING_FOLDER, root)) ?? (await createFolder(PENDING_FOLDER, root));

  const categories: Record<string, string> = {};
  for (const category of DOCUMENT_CATEGORIES) {
    categories[category.id] =
      (await findFolder(category.folder, root)) ?? (await createFolder(category.folder, root));
  }

  const folders: FolderMap = { root, pending, categories };
  await settings.updateOne(
    { _id: "drive" },
    { $set: { parentId, folders, updatedAt: new Date() } },
    { upsert: true },
  );

  return folders;
}
