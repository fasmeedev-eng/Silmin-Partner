import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@/lib/db/applications";

/**
 * แถบท้ายตาราง — บอกว่ากำลังดูช่วงไหน เลือกจำนวนแถวต่อหน้า และข้ามหน้า
 *
 * ตัวเลือกจำนวนแถวเป็น <details> + ลิงก์ ไม่ใช่ <select> ด้วยเหตุผลเดียวกับตัวเลือกช่วงเวลา
 * บนแดชบอร์ด: select ที่ไม่มี JS ต้องมีปุ่มยืนยันต่อท้ายเสมอ ซึ่งเพิ่มการกดหนึ่งครั้ง
 */

/**
 * เลขหน้าที่จะแสดง — หน้าแรก หน้าสุดท้าย และเพื่อนบ้านของหน้าปัจจุบัน ที่เหลือยุบเป็น "…"
 * ถ้าโชว์ครบทุกหน้า พอมี 40 หน้าแถบนี้จะยาวกว่าตารางเอง
 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);
  // หน้าแรก ๆ กับหน้าท้าย ๆ ขยายหน้าต่างออกไปอีกหนึ่ง ไม่งั้นจะได้ "1 2 … 13" ซึ่งดูกระโดด
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) out.push("gap");
    out.push(page);
    previous = page;
  }
  return out;
}

const stepClass =
  "inline-flex size-10 items-center justify-center rounded-input text-ink-48 ring-1 ring-inset ring-hairline transition-colors hover:bg-pearl hover:text-ink";

export function QueuePagination({
  page,
  pageSize,
  total,
  pageHref,
  pageSizeHref,
}: {
  page: number;
  pageSize: PageSize;
  total: number;
  pageHref: (page: number) => string;
  pageSizeHref: (size: PageSize) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 border-t border-divider-soft px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-caption text-ink-48">
        แสดง <span className="font-medium tabular-nums text-ink-80">{first}</span> ถึง{" "}
        <span className="font-medium tabular-nums text-ink-80">{last}</span> จาก{" "}
        <span className="font-medium tabular-nums text-ink-80">{total}</span> รายการ
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <details className="group relative">
          <summary className="inline-flex min-h-[40px] cursor-pointer list-none items-center gap-2 rounded-input bg-canvas px-3.5 text-caption text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl [&::-webkit-details-marker]:hidden">
            <span className="font-semibold tabular-nums">{pageSize}</span> รายการต่อหน้า
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 text-ink-48 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="nav-panel-in absolute bottom-[calc(100%+8px)] right-0 z-30 w-48 overflow-hidden rounded-card bg-canvas p-2 shadow-lift ring-1 ring-hairline">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                href={pageSizeHref(size)}
                aria-current={size === pageSize ? "true" : undefined}
                className={`flex min-h-[40px] items-center rounded-input px-3 text-caption transition-colors ${
                  size === pageSize
                    ? "bg-pearl font-semibold text-ink"
                    : "text-ink-80 hover:bg-pearl hover:text-ink"
                }`}
              >
                {size} รายการต่อหน้า
              </Link>
            ))}
          </div>
        </details>

        <nav aria-label="แบ่งหน้า" className="flex items-center gap-1.5">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} aria-label="หน้าก่อนหน้า" className={stepClass}>
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={`${stepClass} pointer-events-none opacity-40`}>
              <ChevronLeft className="size-4" />
            </span>
          )}

          {pageWindow(page, totalPages).map((entry, index) =>
            entry === "gap" ? (
              <span
                key={`gap-${index}`}
                aria-hidden
                className="inline-flex size-10 items-center justify-center text-caption text-ink-48"
              >
                …
              </span>
            ) : (
              <Link
                key={entry}
                href={pageHref(entry)}
                aria-current={entry === page ? "page" : undefined}
                // หน้าปัจจุบันเป็นขอบแดงพื้นขาว ไม่ใช่แดงทึบ — แดงทึบในหน้านี้เป็นของปุ่มดำเนินการ
                // เลขหน้าไม่ใช่การกระทำ มันแค่บอกว่าอยู่ตรงไหน
                className={`inline-flex size-10 items-center justify-center rounded-input text-caption tabular-nums transition-colors ${
                  entry === page
                    ? "font-semibold text-brand-ink ring-1 ring-inset ring-brand/45"
                    : "text-ink-80 hover:bg-pearl hover:text-ink"
                }`}
              >
                {entry}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link href={pageHref(page + 1)} aria-label="หน้าถัดไป" className={stepClass}>
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={`${stepClass} pointer-events-none opacity-40`}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}
