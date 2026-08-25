import Link from "next/link";
import { CalendarDays, ChevronDown, Download } from "lucide-react";

/**
 * ตัวควบคุมสองตัวบนหัวหน้าคิว — เมนูส่งออก และตัวเลือกช่วงวันที่
 *
 * ทั้งคู่เป็น <details> + ลิงก์ ไม่มี state ฝั่งเบราว์เซอร์ แบบเดียวกับตัวเลือกช่วงเวลา
 * บนแดชบอร์ดและตัวเลือกจำนวนแถวท้ายตาราง หลังบ้านทั้งหมดเรนเดอร์ฝั่งเซิร์ฟเวอร์
 */

/** ช่วงวันที่ยื่นใบสมัครที่เลือกได้ — ค่าอื่นถูกปัดเป็น "ทั้งหมด" */
export const QUEUE_RANGES = [
  { id: "all", label: "ทุกช่วงเวลา", days: null },
  { id: "7", label: "7 วันล่าสุด", days: 7 },
  { id: "30", label: "30 วันล่าสุด", days: 30 },
  { id: "90", label: "90 วันล่าสุด", days: 90 },
] as const;

export type QueueRangeId = (typeof QUEUE_RANGES)[number]["id"];

export function parseQueueRange(value: string | undefined): QueueRangeId {
  const found = QUEUE_RANGES.find((r) => r.id === value);
  return found ? found.id : "all";
}

export function queueRangeDays(id: QueueRangeId): number | null {
  return QUEUE_RANGES.find((r) => r.id === id)?.days ?? null;
}

const chipClass =
  "inline-flex min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-input bg-canvas px-4 text-caption font-medium text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl [&::-webkit-details-marker]:hidden";

const panelClass =
  "nav-panel-in absolute right-0 top-[calc(100%+8px)] z-30 w-60 overflow-hidden rounded-card bg-canvas p-2 shadow-lift ring-1 ring-hairline";

function itemClass(active: boolean): string {
  return `flex min-h-[44px] items-center rounded-input px-3 text-caption transition-colors ${
    active ? "bg-pearl font-semibold text-ink" : "text-ink-80 hover:bg-pearl hover:text-ink"
  }`;
}

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

/**
 * ส่งออก CSV — สองทางเลือกเพราะสองคำถามต่างกันจริง
 * "ตามตัวกรอง" คือเอาสิ่งที่เห็นตรงหน้าไปทำงานต่อ ส่วน "ทั้งหมด" คือสำรองข้อมูลทั้งชุด
 * ถ้ามีปุ่มเดียวจะต้องเดาว่าผู้ใช้หมายถึงอันไหน แล้วเดาผิดครึ่งหนึ่งของเวลา
 */
export function ExportMenu({ filteredHref }: { filteredHref: string }) {
  return (
    <details className="group relative">
      <summary className={chipClass}>
        <Download aria-hidden className="size-4 shrink-0 text-ink-48" />
        ส่งออกข้อมูล
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-48 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className={panelClass}>
        <a href={filteredHref} download className={itemClass(false)}>
          ตามตัวกรองที่เลือกอยู่
        </a>
        <a href="/admin/export" download className={itemClass(false)}>
          ใบสมัครทั้งหมด
        </a>
      </div>
    </details>
  );
}

/**
 * ตัวเลือกช่วงวันที่ยื่นใบสมัคร
 *
 * เป็นชุดช่วงสำเร็จรูป ไม่ใช่ปฏิทินให้เลือกวันเอง — ปฏิทินสองช่องต้องใช้ JS ฝั่งเบราว์เซอร์
 * และคำถามจริงของเจ้าหน้าที่คือ "เดือนนี้เข้ามากี่ใบ" ไม่ใช่ "ระหว่างวันที่ 12 ถึง 19"
 * ป้ายบนชิปกางวันที่จริงออกมาให้เห็น เพื่อไม่ต้องเดาว่า "30 วันล่าสุด" นับจากวันไหน
 */
export function DateRangeFilter({
  active,
  hrefFor,
}: {
  active: QueueRangeId;
  hrefFor: (id: QueueRangeId) => string;
}) {
  const days = queueRangeDays(active);
  const label =
    days === null
      ? "ทุกช่วงเวลา"
      : `${thaiDate.format(new Date(Date.now() - days * 86_400_000))} - ${thaiDate.format(new Date())}`;

  return (
    <details className="group relative">
      <summary className={chipClass}>
        <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-48" />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-48 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className={panelClass}>
        {QUEUE_RANGES.map((range) => (
          <Link
            key={range.id}
            href={hrefFor(range.id)}
            aria-current={range.id === active ? "true" : undefined}
            className={itemClass(range.id === active)}
          >
            {range.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
