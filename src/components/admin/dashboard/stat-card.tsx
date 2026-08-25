import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/db/dashboard";
import { TrendLine, type TrendPolarity } from "@/components/admin/trend-line";
import { RingGauge } from "./ring-gauge";

/**
 * การ์ดตัวเลขบนสุดของแดชบอร์ด
 *
 * ใบแรกเป็นพื้นดำ ที่เหลือเป็นการ์ดขาว — ดำคือ "ตัวเลขที่สรุปทั้งหน้า" ส่วนขาวคือส่วนย่อยของมัน
 * ใช้ดำแทนแดงเพราะการ์ดห้าใบเรียงกันเป็นแถบกว้าง ถ้าใบเด่นเป็นแดงทึบมันจะแย่งความสนใจ
 * ไปจากปุ่มดำเนินการซึ่งเป็นแดงเหมือนกัน กฎเดียวกับหน้าคิวงาน
 *
 * ต่างจากการ์ดบนหัวคิวใบสมัคร (queue-stat-card) ตรงที่ใบนี้มีวงแหวนสัดส่วน ส่วนใบนั้น
 * มีชิปไอคอน — แดชบอร์ดตอบว่า "แต่ละกองคิดเป็นกี่เปอร์เซ็นต์ของทั้งหมด" ซึ่งเป็นคำถาม
 * ของหน้าภาพรวม ส่วนหน้าคิวตอบแค่ "แต่ละกองมีกี่ใบ" เพราะสัดส่วนไม่ช่วยให้หยิบงานได้เร็วขึ้น
 */

/** ใบเด่นพื้นดำ — ตัวเลขรวมของทั้งระบบ */
export function TotalStatCard({
  total,
  trend,
  caption,
  icon: Icon,
}: {
  total: number;
  trend: Trend;
  caption: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col rounded-card bg-nav p-6 text-white shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium text-white/70">ใบสมัครทั้งหมด</p>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-input bg-white/[0.1] text-white"
        >
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
      </div>

      <p className="mt-4 text-[2.5rem] font-bold leading-[1.1] tabular-nums">{total}</p>
      <p className="mt-1 text-fine text-white/55">{caption}</p>

      <div className="mt-auto border-t border-white/[0.12] pt-4">
        <TrendLine trend={trend} polarity="neutral" sinceLabel="จากสัปดาห์ก่อน" onDark />
      </div>
    </div>
  );
}

/** การ์ดขาวหนึ่งกอง — กดแล้วตารางด้านล่างกรองเป็นกองนี้ */
export function BucketStatCard({
  label,
  count,
  share,
  trend,
  polarity,
  ringColor,
  href,
}: {
  label: string;
  count: number;
  share: number;
  trend: Trend;
  polarity: TrendPolarity;
  ringColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0"
    >
      <p className="text-caption font-medium text-ink-80">{label}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[2.25rem] font-bold leading-[1.1] tabular-nums text-ink">
          {count}
          <span className="ml-1.5 align-baseline text-body font-medium text-ink-48">ใบ</span>
        </p>
        <RingGauge share={share} color={ringColor} label={`${label} คิดเป็น`} />
      </div>

      <div className="mt-auto border-t border-divider-soft pt-4">
        <TrendLine trend={trend} polarity={polarity} sinceLabel="จากสัปดาห์ก่อน" />
      </div>
    </Link>
  );
}
