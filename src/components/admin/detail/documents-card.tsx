import { ExternalLink, Paperclip } from "lucide-react";
import { DOCUMENT_CATEGORIES } from "@/lib/application/categories";
import { humanSize } from "@/lib/application/documents";
import type { DocumentRef } from "@/lib/application/documents";

/**
 * รายการเอกสารแนบ จัดกลุ่มตามหมวด
 *
 * ดีไซน์อ้างอิงมีไอคอนติ๊กเขียว/นาฬิกาเหลืองต่อไฟล์ (สื่อว่า "ตรวจแล้ว/รอตรวจ" รายไฟล์)
 * และปุ่ม "ดาวน์โหลดทั้งหมด" — ทั้งสองอย่างนี้ไม่มีข้อมูลรองรับจริง ระบบไม่ได้เก็บสถานะ
 * ตรวจสอบรายไฟล์ (มีแค่ครบ/ไม่ครบทั้งใบจาก documentsComplete) และไม่มี endpoint รวมไฟล์เป็น
 * zip ให้ดาวน์โหลดทีเดียว การใส่ปุ่ม/ไอคอนที่กดแล้วไม่มีอะไรเกิดขึ้นแย่กว่าไม่มี จึงตัดออก
 * เหลือแค่ลิงก์เปิดไฟล์ทีละไฟล์ (ผ่านพร็อกซีที่มีอยู่จริงและบันทึกการเข้าถึงอยู่แล้ว)
 */
export function DocumentsCard({
  documents,
  canView,
}: {
  documents: DocumentRef[];
  canView: boolean;
}) {
  return (
    <section className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
      <h2 className="text-body font-semibold text-ink">เอกสารประกอบการสมัคร</h2>

      {!canView ? (
        <p className="mt-4 rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
          บัญชีของคุณไม่มีสิทธิ์เปิดดูเอกสารแนบ
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {DOCUMENT_CATEGORIES.map((category) => {
              const files = documents.filter((d) => d.category === category.id);
              if (files.length === 0) {
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 rounded-input px-3 py-3 text-caption text-ink-48"
                  >
                    <Paperclip aria-hidden className="size-4 shrink-0" />
                    <span>
                      {category.label}
                      {category.required ? <span className="pl-1 text-brand">*</span> : null} —
                      ไม่มีไฟล์
                    </span>
                  </div>
                );
              }
              return files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/documents/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-input px-3 py-3 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-input bg-pearl text-ink-48"
                  >
                    <Paperclip className="size-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-caption font-medium text-ink">
                      {category.label}
                      {category.required ? <span className="pl-1 text-brand">*</span> : null}
                    </span>
                    <span className="block truncate text-fine text-ink-48">{file.fileName}</span>
                  </span>
                  <span className="shrink-0 text-fine tabular-nums text-ink-48">
                    {humanSize(file.size)}
                  </span>
                  <ExternalLink aria-hidden className="size-4 shrink-0 text-ink-48" />
                </a>
              ));
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-divider-soft pt-4 text-fine text-ink-48">
            <span>เอกสารทั้งหมด {documents.length} รายการ</span>
            <span>ระบบบันทึกไว้ว่าใครเปิดดูไฟล์ไหนเมื่อไหร่</span>
          </div>
        </>
      )}
    </section>
  );
}
