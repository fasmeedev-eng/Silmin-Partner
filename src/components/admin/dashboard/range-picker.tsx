import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { RANGE_DAYS, RANGE_LABELS, type RangeDays } from "@/lib/db/dashboard";

/**
 * ตัวเลือกช่วงเวลาของกราฟ
 *
 * เป็น <details> + ลิงก์สามอัน ไม่ใช่ <select> เพราะ select ที่ไม่มี JS ต้องมีปุ่ม "ตกลง"
 * ต่อท้ายเสมอ ซึ่งเพิ่มการกดหนึ่งครั้งให้กับสิ่งที่ควรกดครั้งเดียว ลิงก์เปลี่ยน searchParam
 * ตรง ๆ จึงทั้งง่ายกว่าและใช้ปุ่มย้อนกลับของเบราว์เซอร์ได้
 */
export function RangePicker({
  active,
  hrefFor,
}: {
  active: RangeDays;
  hrefFor: (range: RangeDays) => string;
}) {
  return (
    <details className="group relative">
      <summary className="inline-flex min-h-[48px] cursor-pointer list-none items-center gap-2 rounded-input bg-canvas px-4 text-caption font-medium text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl [&::-webkit-details-marker]:hidden">
        <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-48" />
        {RANGE_LABELS[active]}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-48 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="nav-panel-in absolute right-0 top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-card bg-canvas p-2 shadow-lift ring-1 ring-hairline">
        {RANGE_DAYS.map((days) => (
          <Link
            key={days}
            href={hrefFor(days)}
            aria-current={days === active ? "true" : undefined}
            className={`flex min-h-[44px] items-center rounded-input px-3 text-caption transition-colors ${
              days === active
                ? "bg-pearl font-semibold text-ink"
                : "text-ink-80 hover:bg-pearl hover:text-ink"
            }`}
          >
            {RANGE_LABELS[days]}
          </Link>
        ))}
      </div>
    </details>
  );
}
