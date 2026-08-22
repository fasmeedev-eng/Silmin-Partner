import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, CircleCheck, FileText, Paperclip, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { findOwnApplication, listActivities } from "@/lib/db/applications";
import {
  STATUS_META,
  STATUS_TRACK,
  editBlockedReason,
  isEditable,
  statusChipClass,
  trackIndex,
} from "@/lib/application/status";
import { DOCUMENT_CATEGORIES } from "@/lib/application/categories";
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

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-hairline py-3 last:border-b-0">
      <dt className="w-full text-caption text-ink-48 sm:w-52">{label}</dt>
      <dd className="flex-1 text-caption text-ink">{value || "—"}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset">
      <h2 className="text-body font-semibold">{title}</h2>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return { title: `ใบสมัคร ${applicationId}` };
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/me");

  const { applicationId } = await params;
  const [application, { saved }] = await Promise.all([
    findOwnApplication(session.user.id, applicationId),
    searchParams,
  ]);
  // ไม่พบ = ไม่มีจริง หรือไม่ใช่ของคนนี้ — ทั้งสองกรณีตอบเหมือนกัน ไม่บอกใบ้ว่าเลขนี้มีอยู่
  if (!application) redirect("/me");

  const { data, status } = application;
  const meta = STATUS_META[status];
  const editable = isEditable(status);
  const activities = await listActivities(applicationId);
  const current = trackIndex(status);
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
    <>
      <SiteHeader signedIn email={session.user.email} role={session.user.role} />

      <main className="mx-auto w-full max-w-[820px] px-6 py-12 sm:px-8 sm:py-16">
        <Link
          href="/me"
          className="inline-flex min-h-[44px] items-center gap-2 text-caption text-ink-80 transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          ใบสมัครทั้งหมด
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption tabular-nums text-ink-48">{application.applicationId}</p>
            <h1 className="mt-1 text-h3 sm:text-h2">{data.shop.name || "ใบสมัครพาร์ทเนอร์"}</h1>
          </div>
          <span
            className={`inline-flex min-h-[32px] shrink-0 items-center rounded-full px-4 text-caption font-semibold ${statusChipClass(status)}`}
          >
            {meta.label}
          </span>
        </div>

        {saved ? (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-pearl p-4 text-caption text-ink ring-1 ring-hairline ring-inset"
          >
            <CircleCheck aria-hidden className="size-4 shrink-0 text-accent-ink" />
            บันทึกการแก้ไขเรียบร้อยแล้ว
          </p>
        ) : null}

        <p className="mt-4 max-w-[60ch] text-body text-ink-80">{meta.detail}</p>

        {/* ข้อความจากเจ้าหน้าที่ต้องเด่นกว่าคำอธิบายสถานะทั่วไป เพราะเป็นสิ่งที่เขียนถึงร้านนี้โดยเฉพาะ */}
        {application.statusMessage ? (
          <div className="mt-5 max-w-[62ch] rounded-lg bg-parchment p-5 ring-1 ring-hairline ring-inset">
            <p className="text-caption font-semibold text-ink">ข้อความจากเจ้าหน้าที่</p>
            <p className="mt-2 whitespace-pre-line text-caption text-ink-80">
              {application.statusMessage}
            </p>
          </div>
        ) : null}
        {application.submittedAt ? (
          <p className="mt-2 text-caption text-ink-48">
            ส่งเมื่อ {thaiDate.format(application.submittedAt)}
          </p>
        ) : null}

        {/* แก้ไขได้เฉพาะสถานะ "รับข้อมูลแล้ว" — สถานะอื่นบอกเหตุผลแทนที่จะซ่อนปุ่มเงียบ ๆ
            คนที่จำได้ว่าเคยแก้ได้ ต้องรู้ว่าทำไมตอนนี้ทำไม่ได้และควรทำอย่างไรแทน */}
        {editable ? (
          <Link
            href={`/me/${applicationId}/edit`}
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
          >
            <Pencil aria-hidden className="size-4" />
            แก้ไขข้อมูลใบสมัคร
          </Link>
        ) : (
          <p className="mt-6 rounded-md bg-pearl p-4 text-caption text-ink-80 ring-1 ring-hairline ring-inset">
            {editBlockedReason(status)}
          </p>
        )}

        {/* แถบความคืบหน้า — ตอบคำถามเดียวที่ผู้สมัครอยากรู้: ตอนนี้อยู่ตรงไหนของเส้นทาง */}
        <section className="mt-10" aria-label="ความคืบหน้าของใบสมัคร">
          <ol className="grid gap-x-4 gap-y-6 sm:grid-cols-5">
            {STATUS_TRACK.map((step, index) => {
              const done = index < current;
              const isCurrent = index === current;
              return (
                <li key={step.status} className="border-t-2 pt-4"
                  style={{ borderColor: index <= current ? "var(--accent)" : "var(--hairline)" }}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-fine font-semibold ${
                      done || isCurrent ? "bg-accent text-on-accent" : "bg-pearl text-ink-48 ring-1 ring-hairline ring-inset"
                    }`}
                  >
                    {done ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : index + 1}
                  </span>
                  <p
                    className={`mt-2 text-caption ${isCurrent ? "font-semibold text-ink" : "text-ink-48"}`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>
          {status === "NeedMoreInfo" || status === "Rejected" ? (
            <p className="mt-6 rounded-md bg-pearl p-4 text-caption text-ink-80 ring-1 ring-hairline ring-inset">
              {status === "NeedMoreInfo"
                ? "ใบสมัครหยุดรออยู่ที่ขั้นตรวจสอบ จนกว่าจะได้รับข้อมูลเพิ่มเติมจากคุณ"
                : "ใบสมัครนี้สิ้นสุดที่ขั้นตรวจสอบ"}
            </p>
          ) : null}
        </section>

        <div className="mt-10 space-y-4">
          <Block title="ข้อมูลร้าน">
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

          <Block title="ผู้ติดต่อ">
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

          <Block title="ข้อมูลธุรกิจและการขาย">
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
          </Block>

          <Block title="ความสนใจและการติดต่อกลับ">
            <Row label="สนใจเข้าร่วมเพราะ" value={labelsOf(INTERESTS, data.interests.reasons)} />
            <Row
              label="ช่องทางติดต่อกลับ"
              value={labelOf(CALLBACK_CHANNELS, data.interests.callbackChannel)}
            />
            <Row label="ช่วงเวลาที่สะดวก" value={labelOf(CALLBACK_SLOTS, data.interests.callbackSlot)} />
          </Block>

          <section className="rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset">
            <h2 className="text-body font-semibold">
              เอกสารแนบ
              <span className="pl-2 font-normal text-ink-48">
                {application.documents?.length ?? 0} ไฟล์
              </span>
            </h2>

            {application.documents?.length ? (
              <div className="mt-4 space-y-5">
                {DOCUMENT_CATEGORIES.map((category) => {
                  const files = application.documents?.filter((d) => d.category === category.id) ?? [];
                  if (files.length === 0) return null;
                  return (
                    <div key={category.id}>
                      <h3 className="text-caption font-semibold text-ink-48">{category.label}</h3>
                      <ul className="mt-2 space-y-2">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            className="flex items-center gap-3 rounded-md bg-pearl p-3 ring-1 ring-hairline ring-inset"
                          >
                            <Paperclip aria-hidden className="size-4 shrink-0 text-ink-48" />
                            <a
                              href={`/api/documents/${file.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-w-0 flex-1 truncate text-caption text-accent-ink underline underline-offset-4"
                            >
                              {file.fileName}
                            </a>
                            <span className="shrink-0 text-fine text-ink-48">
                              {humanSize(file.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-caption text-ink-48">
                <FileText aria-hidden className="size-4" />
                ไม่มีเอกสารแนบในใบสมัครนี้
              </p>
            )}
          </section>
        </div>

        {/* ประวัติการแก้ไข — ผู้สมัครต้องเห็นด้วย ไม่ใช่เก็บไว้ให้เจ้าหน้าที่ฝ่ายเดียว
            เพราะเป็นหลักฐานว่าสิ่งที่แก้ไปถูกบันทึกจริง */}
        {activities.length > 0 ? (
          <section className="mt-4 rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset">
            <h2 className="text-body font-semibold">ประวัติของใบสมัคร</h2>
            <ol className="mt-4 space-y-4">
              {activities.map((activity, index) => (
                <li key={`${activity.at.toISOString()}-${index}`} className="border-l-2 border-hairline pl-4">
                  <p className="text-caption text-ink">{activity.message}</p>
                  <p className="mt-0.5 text-fine text-ink-48">{thaiDate.format(activity.at)}</p>
                  {activity.changes?.length ? (
                    <ul className="mt-2 space-y-1">
                      {activity.changes.map((change) => (
                        <li key={change.path} className="text-fine text-ink-80">
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
          </section>
        ) : null}

        <p className="mt-10 text-caption text-ink-48">
          มีข้อสงสัยเกี่ยวกับใบสมัครนี้ ติดต่อทีมงานที่{" "}
          <a
            href="mailto:partner@silmin.co.th"
            className="text-accent-ink underline underline-offset-4"
          >
            partner@silmin.co.th
          </a>{" "}
          พร้อมแจ้งเลขที่ใบสมัคร
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
