import Link from "next/link";
import {
  ChevronDown,
  ClipboardList,
  Clock,
  CircleCheck,
  CircleX,
  MessageCircleWarning,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { guardRole } from "@/lib/auth/guard";
import {
  listAllApplications,
  listUsedProvinces,
  parsePageSize,
  type ApplicationStatus,
} from "@/lib/db/applications";
import { findOldestPending, loadQueueSummary } from "@/lib/db/dashboard";
import { KPI_BUCKETS, kpiBucketById, type KpiBucketId } from "@/lib/application/status";
import { SHOP_TYPES } from "@/lib/application/options";
import {
  DateRangeFilter,
  ExportMenu,
  parseQueueRange,
  queueRangeDays,
} from "@/components/admin/queue/queue-controls";
import { QueueBucketCard, QueueTotalCard } from "@/components/admin/queue/queue-stat-card";
import { QueuePagination } from "@/components/admin/queue/queue-pagination";
import { QueueTable, type QueueRow } from "@/components/admin/queue/queue-table";
import type { TrendPolarity } from "@/components/admin/trend-line";

export const metadata = { title: "คิวใบสมัคร" };

/**
 * ไอคอนและสีชิปของแต่ละกอง เก็บที่นี่ไม่ใช่ใน KPI_BUCKETS
 * เพราะไฟล์นั้นเป็นข้อมูลล้วนที่ฝั่งเซิร์ฟเวอร์ใช้กรองคิวรีด้วย การยัดคลาส CSS ลงไป
 * จะผูกมันเข้ากับการแสดงผลโดยไม่จำเป็น (กฎเดียวกับ BUCKET_STYLE ของแดชบอร์ด)
 *
 * สีชิปตรงกับ statusChipClass ของสถานะในกองนั้น — การ์ดกับตารางอยู่บนจอเดียวกัน
 */
const BUCKET_STYLE: Record<
  KpiBucketId,
  { icon: LucideIcon; chip: string; polarity: TrendPolarity }
> = {
  pending: {
    icon: Clock,
    chip: "bg-pearl text-ink-80 ring-1 ring-inset ring-hairline",
    polarity: "neutral",
  },
  needinfo: {
    icon: MessageCircleWarning,
    chip: "bg-gold-soft text-gold-ink ring-1 ring-inset ring-gold/40",
    polarity: "less-is-good",
  },
  approved: { icon: CircleCheck, chip: "bg-nav text-white", polarity: "more-is-good" },
  rejected: {
    icon: CircleX,
    chip: "bg-danger/10 text-danger-ink ring-1 ring-inset ring-danger/25",
    polarity: "less-is-good",
  },
};

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const result = await guardRole(["admin", "employee"]);
  if (!result.allowed) return null;
  const { staff } = result;

  const params = await searchParams;
  const tab = kpiBucketById(params.tab)?.id ?? "all";
  const tabStatuses = kpiBucketById(tab)?.statuses;
  const range = parseQueueRange(params.range);
  const rangeDays = queueRangeDays(range);
  const shopType = SHOP_TYPES.some((t) => t.value === params.type) ? params.type : undefined;
  const province = params.province || undefined;
  const documents: "complete" | "incomplete" | undefined =
    params.documents === "complete" || params.documents === "incomplete"
      ? params.documents
      : undefined;
  const sort = params.sort === "newest" ? ("newest" as const) : ("oldest" as const);
  const pageSize = parsePageSize(params.size);
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const filters = {
    statuses: tabStatuses ? [...tabStatuses] : undefined,
    province,
    shopType,
    documents,
    q: params.q?.trim() || undefined,
    from: rangeDays === null ? undefined : new Date(Date.now() - rangeDays * 86_400_000),
    sort,
    page,
    pageSize,
  };

  const [listed, summary, provinces, oldestPending] = await Promise.all([
    listAllApplications(filters),
    loadQueueSummary(),
    listUsedProvinces(),
    findOldestPending(),
  ]);

  /** สร้าง URL โดยคงตัวกรองอื่นไว้ — ทุกลิงก์บนหน้านี้ต้องไม่ทำให้ตัวกรองที่ตั้งไว้หายไป */
  const hrefWith = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      tab: tab === "all" ? undefined : tab,
      range: range === "all" ? undefined : range,
      type: shopType,
      province,
      documents,
      q: filters.q,
      sort: sort === "oldest" ? undefined : sort,
      size: pageSize === 20 ? undefined : String(pageSize),
      page: page === 1 ? undefined : String(page),
      ...Object.fromEntries(
        Object.entries(overrides).map(([k, v]) => [k, v === undefined ? undefined : String(v)]),
      ),
    };
    for (const [key, value] of Object.entries(base)) if (value) next.set(key, value);
    const query = next.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  const tabs: { id: string; label: string }[] = [
    { id: "all", label: "ทั้งหมด" },
    ...KPI_BUCKETS.map((b) => ({ id: b.id as string, label: b.label as string })),
  ];

  const hasExtraFilter = Boolean(province || documents || sort === "newest");
  // ส่งออกใช้ตัวกรองชุดเดียวกับที่แสดงอยู่ ยกเว้นเลขหน้า — ไฟล์ CSV ไม่มีหน้า
  const exportHref = `/admin/export${hrefWith({ page: undefined }).slice("/admin".length)}`;

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-caption text-ink-48">สวัสดี {staff.name || staff.email}</p>
          <h1 className="mt-1.5 text-h3 font-bold leading-[1.28] sm:text-h2">คิวใบสมัคร</h1>
          <p className="mt-2 text-body text-ink-80">
            จัดการและตรวจสอบใบสมัครพาร์ทเนอร์ทั้งหมด
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <ExportMenu filteredHref={exportHref} />
          <DateRangeFilter active={range} hrefFor={(id) => hrefWith({ range: id === "all" ? undefined : id, page: undefined })} />

          {/* แดงทึบใบเดียวบนหน้า และเป็นงานจริงของคิวนี้ ไม่ใช่ปุ่ม "สร้างใบสมัคร" แบบต้นแบบ
              เจ้าหน้าที่ไม่ได้เป็นคนสร้างใบสมัคร ร้านเป็นคนส่งเข้ามาเอง สิ่งที่คนเปิดหน้านี้
              อยากทำจริง ๆ คือเปิดใบที่รอนานที่สุดขึ้นมาตรวจ */}
          {oldestPending ? (
            <Link
              href={`/admin/${oldestPending}`}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-btn bg-brand px-5 text-caption font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-hover"
            >
              <ClipboardList aria-hidden className="size-4 shrink-0" />
              ตรวจใบถัดไป
            </Link>
          ) : (
            <span className="inline-flex min-h-[48px] items-center gap-2 rounded-btn bg-pearl px-5 text-caption font-medium text-ink-48 ring-1 ring-inset ring-hairline">
              <CircleCheck aria-hidden className="size-4 shrink-0" />
              ไม่มีใบรอตรวจ
            </span>
          )}
        </div>
      </div>

      <section aria-label="ตัวเลขสรุป" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <QueueTotalCard total={summary.total} trend={summary.totalTrend} icon={ClipboardList} />

        {summary.buckets.map((bucket) => {
          const style = BUCKET_STYLE[bucket.id];
          return (
            <QueueBucketCard
              key={bucket.id}
              label={bucket.label}
              count={bucket.count}
              trend={bucket.trend}
              polarity={style.polarity}
              icon={style.icon}
              chipClass={style.chip}
              active={tab === bucket.id}
              href={hrefWith({ tab: tab === bucket.id ? undefined : bucket.id, page: undefined })}
            />
          );
        })}
      </section>

      <section className="mt-4 rounded-card bg-canvas shadow-soft ring-1 ring-hairline/70">
        {/* ช่องค้นหากับสองตัวเลือกอยู่ในฟอร์มเดียว กด "ตัวกรอง" หรือ Enter ก็ยื่นได้เหมือนกัน
            ตัวกรองที่ตั้งไว้จากลิงก์อื่น (แท็บ ช่วงเวลา) เดินทางมากับ hidden input
            ไม่งั้นการกดค้นหาจะล้างตัวกรองที่เพิ่งตั้งไปทิ้ง */}
        <form method="get" action="/admin" className="flex flex-col gap-3 p-6 lg:flex-row lg:items-center">
          {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
          {range !== "all" ? <input type="hidden" name="range" value={range} /> : null}
          {pageSize !== 20 ? <input type="hidden" name="size" value={pageSize} /> : null}

          <div className="relative min-w-0 flex-1">
            <label htmlFor="q" className="sr-only">
              ค้นหาใบสมัคร
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-48"
            />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              placeholder="ค้นหาชื่อร้าน เบอร์โทร อีเมล หรือเลขที่ใบสมัคร"
              className="min-h-[48px] w-full rounded-input bg-canvas pl-12 pr-4 text-caption text-ink ring-1 ring-hairline ring-inset placeholder:text-ink-48 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <label htmlFor="province" className="sr-only">
            จังหวัด
          </label>
          <select
            id="province"
            name="province"
            defaultValue={province ?? ""}
            className="min-h-[48px] rounded-input bg-canvas px-4 text-caption text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink lg:w-48"
          >
            <option value="">ทุกจังหวัด</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label htmlFor="type" className="sr-only">
            ประเภทร้าน
          </label>
          <select
            id="type"
            name="type"
            defaultValue={shopType ?? ""}
            className="min-h-[48px] rounded-input bg-canvas px-4 text-caption text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink lg:w-52"
          >
            <option value="">ทุกประเภทร้าน</option>
            {SHOP_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-input bg-canvas px-5 text-caption font-medium text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            ตัวกรอง
          </button>
        </form>

        {/* ตัวกรองที่ใช้นาน ๆ ครั้งพับเก็บไว้ ทุกปุ่มที่มองเห็นกินความสนใจทุกวัน */}
        <details open={hasExtraFilter} className="group border-t border-divider-soft px-6 py-3">
          <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center gap-2 text-caption text-ink-48 transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            ตัวกรองเพิ่มเติม
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="flex flex-wrap items-center gap-2 pb-2 pt-3">
            {[
              { value: undefined, label: "เอกสารทั้งหมด" },
              { value: "complete", label: "เอกสารครบ" },
              { value: "incomplete", label: "เอกสารไม่ครบ" },
            ].map((option) => (
              <Link
                key={option.label}
                href={hrefWith({ documents: option.value, page: undefined })}
                aria-current={documents === option.value ? "true" : undefined}
                className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-fine transition-colors ${
                  documents === option.value
                    ? "bg-nav font-semibold text-white"
                    : "text-ink-80 ring-1 ring-inset ring-hairline hover:bg-pearl"
                }`}
              >
                {option.label}
              </Link>
            ))}

            <span aria-hidden className="mx-1 h-5 w-px bg-hairline" />

            {[
              { value: undefined, label: "รอนานที่สุดก่อน" },
              { value: "newest", label: "เข้ามาล่าสุดก่อน" },
            ].map((option) => (
              <Link
                key={option.label}
                href={hrefWith({ sort: option.value, page: undefined })}
                aria-current={(option.value ?? "oldest") === sort ? "true" : undefined}
                className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-fine transition-colors ${
                  (option.value ?? "oldest") === sort
                    ? "bg-nav font-semibold text-white"
                    : "text-ink-80 ring-1 ring-inset ring-hairline hover:bg-pearl"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </details>

        {/* แท็บเป็นขีดใต้ ไม่ใช่เม็ดยา — สี่กองนี้ซ้ำกับการ์ดด้านบนซึ่งเป็นเม็ดใหญ่อยู่แล้ว
            ถ้าทำเป็นเม็ดยาอีกชุดจะกลายเป็นสองแถวที่ดังพอ ๆ กันโดยที่ตอบคำถามเดียวกัน */}
        <nav
          aria-label="กรองตามสถานะ"
          className="flex gap-1 overflow-x-auto border-t border-divider-soft px-6"
        >
          {tabs.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={hrefWith({ tab: item.id === "all" ? undefined : item.id, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-[52px] shrink-0 items-center px-3 text-caption font-medium transition-colors ${
                  active ? "text-brand-ink" : "text-ink-48 hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-brand transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <QueueTable rows={listed.items.map(toRow)} />

        <QueuePagination
          page={listed.page}
          pageSize={pageSize}
          total={listed.total}
          pageHref={(n) => hrefWith({ page: n === 1 ? undefined : n })}
          pageSizeHref={(size) => hrefWith({ size, page: undefined })}
        />
      </section>
    </main>
  );
}

type ListedApplication = Awaited<ReturnType<typeof listAllApplications>>["items"][number];

function toRow(application: ListedApplication): QueueRow {
  return {
    applicationId: application.applicationId ?? "",
    shopName: application.data?.shop?.name || "ไม่ได้ระบุชื่อร้าน",
    shopType: application.data?.shop?.type || "",
    contactName: application.data?.contact?.fullName || "—",
    phone: application.data?.contact?.phone || "",
    province: application.data?.shop?.address?.province || "",
    status: application.status as ApplicationStatus,
    submittedAt: application.submittedAt ?? null,
    documents: application.documents ?? [],
  };
}
