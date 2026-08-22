import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  ShieldCheck,
  Store,
  User,
  type LucideIcon,
} from "lucide-react";
import { guardRole } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { findApplication, listActivities } from "@/lib/db/applications";
import { STATUS_META, statusChipClass } from "@/lib/application/status";
import {
  DOCUMENT_CATEGORIES,
  documentsComplete,
  missingCategories,
} from "@/lib/application/categories";
import { humanSize } from "@/lib/application/documents";
import {
  BRANCH_COUNTS,
  BRANDS,
  CALLBACK_CHANNELS,
  CALLBACK_SLOTS,
  CONTACT_POSITIONS,
  INSTALLMENT_STATUS,
  INTERESTS,
  PRICE_RANGES,
  PRODUCTS,
  SHOP_TYPES,
  labelOf,
  labelsOf,
} from "@/lib/application/options";
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-hairline py-3 last:border-b-0">
      <dt className="w-full text-caption text-ink-48 sm:w-44">{label}</dt>
      <dd className="flex-1 text-body text-ink">{value || "—"}</dd>
    </div>
  );
}

/** ข้อมูลรายละเอียดพับเก็บได้ — เจ้าหน้าที่ส่วนใหญ่ดูแค่ชื่อร้าน เบอร์ และเอกสาร
 *  ไอคอนช่วยให้กวาดสายตาหาบล็อกที่ต้องการโดยไม่ต้องอ่านหัวข้อทีละอัน */
