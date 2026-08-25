import { CircleCheck, FileText, Handshake, Search, Store, type LucideIcon } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/applications";
import {
  STATUS_META,
  STATUS_TRACK,
  isDangerStatus,
  statusChipClass,
  trackIndex,
} from "@/lib/application/status";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** ไอคอนต่อขั้น ใช้แค่ช่วยแยกแถวด้วยรูปทรง ไม่ได้เข้ารหัสความหมายอะไรเพิ่ม */
const STEP_ICONS: LucideIcon[] = [FileText, Search, CircleCheck, Handshake, Store];

/**
 * รายการขั้นตอนแบบละเอียด — เวอร์ชันขยายของ ProgressTracker ด้วยข้อมูลชุดเดียวกันเป๊ะ
 * (STATUS_TRACK + STATUS_META) ไม่ใช่กระบวนการย่อยอีกชุดที่ระบบไม่มีจริง
 *
 * ดีไซน์อ้างอิงมีห้าขั้นย่อยที่ละเอียดกว่านี้ (ตรวจสอบความน่าเชื่อถือ, พิจารณาอนุมัติ,
 * สร้างบัญชีพาร์ทเนอร์ ฯลฯ) แต่ระบบนี้ไม่มีสถานะย่อยระดับนั้นในฐานข้อมูล — มีแค่ 7 สถานะหลัก
 * การใส่ห้าขั้นย่อยแบบดีไซน์อ้างอิงจะเป็นการยกข้อมูลที่ไม่มีจริงมาใส่ จึงใช้ STATUS_TRACK เดิม
 * (ชุดเดียวกับ /me/[id] และ ProgressTracker) พร้อมคำอธิบายจาก STATUS_META.detail ซึ่งเป็น
 * คำอธิบายที่คัดไว้แล้วที่เดียวในระบบ ไม่ต้องเขียนข้อความใหม่ซ้ำอีกชุด
 */
export function StepsChecklist({
  status,
  anchorAt,
}: {
  status: ApplicationStatus;
  anchorAt: Date | undefined;
}) {
  const current = trackIndex(status);

  return (
    <section className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
      <h2 className="text-body font-semibold text-ink">ขั้นตอนการสมัคร</h2>

      <ol className="mt-4 space-y-3">
        {STATUS_TRACK.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? FileText;
          const done = index < current;
          const isCurrent = index === current;
          const meta = STATUS_META[step.status];

          // แถวปัจจุบันโชว์สถานะจริง (อาจเป็น NeedMoreInfo/Rejected ที่แยกออกจากเส้นหลัก)
          // ไม่ใช่แค่ชื่อขั้นทั่วไป เพื่อให้ตรงกับชิปสถานะที่หัวหน้าและตารางคิวงานเห็น
          const chipLabel = isCurrent ? STATUS_META[status].label : done ? "เสร็จแล้ว" : "รอดำเนินการ";
          const chipClass = isCurrent
            ? statusChipClass(status)
            : done
              ? "bg-nav text-white"
              : "bg-pearl text-ink-48 ring-1 ring-hairline ring-inset";

          return (
            <li
              key={step.status}
              className={`rounded-input p-4 ring-1 ring-inset transition-colors ${
                isCurrent
                  ? isDangerStatus(status)
                    ? "bg-danger/[0.05] ring-danger/25"
                    : meta.needsAction
                      ? "bg-gold-soft ring-gold/50"
                      : "bg-pearl ring-ink/15"
                  : "ring-hairline/70"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden
                  className={`flex size-9 shrink-0 items-center justify-center rounded-input ${
                    isCurrent ? "bg-ink text-canvas" : done ? "bg-ink/[0.06] text-ink-80" : "bg-pearl text-ink-48"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-caption font-semibold text-ink">
                      <span className="tabular-nums text-ink-48">{index + 1}.</span>
                      {step.label}
                    </p>
                    <span
                      className={`inline-flex min-h-[24px] items-center rounded-full px-3 text-fine font-semibold ${chipClass}`}
                    >
                      {chipLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-fine leading-[1.6] text-ink-48">{meta.detail}</p>
                  {isCurrent && anchorAt ? (
                    <p className="mt-1.5 text-fine tabular-nums text-ink-48">
                      {thaiDate.format(anchorAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
