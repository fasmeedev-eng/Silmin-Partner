import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Paperclip, Plus } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CtaButton } from "@/components/ui/cta-button";
import { findOwnDraft, listOwnApplications } from "@/lib/db/applications";
import { isActivePartnerUser } from "@/lib/auth/guard";
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

  const [applications, draft, isActivePartner] = await Promise.all([
    listOwnApplications(session.user.id),
    findOwnDraft(session.user.id),
    isActivePartnerUser(session.user.id, session.user.role),
  ]);

  return (
    <>
      <SiteHeader
        signedIn
        email={session.user.email}
        role={session.user.role}
        isActivePartner={isActivePartner}
        sectionNav
      />

      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[1040px] px-6 py-14 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div>
              <h1 className="text-h3 font-bold sm:text-h2">ใบสมัครของฉัน</h1>
              <p className="mt-4 max-w-[52ch] text-lead text-ink-80">
                ทุกใบที่คุณส่งเข้ามาจะอยู่ที่นี่ พร้อมสถานะล่าสุด
                ไม่ต้องโทรถามว่าเรื่องไปถึงไหนแล้ว
              </p>
            </div>

            {/* มีร่างค้างอยู่แล้วไม่ต้องเสนอให้เริ่มใบใหม่ — การ์ดร่างด้านล่างพาไปที่เดิม
                สองปุ่มที่พาไป /apply เหมือนกันแต่เขียนคนละอย่างคือความสับสน ไม่ใช่ทางเลือก */}
            {draft ? null : (
              <CtaButton href="/apply" variant="brand">
                <Plus aria-hidden className="size-[18px]" />
                สมัครใบใหม่
              </CtaButton>
            )}
          </div>

          {/* ร่างที่ค้างอยู่ต้องเด่นที่สุด เพราะเป็นสิ่งเดียวในหน้านี้ที่ยังรอให้ผู้ใช้ลงมือทำ
              จึงใช้พื้นเหลืองจาง + ขอบเหลือง ต่างจากการ์ดใบที่ส่งแล้วซึ่งเป็นสีขาวเรียบ */}
          {draft ? (
            <section className="mt-10 rounded-card bg-gold-soft p-7 ring-1 ring-inset ring-gold">
              <span
                className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass("Draft")}`}
              >
                {STATUS_META.Draft.label}
              </span>
              <h2 className="mt-4 text-lead font-semibold">
                {draft.data?.shop?.name || "ใบสมัครที่ยังกรอกไม่เสร็จ"}
              </h2>
              <p className="mt-1.5 text-caption text-ink-80">
                {STATUS_META.Draft.detail}
                {draft.updatedAt ? ` · แก้ไขล่าสุด ${thaiDate.format(draft.updatedAt)}` : null}
              </p>
              <div className="mt-6">
                <CtaButton href="/apply" variant="brand">
                  กรอกต่อจากที่ค้างไว้
                  <ArrowRight aria-hidden className="size-[18px]" />
                </CtaButton>
              </div>
            </section>
          ) : null}

          {applications.length === 0 ? (
            <section className="mt-10 rounded-card bg-canvas p-10 text-center shadow-soft ring-1 ring-hairline/70">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-pearl">
                <FileText aria-hidden className="size-7 text-ink-48" strokeWidth={1.6} />
              </span>
              <h2 className="mt-5 text-lead font-semibold">ยังไม่มีใบสมัครที่ส่งแล้ว</h2>
              <p className="mx-auto mt-2.5 max-w-[46ch] text-caption leading-[1.7] text-ink-80">
                กรอกใบสมัครใช้เวลา 2–3 นาที ไม่มีค่าสมัคร
                ทีมงานตรวจสอบและติดต่อกลับภายใน 3 วันทำการ
              </p>
              {draft ? null : (
                <div className="mt-7 flex justify-center">
                  <CtaButton href="/apply" variant="brand">
                    เริ่มกรอกใบสมัคร
                    <ArrowRight aria-hidden className="size-[18px]" />
                  </CtaButton>
                </div>
              )}
            </section>
          ) : (
            <ul className="mt-10 space-y-4">
              {applications.map((application) => {
                const meta = STATUS_META[application.status];
                const fileCount = application.documents?.length ?? 0;

                return (
                  <li key={application.applicationId}>
                    {/* ทั้งการ์ดเป็นลิงก์ ไม่ใช่แค่ตัวหนังสือท้ายการ์ด — เป้ากดใหญ่ที่สุดเท่าที่เป็นไปได้
                        เพราะหน้านี้ถูกเปิดบนมือถือในร้านเป็นหลัก จึงยกตัวตอน hover ได้อย่างถูกต้อง */}
                    <Link
                      href={`/me/${application.applicationId}`}
                      className="block rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift hover:ring-ink-48/25 motion-reduce:hover:translate-y-0 sm:p-7"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                        <div>
                          <p className="text-caption tabular-nums text-ink-48">
                            {application.applicationId}
                          </p>
                          <h2 className="mt-1 text-lead font-semibold">
                            {application.data?.shop?.name || "ไม่ได้ระบุชื่อร้าน"}
                          </h2>
                        </div>
                        <span
                          className={`inline-flex min-h-[30px] shrink-0 items-center rounded-full px-3.5 text-fine font-semibold ${statusChipClass(application.status)}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <p className="mt-3 max-w-[70ch] text-caption leading-[1.7] text-ink-80">
                        {meta.detail}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4 text-fine text-ink-48">
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
                        <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-brand-ink">
                          ดูรายละเอียด
                          <ArrowRight aria-hidden className="size-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