function Block({
  title,
  icon: Icon,
  children,
  open = false,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded-lg bg-canvas ring-1 ring-hairline ring-inset">
      <summary className="flex min-h-[60px] cursor-pointer items-center justify-between gap-4 px-6 text-body font-semibold">
        <span className="flex items-center gap-2.5">
          <Icon aria-hidden className="size-4 shrink-0 text-accent-ink" />
          {title}
        </span>
        <span aria-hidden className="text-caption font-normal text-ink-48">
          แตะเพื่อเปิด/ปิด
        </span>
      </summary>
      <dl className="px-6 pb-5">{children}</dl>
    </details>
  );
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
  const address = [
    data.shop.address.line1,
    data.shop.address.road && `ถนน${data.shop.address.road}`,
    data.shop.address.subDistrict,
    data.shop.address.district,
    data.shop.address.province,
    data.shop.address.postalCode,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto w-full  px-6 py-8 sm:px-8 sm:py-10">
      <Link
        href="/admin"
        className="inline-flex min-h-[48px] items-center gap-2 text-body text-ink-80 transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-5" />
        กลับไปรายการใบสมัคร
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h3 sm:text-h2">{data.shop.name || "ไม่ได้ระบุชื่อร้าน"}</h1>
          <p className="mt-2 text-caption tabular-nums text-ink-48">
            เลขที่ {application.applicationId}
            {application.submittedAt ? ` · ส่งเมื่อ ${thaiDate.format(application.submittedAt)}` : ""}
          </p>
        </div>
        <span
          className={`inline-flex min-h-[36px] shrink-0 items-center rounded-full px-5 text-body font-semibold ${statusChipClass(status)}`}
        >
          {STATUS_META[status].label}
        </span>
      </div>

      {/* ติดต่อร้านมาก่อนข้อมูลอื่น เพราะงานจริงคือ "โทรหาร้าน" ไม่ใช่ "อ่านข้อมูล" */}
      <section className="mt-6 rounded-lg bg-tile p-6 text-on-dark sm:p-8">
        <h2 className="text-caption font-semibold text-on-dark-muted">ติดต่อร้านนี้</h2>
        <p className="mt-3 text-body">{data.contact.fullName || "—"}</p>

        <a
          href={`tel:${data.contact.phone}`}
          className="mt-2 inline-flex min-h-[56px] items-center gap-3 rounded-full bg-accent px-7 text-body font-semibold tabular-nums text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Phone aria-hidden className="size-5" />
          {data.contact.phone || "ไม่มีเบอร์โทร"}
        </a>

        <p className="mt-4 inline-flex items-center gap-2 text-body">
          <Clock aria-hidden className="size-4 text-accent" />
          ร้านสะดวกให้ติดต่อทาง{" "}
          <span className="font-semibold">
            {labelOf(CALLBACK_CHANNELS, data.interests.callbackChannel)}
          </span>{" "}
          ช่วง{" "}
          <span className="font-semibold">
            {labelOf(CALLBACK_SLOTS, data.interests.callbackSlot)}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-caption text-on-dark-muted">
          {data.contact.lineId ? (
            <span className="inline-flex items-center gap-2">
              <MessageCircle aria-hidden className="size-4" />
              LINE: {data.contact.lineId}
            </span>
          ) : null}
          {data.contact.email ? (
            <a
              href={`mailto:${data.contact.email}`}
              className="inline-flex items-center gap-2 underline underline-offset-4"
            >
              <Mail aria-hidden className="size-4" />
              {data.contact.email}
            </a>
          ) : null}
        </div>
      </section>

      <div className="mt-6">
        <StaffPanel
          applicationId={applicationId}
          shopName={data.shop.name}
          status={status}
          canChangeStatus={canChangeStatus}
          canWriteNotes={canWriteNotes}
        />
      </div>

      {/* เอกสารเปิดไว้เสมอ เพราะเป็นสิ่งที่ต้องดูก่อนตัดสินใจ */}
      <section className="mt-6 rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-body font-semibold">
            <Paperclip aria-hidden className="size-4 text-ink-48" />
            เอกสารที่ร้านแนบมา
          </h2>
          <span
            className={`inline-flex min-h-[28px] items-center rounded-full px-4 text-fine font-semibold ${complete ? "bg-pearl text-ink-80 ring-1 ring-hairline ring-inset" : "bg-accent text-on-accent"
              }`}
          >
            {complete ? "ครบแล้ว" : `ขาด${missing.map((c) => c.label).join(" และ ")}`}
          </span>
        </div>

        {!canViewDocuments ? (
          <p className="mt-4 rounded-md bg-pearl p-4 text-caption text-ink-80 ring-1 ring-hairline ring-inset">
            บัญชีของคุณไม่มีสิทธิ์เปิดดูเอกสารแนบ
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            {DOCUMENT_CATEGORIES.map((category) => {
              const files = documents.filter((d) => d.category === category.id);
              return (
                <div key={category.id}>
                  <h3 className="text-caption font-semibold text-ink-48">
                    {category.label}
                    {category.required ? <span className="pl-1 text-accent-ink">*</span> : null}
                  </h3>
                  {files.length === 0 ? (
                    <p className="mt-1.5 text-caption text-ink-48">ไม่มีไฟล์</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {files.map((file) => (
                        <li key={file.id}>
                          <a
                            href={`/api/documents/${file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-[56px] items-center gap-3 rounded-md bg-pearl px-4 ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
                          >
                            <Paperclip aria-hidden className="size-4 shrink-0 text-ink-48" />
                            <span className="min-w-0 flex-1 truncate text-body text-accent-ink underline underline-offset-4">
                              {file.fileName}
                            </span>
                            <span className="shrink-0 text-fine text-ink-48">
                              {humanSize(file.size)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            <p className="border-t border-hairline pt-4 text-fine text-ink-48">
              ระบบบันทึกไว้ว่าใครเปิดดูไฟล์ไหนเมื่อไหร่
            </p>
          </div>
        )}
      </section>

      <h2 className="mt-10 flex items-center gap-2 text-body font-semibold">
        <FileText aria-hidden className="size-4 text-ink-48" />
        ข้อมูลที่ร้านกรอกมา
      </h2>
      <div className="mt-3 space-y-3">
        <Block title="ข้อมูลร้าน" icon={Store} open>
          <Row label="ชื่อร้านค้า" value={data.shop.name} />
          <Row
            label="ประเภทร้าน"
            value={data.shop.type === "other" ? data.shop.typeOther : labelOf(SHOP_TYPES, data.shop.type)}
          />
          <Row label="จำนวนสาขา" value={labelOf(BRANCH_COUNTS, data.shop.branchCount)} />
          <Row label="ที่อยู่" value={address} />
          <Row
            label="พิกัด"
            value={data.shop.lat && data.shop.lng ? `${data.shop.lat}, ${data.shop.lng}` : "ไม่ได้ระบุ"}
          />
        </Block>

        <Block title="ผู้ติดต่อ" icon={User}>
          <Row label="ชื่อ–นามสกุล" value={data.contact.fullName} />
          <Row
            label="ตำแหน่ง"
            value={
              data.contact.position === "other"
                ? data.contact.positionOther
                : labelOf(CONTACT_POSITIONS, data.contact.position)
            }
          />
          <Row label="เบอร์โทรศัพท์" value={data.contact.phone} />
          <Row label="LINE ID" value={data.contact.lineId} />
          <Row label="อีเมล" value={data.contact.email} />
        </Block>

        <Block title="ธุรกิจและการขาย" icon={Briefcase}>
          <Row label="สินค้าที่จำหน่าย" value={labelsOf(PRODUCTS, data.business.products)} />
          <Row label="แบรนด์ที่จำหน่าย" value={labelsOf(BRANDS, data.business.brands)} />
          <Row label="ช่วงราคาที่ขาย" value={labelOf(PRICE_RANGES, data.sales.priceRange)} />
          <Row
            label="บริการผ่อน/ไฟแนนซ์"
            value={labelOf(INSTALLMENT_STATUS, data.sales.installmentStatus)}
          />
          {data.sales.installmentStatus === "yes" ? (
            <Row label="ผู้ให้บริการปัจจุบัน" value={data.sales.installmentProviders} />
          ) : null}
          <Row label="สนใจเข้าร่วมเพราะ" value={labelsOf(INTERESTS, data.interests.reasons)} />
        </Block>

        {application.consent ? (
          <Block title="หลักฐานการยินยอม (PDPA)" icon={ShieldCheck}>
            <Row
              label="ยืนยันข้อมูลจริง"
              value={
                application.consent.truthful.accepted
                  ? thaiDate.format(application.consent.truthful.at)
                  : "ไม่ได้ยินยอม"
              }
            />
            <Row
              label="ยินยอมตาม PDPA"
              value={
                application.consent.pdpa.accepted
                  ? thaiDate.format(application.consent.pdpa.at)
                  : "ไม่ได้ยินยอม"
              }
            />
            <Row label="เวอร์ชันนโยบาย" value={application.consent.policyVersion} />
            <Row label="IP ที่กดยอมรับ" value={application.consent.ip} />
          </Block>
        ) : null}
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-body font-semibold">
          <Clock aria-hidden className="size-4 text-ink-48" />
          ประวัติของใบสมัครนี้
        </h2>
        {activities.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-caption text-ink-48">
            <FileText aria-hidden className="size-4" />
            ยังไม่มีเหตุการณ์
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {activities.map((activity, index) => (
              <li
                key={`${activity.at.toISOString()}-${index}`}
                className={`border-l-2 pl-4 ${activity.visibility === "internal" ? "border-accent" : "border-hairline"
                  }`}
              >
                {activity.visibility === "internal" ? (
                  <p className="text-fine font-semibold text-accent-ink">โน้ตภายใน · ร้านไม่เห็น</p>
                ) : null}
                <p className="text-body text-ink">{activity.message}</p>
                <p className="mt-1 text-caption text-ink-48">
                  {thaiDate.format(activity.at)}
                  {activity.actorLabel ? ` · โดย ${activity.actorLabel}` : ""}
                </p>
                {activity.changes?.length ? (
                  <ul className="mt-2 space-y-1">
                    {activity.changes.map((change) => (
                      <li key={change.path} className="text-caption text-ink-80">
                        <span className="text-ink-48">{change.label}: </span>
                        <span className="line-through decoration-ink-48">{change.before}</span>
                        <span className="px-1.5 text-ink-48">→</span>
                        <span>{change.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
