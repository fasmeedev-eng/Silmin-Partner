import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { Trend } from "@/lib/db/dashboard";

/**
 * บรรทัดแนวโน้มใต้การ์ดตัวเลข — ใช้ร่วมกันระหว่างแดชบอร์ดกับหัวคิวใบสมัคร
 *
 * อยู่ไฟล์เดียวเพราะกฎการเลือกคำ ("เพิ่มขึ้น 3 ใบ" เมื่อไม่มีฐานให้หาร) เป็นกฎที่คิดมาแล้ว
 * สองสำเนาจะพูดไม่ตรงกันภายในไม่กี่เดือน ส่วนช่วงเวลาที่เทียบต่างกัน (สัปดาห์/เดือน)
 * จึงรับมาเป็น prop แทนที่จะฝังไว้ในข้อความ
 */

/** ทิศทางที่ "ดี" ของตัวเลขนี้ — ใบสมัครเข้ามาเยอะคือดี ใบที่ไม่ผ่านเยอะคือไม่ดี */
export type TrendPolarity = "more-is-good" | "less-is-good" | "neutral";

export function trendWording(trend: Trend): string {
  if (trend.direction === "flat") {
    return trend.current === 0 ? "ยังไม่มีความเคลื่อนไหว" : "เท่าเดิม";
  }
  const verb = trend.direction === "up" ? "เพิ่มขึ้น" : "ลดลง";
  // ไม่มีฐานให้หารก็พูดเป็นจำนวนใบ — "เพิ่มขึ้น 100%" จากศูนย์ใบไม่ได้แปลว่าอะไร
  if (trend.percent === null) return `${verb} ${Math.abs(trend.current - trend.previous)} ใบ`;
  return `${verb} ${Math.abs(trend.percent)}%`;
}

/**
 * สีบอก "ดีหรือแย่" ไม่ใช่ "ขึ้นหรือลง" — ใบที่ไม่ผ่านเพิ่มขึ้นคือข่าวร้าย
 * แม้ลูกศรจะชี้ขึ้นเหมือนกับใบสมัครที่เพิ่มขึ้น
 *
 * ระบบนี้ไม่มีสีเขียว (พาเลตต์มีสี่สี) ข่าวดีจึงใช้สีหมึกปกติ ไม่ใช่สีเน้น
 * และเก็บสีไว้ใช้เฉพาะตอนที่ต้องเตือนจริง ๆ กฎเดียวกับธงใบค้างนานในตารางคิว
 */
function trendTone(trend: Trend, polarity: TrendPolarity): string {
  if (trend.direction === "flat" || polarity === "neutral") return "text-ink-48";
  const good = polarity === "more-is-good" ? trend.direction === "up" : trend.direction === "down";
  return good ? "text-ink-80" : "text-gold-ink";
}

export function TrendLine({
  trend,
  polarity,
  sinceLabel,
  onDark = false,
}: {
  trend: Trend;
  polarity: TrendPolarity;
  /** เช่น "จากสัปดาห์ก่อน" หรือ "จากเดือนก่อน" */
  sinceLabel: string;
  onDark?: boolean;
}) {
  const Icon: LucideIcon =
    trend.direction === "flat" ? Minus : trend.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <p className={`flex items-center gap-2 text-fine ${onDark ? "text-white/55" : "text-ink-48"}`}>
      <Icon
        aria-hidden
        className={`size-4 shrink-0 ${onDark ? "text-white/70" : trendTone(trend, polarity)}`}
        strokeWidth={2.2}
      />
      <span>
        <span className={`font-semibold ${onDark ? "text-white/85" : trendTone(trend, polarity)}`}>
          {trendWording(trend)}
        </span>{" "}
        {sinceLabel}
      </span>
    </p>
  );
}
