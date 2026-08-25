import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/db/dashboard";
import { TrendLine, type TrendPolarity } from "@/components/admin/trend-line";

/** ช่วงเวลาที่ loadQueueSummary เทียบให้ — เขียนไว้ที่เดียว จะได้ไม่หลุดจากกันเมื่อแก้ฝั่งคิวรี */
const SINCE = "จากเดือนก่อน";

/** ใบเด่นพื้นดำ — ยอดรวมของทั้งคิว */
export function QueueTotalCard({
  total,
  trend,
  icon: Icon,
}: {
  total: number;
  trend: Trend;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col rounded-card bg-nav p-6 text-white shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-white/70">ทั้งหมด</p>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-input bg-white/[0.1] text-white"
        >
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
      </div>

      <p className="mt-4 text-[2.5rem] font-bold leading-[1.1] tabular-nums">{total}</p>
      <p className="mt-1 text-fine text-white/55">ใบสมัคร</p>

      <div className="mt-auto border-t border-white/[0.12] pt-4">
        <TrendLine trend={trend} polarity="neutral" sinceLabel={SINCE} onDark />
      </div>
    </div>
  );
}

/**
 * การ์ดขาวหนึ่งกอง — กดแล้วกรองตารางด้านล่างเป็นกองนั้น
 *
 * ชิปไอคอนมุมขวาบนใช้สีตามความหมายเดียวกับชิปสถานะในตาราง (ทอง = ถึงตาผู้สมัคร,
 * ดำ = จบและผ่าน, แดง danger = ไม่ผ่าน, เทา = กำลังเดินอยู่) การ์ดกับแถวในตาราง
 * อยู่บนหน้าจอเดียวกัน ถ้าสีไม่ตรงกันคนอ่านต้องจำสองระบบ
 */
export function QueueBucketCard({
  label,
  count,
  trend,
  polarity,
  icon: Icon,
  chipClass,
  href,
  active,
}: {
  label: string;
  count: number;
  trend: Trend;
  polarity: TrendPolarity;
  icon: LucideIcon;
  chipClass: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex flex-col rounded-card bg-canvas p-6 shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0 ${
        // กองที่กำลังกรองอยู่ได้ขอบหมึก ไม่ใช่พื้นแดง — การ์ดสี่ใบเรียงกันเป็นพื้นที่กว้าง
        // ใบแดงทึบจะดังกว่าปุ่มดำเนินการที่เป็นแดงเหมือนกัน กฎเดียวกับที่อื่นในหลังบ้าน
        active ? "ring-2 ring-ink" : "ring-1 ring-hairline/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-ink-80">{label}</p>
        <span
          aria-hidden
          className={`flex size-9 shrink-0 items-center justify-center rounded-input ${chipClass}`}
        >
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
      </div>

      <p className="mt-4 text-[2.25rem] font-bold leading-[1.1] tabular-nums text-ink">
        {count}
        <span className="ml-1.5 align-baseline text-body font-medium text-ink-48">ใบ</span>
      </p>

      <div className="mt-auto border-t border-divider-soft pt-4">
        <TrendLine trend={trend} polarity={polarity} sinceLabel={SINCE} />
      </div>
    </Link>
  );
}
