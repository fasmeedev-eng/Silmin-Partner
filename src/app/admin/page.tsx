import Link from "next/link";
import {
  AlertCircle,
  CircleCheck,
  ChevronRight,
  Inbox,
  LayoutGrid,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { guardRole } from "@/lib/auth/guard";
import {
  ADMIN_PAGE_SIZE,
  countByStatus,
  listAllApplications,
  listUsedProvinces,
  type ApplicationStatus,
} from "@/lib/db/applications";
import {
  STATUS_META,
  WORK_BUCKETS,
  bucketById,
  statusChipClass,
  type WorkBucketId,
} from "@/lib/application/status";
import { documentsComplete, missingCategories } from "@/lib/application/categories";

// WORK_BUCKETS เป็นข้อมูลล้วน ใช้ทั้งฝั่งเซิร์ฟเวอร์ (กรองคิวรี) จึงไม่ใส่ไอคอนไว้ในนั้น
// แมปแยกไว้ที่นี่ ที่เดียวที่ต้องเรนเดอร์จริง
const BUCKET_ICONS: Record<WorkBucketId | "all", LucideIcon> = {
  todo: Inbox,
  doing: RefreshCw,
  done: CircleCheck,
  all: LayoutGrid,
};

export const metadata = { title: "ใบสมัคร" };

const thaiDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" });

function daysSince(date: Date | undefined): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

/** คำบอกอายุที่อ่านแล้วเข้าใจทันที ไม่ต้องคำนวณจากวันที่เอง */
function waitingLabel(days: number): string {
  if (days <= 0) return "เข้ามาวันนี้";
  if (days === 1) return "รอมา 1 วัน";
  return `รอมา ${days} วัน`;
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const result = await guardRole(["admin", "employee"]);
  if (!result.allowed) return null;
  const { staff } = result;

  const params = await searchParams;
  const showAll = params.bucket === "all";
  const bucket = bucketById(params.bucket) ?? WORK_BUCKETS[0];

  const documentsParam = params.documents;
  const documentsFilter: "complete" | "incomplete" | undefined =
    documentsParam === "complete" || documentsParam === "incomplete" ? documentsParam : undefined;

  const filters = {
    statuses: showAll ? undefined : [...bucket.statuses],
    province: params.province || undefined,
    documents: documentsFilter,
    q: params.q || undefined,
    sort: params.sort === "newest" ? ("newest" as const) : ("oldest" as const),
    page: Number(params.page) > 0 ? Number(params.page) : 1,
  };

  const [{ items, total, page }, counts, provinces] = await Promise.all([
    listAllApplications(filters),
    countByStatus(),
    listUsedProvinces(),
  ]);

  const bucketCount = (statuses: readonly ApplicationStatus[]) =>
    statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const allCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const todoCount = bucketCount(WORK_BUCKETS[0].statuses);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hasExtraFilter = Boolean(filters.province || filters.documents || params.sort === "newest");

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") next.set(k, v);
    next.set("page", String(n));
    return `/admin?${next}`;
  };

  const cardClass = (active: boolean) =>
    `rounded-lg p-5 transition-colors ${active ? "bg-accent text-on-accent" : "bg-canvas ring-1 ring-hairline ring-inset hover:bg-pearl"
    }`;

  return (
    <main className="mx-auto w-full  px-6 py-10 sm:px-8">
      {/* พาดหัวตอบคำถามเดียวที่เจ้าหน้าที่ถามตอนเปิดคอม ไม่ใช่ชื่อหน้าจอ */}
      <p className="text-caption text-ink-48">สวัสดี {staff.name || staff.email}</p>
      <h1 className="mt-2 text-h3 sm:text-h2">
        {todoCount > 0 ? `มี ${todoCount} ใบรอคุณตรวจ` : "ไม่มีใบใหม่รอตรวจ"}
      </h1>
      <p className="mt-3 max-w-[52ch] text-body text-ink-80">
        {todoCount > 0
          ? "เลือกใบที่ต้องการ กดเข้าไปดูรายละเอียด แล้วเลือกว่าจะดำเนินการอย่างไร"
          : "ใบสมัครใหม่จะขึ้นที่นี่เองโดยอัตโนมัติ ตอนนี้ยังไม่มีใบไหนรออยู่"}
      </p>

      {/* สามกองงานแทนเจ็ดสถานะ — ตอบได้ทันทีว่ากองไหนคืองานของวันนี้
          ไอคอนต่อกองช่วยให้จับกองที่ต้องการได้จากรูปทรง ไม่ต้องอ่านทุกคำ */}
      <nav aria-label="เลือกกลุ่มงาน" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WORK_BUCKETS.map((item) => {
          const active = !showAll && item.id === bucket.id;
          const Icon = BUCKET_ICONS[item.id];
          return (
            <Link
              key={item.id}
              href={`/admin?bucket=${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cardClass(active)}
            >
              <div className="flex items-center justify-between">
                <p className="text-h3 tabular-nums">{bucketCount(item.statuses)}</p>
                <span
                  aria-hidden
                  className={`flex size-9 shrink-0 items-center justify-center rounded-md ${active ? "bg-on-accent/15 text-on-accent" : "bg-pearl text-accent-ink"}`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-1 text-body font-semibold">{item.label}</p>
              <p className={`mt-1 text-fine ${active ? "text-on-accent/70" : "text-ink-48"}`}>
                {item.hint}
              </p>
            </Link>
          );
        })}

        <Link
          href="/admin?bucket=all"
          aria-current={showAll ? "page" : undefined}
          className={cardClass(showAll)}
        >
          <div className="flex items-center justify-between">
            <p className="text-h3 tabular-nums">{allCount}</p>
            <span
              aria-hidden
              className={`flex size-9 shrink-0 items-center justify-center rounded-md ${showAll ? "bg-on-accent/15 text-on-accent" : "bg-pearl text-accent-ink"}`}
            >
              <LayoutGrid className="size-4" />
            </span>
          </div>
          <p className="mt-1 text-body font-semibold">ทั้งหมด</p>
          <p className={`mt-1 text-fine ${showAll ? "text-on-accent/70" : "text-ink-48"}`}>
            ทุกใบที่เคยส่งเข้ามา
          </p>
        </Link>
      </nav>

      {/* ช่องค้นหาช่องเดียว กด Enter ก็ค้นได้ ไม่ต้องมองหาปุ่ม */}
      <form method="get" className="mt-8">
        <input type="hidden" name="bucket" value={params.bucket ?? bucket.id} />
        <label htmlFor="q" className="block text-caption font-semibold text-ink">
          ค้นหาใบสมัคร
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-48"
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="พิมพ์ชื่อร้าน เบอร์โทร หรือเลขที่ใบสมัคร"
            className="min-h-[56px] w-full rounded-md bg-canvas pl-14 pr-4 text-body text-ink ring-1 ring-hairline ring-inset placeholder:text-ink-48 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent-ink"
          />
        </div>

        {/* ตัวกรองที่ใช้นาน ๆ ครั้ง พับเก็บไว้ ไม่ให้รกหน้าจอทุกวัน */}
        <details open={hasExtraFilter} className="mt-3">
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-caption text-ink-80 hover:text-ink">
            <SlidersHorizontal aria-hidden className="size-4" />
            ตัวกรองเพิ่มเติม
          </summary>

          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-parchment p-4 ring-1 ring-hairline ring-inset">
            <div>
              <label htmlFor="province" className="block text-fine text-ink-48">
                จังหวัด
              </label>
              <select
                id="province"
                name="province"
                defaultValue={filters.province ?? ""}
                className="mt-1 min-h-[48px] rounded-md bg-canvas px-4 text-caption text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent-ink"
              >
                <option value="">ทุกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="documents" className="block text-fine text-ink-48">
                เอกสาร
              </label>
              <select
                id="documents"
                name="documents"
                defaultValue={filters.documents ?? ""}
                className="mt-1 min-h-[48px] rounded-md bg-canvas px-4 text-caption text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent-ink"
              >
                <option value="">ทั้งหมด</option>
                <option value="complete">เอกสารครบ</option>
                <option value="incomplete">เอกสารไม่ครบ</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="block text-fine text-ink-48">
                เรียงลำดับ
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={filters.sort}
                className="mt-1 min-h-[48px] rounded-md bg-canvas px-4 text-caption text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent-ink"
              >
                <option value="oldest">รอนานที่สุดก่อน</option>
                <option value="newest">เข้ามาล่าสุดก่อน</option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-[48px] rounded-full bg-ink px-6 text-caption text-on-dark transition-opacity hover:opacity-90"
            >
              ใช้ตัวกรอง
            </button>

            {hasExtraFilter || filters.q ? (
              <Link
                href={`/admin?bucket=${params.bucket ?? bucket.id}`}
                className="inline-flex min-h-[48px] items-center px-3 text-caption text-ink-48 underline underline-offset-4 hover:text-ink"
              >
                ล้างทั้งหมด
              </Link>
            ) : null}
          </div>
        </details>
      </form>

      <p className="mt-8 text-caption text-ink-48">
        {filters.q ? `ผลการค้นหา "${filters.q}" — ` : ""}
        พบ {total} ใบ
        {totalPages > 1 ? ` · หน้า ${page} จาก ${totalPages}` : ""}
      </p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-pearl p-10 text-center text-body text-ink-80 ring-1 ring-hairline ring-inset">
          ไม่พบใบสมัครในกลุ่มนี้
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((application) => {
            const documents = application.documents ?? [];
            const complete = documentsComplete(documents);
            const missing = missingCategories(documents);
            const days = daysSince(application.submittedAt);
            const urgent = application.status === "New" && days >= 3;

            return (
              <li key={application.applicationId}>
                <Link
                  href={`/admin/${application.applicationId}`}
                  className="flex items-center gap-4 rounded-lg bg-canvas p-5 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {/* ชื่อร้านมาก่อนเลขที่ใบสมัคร — คนจำชื่อร้านได้ ไม่มีใครจำเลข */}
                      <h2 className="text-body font-semibold">
                        {application.data?.shop?.name || "ไม่ได้ระบุชื่อร้าน"}
                      </h2>
                      <span
                        className={`inline-flex min-h-[26px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass(application.status)}`}
                      >
                        {STATUS_META[application.status].label}
                      </span>
                    </div>

                    <p className="mt-1 text-caption text-ink-80">
                      {application.data?.contact?.fullName || "—"}
                      {application.data?.shop?.address?.province
                        ? ` · ${application.data.shop.address.province}`
                        : ""}
                      {application.data?.contact?.phone
                        ? ` · ${application.data.contact.phone}`
                        : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-fine">
                      <span className={urgent ? "font-semibold text-accent-ink" : "text-ink-48"}>
                        {urgent ? (
                          <AlertCircle aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
                        ) : null}
                        {waitingLabel(days)}
                      </span>
                      <span className="text-ink-48">
                        ส่งเมื่อ{" "}
                        {application.submittedAt ? thaiDate.format(application.submittedAt) : "—"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${complete ? "text-ink-48" : "text-accent-ink"}`}
                      >
                        {complete ? (
                          <CircleCheck aria-hidden className="size-3.5" />
                        ) : (
                          <TriangleAlert aria-hidden className="size-3.5" />
                        )}
                        {complete ? "เอกสารครบ" : `ขาด${missing.map((c) => c.label).join(" และ ")}`}
                      </span>
                      <span className="tabular-nums text-ink-48">{application.applicationId}</span>
                    </div>
                  </div>

                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-48" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="แบ่งหน้า" className="mt-8 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="inline-flex min-h-[52px] items-center rounded-full bg-pearl px-6 text-caption text-ink ring-1 ring-hairline ring-inset hover:bg-parchment"
            >
              ← หน้าก่อนหน้า
            </Link>
          ) : (
            <span />
          )}
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="inline-flex min-h-[52px] items-center rounded-full bg-pearl px-6 text-caption text-ink ring-1 ring-hairline ring-inset hover:bg-parchment"
            >
              หน้าถัดไป →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
