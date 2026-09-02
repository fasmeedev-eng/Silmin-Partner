import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, NotebookPen } from "lucide-react";
import { guardRole } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { findApplication, listActivities } from "@/lib/db/applications";
import { formatAddress } from "@/lib/application/address";
import { ALLOWED_TRANSITIONS } from "@/lib/application/transitions";
import { STATUS_META, STATUS_TRACK, statusChipClass, trackIndex } from "@/lib/application/status";
import { documentsComplete, missingCategories } from "@/lib/application/categories";
import {
  BRANCH_COUNTS,
  BRANDS,
  CONTACT_POSITIONS,
  INSTALLMENT_STATUS,
  INTERESTS,
  PRICE_RANGES,
  PRODUCTS,
  SHOP_TYPES,
  labelOf,
  labelsOf,
} from "@/lib/application/options";
import { ApplicationOverviewCard } from "@/components/admin/detail/overview-card";
import { DocumentsCard } from "@/components/admin/detail/documents-card";
import { ActivityTimeline } from "@/components/admin/detail/activity-timeline";
import { StatusMessageCard } from "@/components/admin/detail/status-message";
import { SummaryCard, SummaryRow } from "@/components/admin/detail/summary-card";
import { StaffPanel } from "./staff-panel";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return { title: applicationId };
}

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const guard = await guardRole(["admin", "employee"]);
  if (!guard.allowed) return null;

  const { applicationId } = await params;
  const application = await findApplication(applicationId);
  if (!application) notFound();

  const activities = await listActivities(applicationId, { includeInternal: true });
  const [canChangeStatus, canWriteNotes, canViewDocuments] = await Promise.all([
    can(guard.staff.role, "changeStatus"),
    can(guard.staff.role, "internalNotes"),
    can(guard.staff.role, "viewDocuments"),
  ]);

  const { data, status } = application;
  const documents = application.documents ?? [];
  const complete = documentsComplete(documents);
  const missing = missingCategories(documents);
  const address = formatAddress(data.shop.address);

  // เวลาที่เข้าสู่สถานะปัจจุบัน — ยังไม่เคยเปลี่ยนสถานะเลยก็ใช้วันที่ส่งแทน
  // ใช้แบบเดียวกับที่ dashboard ใช้ตัดสิน "แนวโน้ม" (ดู anchorAt ใน lib/db/dashboard.ts)
  const anchorAt = application.statusChangedAt ?? application.submittedAt;

  // ปุ่ม "ดำเนินการ" บนหัวหน้าโชว์เฉพาะตอนมีขั้นถัดไปให้เลือกจริง ๆ
  // ใบที่จบกระบวนการแล้ว (ActivePartner/Rejected) หรือบัญชีที่ไม่มีสิทธิ์ ไม่มีอะไรให้กด
  const hasNextSteps = canChangeStatus && ALLOWED_TRANSITIONS[status].length > 0;

  // ผู้ทำรายการล่าสุด — ระบบนี้ไม่มี "ผู้ดูแลใบสมัคร" ที่มอบหมายไว้ล่วงหน้า (ดู CLAUDE.md
  // ส่วนหลังบ้าน: ทุกคนเห็นทุกใบ ไม่มีการมอบหมาย) สิ่งที่มีจริงคือ "ใครเพิ่งแตะใบนี้ล่าสุด"
  // ซึ่งอ่านได้จาก activity ที่มี actorLabel (เฉพาะเหตุการณ์ที่เจ้าหน้าที่เป็นคนทำ)
  const lastStaffActivity = activities.find((a) => a.actorLabel);

  const shopTypeLabel =
    data.shop.type === "other" ? data.shop.typeOther : labelOf(SHOP_TYPES, data.shop.type);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8 lg:py-12">
      <Link
        href="/admin"
        className="inline-flex min-h-[48px] items-center gap-2 text-body text-ink-80 transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-5" />
        กลับไปยังคิวใบสมัคร
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h3 sm:text-h2">{data.shop.name || "ไม่ได้ระบุชื่อร้าน"}</h1>
          <p className="mt-2 text-caption tabular-nums text-ink-48">
            เลขที่ {application.applicationId}
            {application.submittedAt ? ` · ส่งเมื่อ ${thaiDate.format(application.submittedAt)}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span
            className={`inline-flex min-h-[36px] items-center rounded-full px-5 text-body font-semibold ${statusChipClass(status)}`}
          >
            {STATUS_META[status].label}
          </span>
          {/* ลิงก์เลื่อนไปหาช่องโน้ตภายในที่ท้ายแผงตัดสินใจด้านล่าง — ไม่ใช่ช่องกรอกใหม่ตรงนี้
              เพราะจะกลายเป็นทางเข้าที่สองไปเขียนที่เดียวกัน ต้องคอยซิงก์สองจุดให้ตรงกัน */}
          {canWriteNotes ? (
            <a
              href="#internal-note"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-btn px-5 text-body font-semibold text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
            >
              <NotebookPen aria-hidden className="size-4" />
              บันทึกหมายเหตุ
            </a>
          ) : null}
          {/* แถบเลื่อนไปหาแผงตัดสินใจด้านล่าง — ไม่ทำเป็นปุ่ม/เมนูแยกชุดใหม่ เพราะจะกลายเป็น
              ทางเลือกที่สองสำหรับการกระทำเดียวกัน แล้วสับสนว่าอันไหนคือของจริง */}
          {hasNextSteps ? (
            <a
              href="#next-steps"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-btn bg-brand px-5 text-body font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-hover"
            >
              ดำเนินการ
            </a>
          ) : null}
        </div>
      </div>

      {application.statusMessage ? (
        <StatusMessageCard status={status} message={application.statusMessage} />
      ) : null}

      {/* ติดต่อร้านมาก่อนข้อมูลอื่น เพราะงานจริงคือ "โทรหาร้าน" ไม่ใช่ "อ่านข้อมูล" — รวมอยู่ในการ์ด
          เดียวกับความคืบหน้า เพราะทั้งคู่ตอบคำถามเดียวกันคือ "ใบนี้อยู่จุดไหนตอนนี้" */}
      <ApplicationOverviewCard
        fullName={data.contact.fullName}
        position={data.contact.position}
        positionOther={data.contact.positionOther}
        phone={data.contact.phone}
        lineId={data.contact.lineId}
        email={data.contact.email}
        callbackChannel={data.interests.callbackChannel}
        callbackSlot={data.interests.callbackSlot}
        status={status}
        anchorAt={anchorAt}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="space-y-6 lg:col-span-3">
          {/* id นี้คือปลายทางของปุ่ม "ดำเนินการ" และ "บันทึกหมายเหตุ" ด้านบน — scroll-mt กันไม่ให้
              แถบบนที่ sticky บังหัวข้อตอนกระโดดลงมา */}
          <div id="next-steps" className="scroll-mt-24">
            <StaffPanel
              applicationId={applicationId}
              shopName={data.shop.name}
              status={status}
              canChangeStatus={canChangeStatus}
              canWriteNotes={canWriteNotes}
            />
          </div>
          <DocumentsCard documents={documents} canView={canViewDocuments} />
        </div>

        <div className="space-y-6 lg:col-span-2 max-h-[91vh] overflow-y-auto rounded-lg">
          <SummaryCard title="ข้อมูลสรุปใบสมัคร">
            <SummaryRow label="เลขที่ใบสมัคร" value={<span className="tabular-nums">{application.applicationId}</span>} />
            <SummaryRow
              label="ประเภทร้าน"
              value={
                <span className="inline-flex min-h-[26px] items-center rounded-full bg-gold-soft px-3 text-fine font-semibold text-gold-ink">
                  {shopTypeLabel || "ไม่ได้ระบุ"}
                </span>
              }
            />
            <SummaryRow
              label="วันที่สมัคร"
              value={application.submittedAt ? thaiDate.format(application.submittedAt) : "—"}
            />
            {/* ระบบนี้มีทางเข้าใบสมัครทางเดียวคือฟอร์มหน้าเว็บหลังสแกน QR แล้วล็อกอินด้วย Google
                ไม่มีช่องทางอื่น (ไม่มีแอดมินสร้างใบสมัครแทนร้าน) จึงเป็นค่าคงที่ ไม่ใช่ข้อมูลต่อใบ */}
            <SummaryRow label="ช่องทางสมัคร" value="หน้าเว็บไซต์ (หลังสแกน QR และเข้าสู่ระบบ)" />
            <SummaryRow
              label="ผู้ทำรายการล่าสุด"
              value={
                lastStaffActivity
                  ? `${lastStaffActivity.actorLabel} · ${thaiDate.format(lastStaffActivity.at)}`
                  : "ยังไม่มีเจ้าหน้าที่ดำเนินการ"
              }
            />
            <SummaryRow
              label="สถานะปัจจุบัน"
              value={
                <span
                  className={`inline-flex min-h-[26px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass(status)}`}
                >
                  {STATUS_META[status].label}
                </span>
              }
            />
            <SummaryRow
              label="ความคืบหน้า"
              value={`${trackIndex(status) + 1} จาก ${STATUS_TRACK.length} ขั้นตอน`}
            />
            <SummaryRow
              label="เอกสารครบถ้วน"
              value={
                complete ? (
                  "ครบ"
                ) : (
                  <span className="text-gold-ink">ขาด{missing.map((c) => c.label).join(" และ ")}</span>
                )
              }
            />
          </SummaryCard>

          <ActivityTimeline activities={activities} />

          <SummaryCard title="ข้อมูลร้าน">
            <SummaryRow label="ชื่อร้านค้า" value={data.shop.name} />
            <SummaryRow label="ประเภทร้าน" value={shopTypeLabel} />
            <SummaryRow label="จำนวนสาขา" value={labelOf(BRANCH_COUNTS, data.shop.branchCount)} />
            <SummaryRow label="ที่อยู่" value={<span className="whitespace-pre-line">{address}</span>} />
            <SummaryRow label="จุดสังเกต" value={data.shop.address.landmark} />
            <SummaryRow
              label="พิกัด"
              value={
                data.shop.lat && data.shop.lng
                  ? `${data.shop.lat}, ${data.shop.lng}`
                  : "ไม่ได้ระบุ"
              }
            />
          </SummaryCard>

          <SummaryCard title="ผู้ติดต่อ">
            <SummaryRow label="ชื่อผู้ติดต่อ" value={data.contact.fullName} />
            <SummaryRow
              label="ตำแหน่ง"
              value={
                data.contact.position === "other"
                  ? data.contact.positionOther
                  : labelOf(CONTACT_POSITIONS, data.contact.position)
              }
            />
            <SummaryRow label="เบอร์โทรศัพท์" value={data.contact.phone} />
            <SummaryRow label="LINE ID" value={data.contact.lineId} />
            <SummaryRow label="อีเมล" value={data.contact.email} />
          </SummaryCard>

          <SummaryCard title="ธุรกิจและการขาย">
            <SummaryRow
              label="สินค้าที่จำหน่าย"
              value={<span className="whitespace-pre-line">{labelsOf(PRODUCTS, data.business.products)}</span>}
            />
            <SummaryRow
              label="แบรนด์ที่จำหน่าย"
              value={<span className="whitespace-pre-line">{labelsOf(BRANDS, data.business.brands)}</span>}
            />
            <SummaryRow label="ช่วงราคาที่ขาย" value={labelOf(PRICE_RANGES, data.sales.priceRange)} />
            <SummaryRow
              label="บริการผ่อน/ไฟแนนซ์"
              value={labelOf(INSTALLMENT_STATUS, data.sales.installmentStatus)}
            />
            {data.sales.installmentStatus === "yes" ? (
              <SummaryRow label="ผู้ให้บริการปัจจุบัน" value={data.sales.installmentProviders} />
            ) : null}
            <SummaryRow
              label="สนใจเข้าร่วมเพราะ"
              value={<span className="whitespace-pre-line">{labelsOf(INTERESTS, data.interests.reasons)}</span>}
            />
          </SummaryCard>

          {application.consent ? (
            <SummaryCard title="หลักฐานการยินยอม (PDPA)">
              <SummaryRow
                label="ยืนยันข้อมูลจริง"
                value={
                  application.consent.truthful.accepted
                    ? thaiDate.format(application.consent.truthful.at)
                    : "ไม่ได้ยินยอม"
                }
              />
              <SummaryRow
                label="ยินยอมตาม PDPA"
                value={
                  application.consent.pdpa.accepted
                    ? thaiDate.format(application.consent.pdpa.at)
                    : "ไม่ได้ยินยอม"
                }
              />
              <SummaryRow label="เวอร์ชันนโยบาย" value={application.consent.policyVersion} />
              <SummaryRow label="IP ที่กดยอมรับ" value={application.consent.ip} />
            </SummaryCard>
          ) : null}
        </div>
      </div>
    </main>
  );
}
