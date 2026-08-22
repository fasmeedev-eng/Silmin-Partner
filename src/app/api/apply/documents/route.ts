import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ALLOWED_LABEL,
  MAX_FILE_BYTES,
  extensionFor,
  filedFileName,
  pendingFileName,
  type DocumentRef,
} from "@/lib/application/documents";
import { deleteFile, uploadFile } from "@/lib/drive/client";
import { categoryById, ensureFolders } from "@/lib/drive/folders";
import {
  addDocumentToApplication,
  addDocumentToDraft,
  findOwnApplication,
  listApplicationDocuments,
  listDraftDocuments,
  removeDocumentFromApplication,
  removeDocumentFromDraft,
} from "@/lib/db/applications";

/** ตัดข้อมูลภายในออกก่อนส่งกลับหน้าเว็บ — driveFileId ไม่ควรหลุดออกจากเซิร์ฟเวอร์ */
function toPublic(document: DocumentRef) {
  return {
    id: document.id,
    category: document.category,
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
  };
}

function unauthorized() {
  return NextResponse.json({ message: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
}

/**
 * เส้นทางนี้ทำงานสองโหมด
 *   ไม่มี applicationId → ไฟล์ผูกกับร่าง พักไว้ใน _pending รอเลขที่ใบสมัคร
 *   มี applicationId    → ไฟล์ผูกกับใบสมัครที่ส่งแล้ว มีเลขที่แล้วจึงเก็บเข้าโฟลเดอร์หมวดได้เลย
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const applicationId = new URL(request.url).searchParams.get("applicationId");
  const documents = applicationId
    ? await listApplicationDocuments(session.user.id, applicationId)
    : await listDraftDocuments(session.user.id);

  return NextResponse.json({ documents: documents.map(toPublic) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const form = await request.formData();
  const categoryId = String(form.get("category") ?? "");
  const applicationId = form.get("applicationId")?.toString() || undefined;
  const file = form.get("file");

  const category = categoryById(categoryId);
  if (!category) {
    return NextResponse.json({ message: "หมวดเอกสารไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "ไม่พบไฟล์ที่แนบมา" }, { status: 400 });
  }

  // ตรวจฝั่งเซิร์ฟเวอร์เสมอ accept และการเช็กขนาดในเบราว์เซอร์เป็นแค่ UX
  if (!extensionFor(file.type)) {
    return NextResponse.json({ message: `รองรับเฉพาะ ${ALLOWED_LABEL}` }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ message: "ไฟล์ว่างเปล่า" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ message: `ไฟล์ใหญ่เกินไป ${ALLOWED_LABEL}` }, { status: 400 });
  }

  const existing = applicationId
    ? await listApplicationDocuments(session.user.id, applicationId)
    : await listDraftDocuments(session.user.id);

  const inCategory = existing.filter((d) => d.category === category.id).length;
  if (inCategory >= category.maxFiles) {
    return NextResponse.json(
      { message: `หมวด "${category.label}" แนบได้สูงสุด ${category.maxFiles} ไฟล์` },
      { status: 400 },
    );
  }

  const folders = await ensureFolders();
  const id = crypto.randomUUID();

  let document: DocumentRef;

  if (applicationId) {
    const application = await findOwnApplication(session.user.id, applicationId);
    if (!application) {
      return NextResponse.json({ message: "ไม่พบใบสมัครนี้" }, { status: 404 });
    }
    // ใบสมัครมีเลขที่แล้ว จึงตั้งชื่อสุดท้ายและเก็บเข้าโฟลเดอร์หมวดได้ทันที ไม่ต้องพักที่ _pending
    document = {
      id,
      category: category.id,
      driveFileId: (
        await uploadFile({
          name: filedFileName(
            applicationId,
            application.data.shop.name,
            inCategory + 1,
            file.type,
          ),
          mimeType: file.type,
          parentId: folders.categories[category.id],
          body: await file.arrayBuffer(),
        })
      ).id,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date(),
      driveState: "filed",
    };

    const attached = await addDocumentToApplication(session.user.id, applicationId, document);
    if (!attached) {
      // แนบไม่ได้เพราะสถานะล็อกแล้ว — เก็บไฟล์ที่เพิ่งอัปไว้ไม่ได้ ต้องลบทิ้ง
      await deleteFile(document.driveFileId).catch(() => {});
      return NextResponse.json(
        { message: "ใบสมัครนี้ถูกล็อกแล้ว จึงแนบเอกสารเพิ่มไม่ได้" },
        { status: 409 },
      );
    }
  } else {
    const uploaded = await uploadFile({
      name: pendingFileName(session.user.id, id, file.type),
      mimeType: file.type,
      parentId: folders.pending,
      body: await file.arrayBuffer(),
    });
    document = {
      id,
      category: category.id,
      driveFileId: uploaded.id,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date(),
      driveState: "pending",
    };
    await addDocumentToDraft(session.user.id, document);
  }

  return NextResponse.json({ document: toPublic(document) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id, applicationId } = (await request.json()) as {
    id?: string;
    applicationId?: string;
  };
  if (!id) return NextResponse.json({ message: "ไม่ได้ระบุไฟล์" }, { status: 400 });

  // ทั้งสองฟังก์ชันผูกกับ ownerUserId อยู่แล้ว คนอื่นจึงลบไฟล์ของคนอื่นไม่ได้
  const driveFileId = applicationId
    ? await removeDocumentFromApplication(session.user.id, applicationId, id)
    : await removeDocumentFromDraft(session.user.id, id);

  if (!driveFileId) {
    return NextResponse.json(
      { message: "ไม่พบไฟล์นี้ หรือใบสมัครถูกล็อกแล้ว" },
      { status: 404 },
    );
  }

  try {
    await deleteFile(driveFileId);
  } catch (error) {
    // ลบออกจากฐานข้อมูลแล้ว ถ้าลบบน Drive ไม่ผ่านก็ปล่อยให้ตัวกวาดเก็บทีหลัง
    console.error(`ลบไฟล์ ${driveFileId} บน Drive ไม่สำเร็จ`, error);
  }

  return NextResponse.json({ ok: true });
}
