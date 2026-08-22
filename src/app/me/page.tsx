import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Paperclip } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { findOwnDraft, listOwnApplications } from "@/lib/db/applications";
import { STATUS_META, statusChipClass } from "@/lib/application/status";

export const metadata = { title: "ใบสมัครของฉัน" };

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/me");

  const [applications, draft] = await Promise.all([
    listOwnApplications(session.user.id),
    findOwnDraft(session.user.id),
  ]);

  return (
    <>
      <SiteHeader signedIn email={session.user.email} role={session.user.role} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-12 sm:px-8 sm:py-16">
        <h1 className="text-h3 sm:text-h2">ใบสมัครของฉัน</h1>
        <p className="mt-4 max-w-[56ch] text-body text-ink-80">
          ทุกใบที่คุณส่งเข้ามาจะอยู่ที่นี่ พร้อมสถานะล่าสุด
          ไม่ต้องโทรถามว่าเรื่องไปถึงไหนแล้ว
        </p>

        {/* ร่างที่ค้างอยู่ต้องเด่นที่สุด เพราะเป็นสิ่งเดียวในหน้านี้ที่ยังต้องให้ผู้ใช้ลงมือทำ */}
        {draft ? (
          <section className="mt-10 rounded-lg bg-parchment p-6 ring-1 ring-hairline ring-inset">
            <span
              className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass("Draft")}`}
            >
              {STATUS_META.Draft.label}
            </span>
            <h2 className="mt-3 text-body font-semibold">
              {draft.data?.shop?.name || "ใบสมัครที่ยังกรอกไม่เสร็จ"}
            </h2>
            <p className="mt-1 text-caption text-ink-80">
              {STATUS_META.Draft.detail}
              {draft.updatedAt ? ` · แก้ไขล่าสุด ${thaiDate.format(draft.updatedAt)}` : null}
            </p>
            <Link
              href="/apply"
              className="mt-5 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
            >
              กรอกต่อจากที่ค้างไว้
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </section>
        ) : null}

        {applications.length === 0 ? (
          <section className="mt-10 rounded-lg bg-canvas p-8 text-center ring-1 ring-hairline ring-inset">
            <FileText aria-hidden className="mx-auto size-8 text-ink-48" strokeWidth={1.5} />
            <h2 className="mt-4 text-body font-semibold">ยังไม่มีใบสมัครที่ส่งแล้ว</h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-caption text-ink-80">
              กรอกใบสมัครใช้เวลา 2–3 นาที ไม่มีค่าสมัคร
              ทีมงานตรวจสอบและติดต่อกลับภายใน 3 วันทำการ
            </p>
            {draft ? null : (
              <Link
                href="/apply"
                className="mt-6 inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
              >
                เริ่มกรอกใบสมัคร
              </Link>
            )}
          </section>
        ) : (
          <ul className="mt-10 space-y-4">
            {applications.map((application) => {
              const meta = STATUS_META[application.status];
              const fileCount = application.documents?.length ?? 0;

              return (
                <li key={application.applicationId}>
                  <Link
                    href={`/me/${application.applicationId}`}
                    className="block rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-caption tabular-nums text-ink-48">
                          {application.applicationId}
                        </p>
                        <h2 className="mt-1 text-body font-semibold">
                          {application.data?.shop?.name || "ไม่ได้ระบุชื่อร้าน"}
                        </h2>
                      </div>
                      <span
                        className={`inline-flex min-h-[28px] shrink-0 items-center rounded-full px-3 text-fine font-semibold ${statusChipClass(application.status)}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-3 text-caption text-ink-80">{meta.detail}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4 text-fine text-ink-48">
                      {application.submittedAt ? (
                        <span>ส่งเมื่อ {thaiDate.format(application.submittedAt)}</span>
                      ) : null}
                      {application.data?.shop?.address?.province ? (
                        <span>{application.data.shop.address.province}</span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <Paperclip aria-hidden className="size-3.5" />
                        เอกสาร {fileCount} ไฟล์
                      </span>
                      <span className="ml-auto text-accent-ink underline underline-offset-4">
                        ดูรายละเอียด
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
