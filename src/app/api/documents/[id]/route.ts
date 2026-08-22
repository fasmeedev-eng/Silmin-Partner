import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { downloadFile } from "@/lib/drive/client";
import {
  findDocumentAnyOwner,
  findOwnedDocument,
  logDocumentAccess,
} from "@/lib/db/applications";
import type { DocumentRef } from "@/lib/application/documents";
import { can } from "@/lib/auth/permissions";

/**
 * พร็อกซีอ่านไฟล์
 *
 * ไฟล์บน Drive ห้ามตั้งเป็น "ทุกคนที่มีลิงก์" เพราะเป็นเอกสารส่วนบุคคล
 * ทุกการเปิดดูจึงผ่านเส้นทางนี้ ซึ่งตรวจสิทธิ์ก่อนเสมอ
 *
 * มีสองทางที่ผ่านได้
 *   1. เป็นเจ้าของเอกสารเอง — ไม่บันทึกอะไร เพราะดูของตัวเองไม่ใช่เหตุการณ์
 *   2. เป็นเจ้าหน้าที่ (admin/employee) — ผ่านได้ทุกใบ แต่ **บันทึกทุกครั้ง**
 *      ว่าใครเปิดไฟล์ไหน ถ้าวันหนึ่งมีข้อสงสัยเรื่องข้อมูลรั่ว จะตอบได้ว่าใครเข้าถึงบ้าง
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const { id } = await params;
  const role = session.user.role;
  // สิทธิ์เปิดดูเอกสารปรับได้จากหน้าสิทธิ์พนักงาน จึงต้องถามทุกครั้ง ไม่ใช่ดูแค่บทบาท
  const isStaff = session.user.active !== false && (await can(role, "viewDocuments"));

  let document: DocumentRef | undefined = await findOwnedDocument(session.user.id, id);

  if (!document && isStaff) {
    const found = await findDocumentAnyOwner(id);
    if (found) {
      document = found.document;
      await logDocumentAccess({
        documentId: id,
        applicationId: found.applicationId,
        fileName: found.document.fileName,
        actorUserId: session.user.id,
        actorEmail: session.user.email ?? "",
      });
    }
  }

  // ไม่พบ = ไม่มีจริง หรือไม่มีสิทธิ์ ตอบเหมือนกันทั้งสองกรณี ไม่บอกใบ้ว่าไฟล์นี้มีอยู่
  if (!document) {
    return NextResponse.json({ message: "ไม่พบไฟล์นี้" }, { status: 404 });
  }

  const upstream = await downloadFile(document.driveFileId);

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": document.mimeType,
      // inline เพื่อให้ดูรูปในหน้าเว็บได้ ส่วน filename ใช้ชื่อเดิมของผู้ใช้เวลาบันทึกลงเครื่อง
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "Cache-Control": "private, max-age=300",
      // อัปโหลดตรวจแค่ MIME ที่ประกาศมา ไม่ได้ตรวจเนื้อไฟล์จริง กัน browser sniff เนื้อหาเป็นชนิดอื่น
      "X-Content-Type-Options": "nosniff",
    },
  });
}
