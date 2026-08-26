import { Check, TriangleAlert } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/applications";
import {
  STATUS_TRACK,
  isDangerStatus,
  statusBarClass,
  statusOnBarClass,
  trackIndex,
} from "@/lib/application/status";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * แถบความคืบหน้าห้าขั้นของหน้ารายละเอียดใบสมัคร (ฝั่งเจ้าหน้าที่) — ฝังอยู่ในครึ่งขวาของ
 * ApplicationOverviewCard (พื้นดำเดียวกับข้อมูลติดต่อ) ไม่ใช่การ์ดขาวแยกต่างหากอีกต่อไป
 * จึงไม่มี wrapper ของตัวเองและใช้โทนสีสำหรับพื้นดำทั้งหมด (ดู ApplicationOverviewCard)
 *
 * ใช้ STATUS_TRACK ชุดเดียวกับที่ผู้สมัครเห็นบน /me/[id] — ทั้งสองหน้าต้องนับขั้นตรงกัน
 * เพราะเป็นใบสมัครใบเดียวกัน แต่ **สีของขั้นปัจจุบันไม่เหมือนกัน**: /me ใช้วงกลมแดงแบรนด์เสมอ
 * (กฎของฝั่งผู้สมัคร: แดง = ไฮไลต์/ต้องสนใจ) ส่วนที่นี่ใช้ statusBarClass ตัวเดียวกับที่แถบ
 * ความคืบหน้าในตารางคิวงานใช้ — ทอง = ถึงตาร้าน, ดำ = อนุมัติ/ผ่านแล้ว, แดง = ไม่ผ่าน,
 * เทา = กำลังเดินอยู่ปกติ เพราะหน้านี้อยู่ในหลังบ้านซึ่งรัดเข็มขัดสีแดงไว้ให้เหลือแค่
 * ปุ่มดำเนินการกับข้อผิดพลาดเท่านั้น
 *
 * ขั้นที่ผ่านมาแล้วใช้ขาวทึบ (ไม่ใช่สีสถานะ) เพราะเป็นข้อเท็จจริงที่ไม่เปลี่ยนแล้ว
 * ส่วนสีสถานะสงวนไว้ให้เฉพาะขั้นปัจจุบันซึ่งเป็นจุดที่ต้องสนใจตอนนี้
 */
export function ProgressTracker({
  status,
  anchorAt,
}: {
  status: ApplicationStatus;
  /** วันที่เข้าสู่ขั้นปัจจุบัน — statusChangedAt ถ้าเคยเปลี่ยนสถานะแล้ว ไม่งั้นใช้ submittedAt */
  anchorAt: Date | undefined;
}) {
  const current = trackIndex(status);
  const currentBar = statusBarClass(status);
  const branchedOff = status === "NeedMoreInfo" || status === "Rejected";

  return (
    <div aria-label="ความคืบหน้าการสมัคร">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-caption font-semibold text-on-dark-muted">ความคืบหน้าใบสมัคร</h2>
        <span
          role="img"
          aria-label={`${current + 1} จาก ${STATUS_TRACK.length} ขั้นตอน`}
          className="inline-flex min-h-[26px] items-center rounded-full bg-white/10 px-3 text-fine font-semibold text-white/80"
        >
          {current + 1}/{STATUS_TRACK.length} ขั้นตอน
        </span>
      </div>

      <ol className="mt-6 flex items-start">
        {STATUS_TRACK.map((step, index) => {
          const done = index < current;
          const isCurrent = index === current;
          return (
            <li key={step.status} className="relative flex flex-1 flex-col items-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  // เส้นเชื่อมที่ผ่านมาแล้วเป็นขาวจาง เส้นข้างหน้ายิ่งจางกว่า — ตรงข้ามกับเวอร์ชัน
                  // พื้นขาวที่ใช้หมึกเข้ม เพราะพื้นหลังกลับด้านกัน
                  className={`absolute right-1/2 top-4 h-0.5 w-full ${
                    done || isCurrent ? "bg-white/35" : "bg-white/10"
                  }`}
                />
              ) : null}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-fine font-semibold tabular-nums ${
                  isCurrent
                    ? `${currentBar} ${statusOnBarClass(status)} ring-4 ring-white/10`
                    : done
                      ? "bg-white text-nav"
                      : "bg-white/10 text-white/40 ring-1 ring-white/15 ring-inset"
                }`}
              >
                {done ? <Check aria-hidden className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <p
                className={`mt-2.5 text-center text-fine leading-tight ${
                  isCurrent ? "font-semibold text-white" : done ? "text-white/70" : "text-white/40"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && anchorAt ? (
                <p className="mt-0.5 text-center text-fine tabular-nums text-white/40">
                  {thaiDate.format(anchorAt)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {branchedOff ? (
        <p className="mt-6 flex items-start gap-2.5 rounded-input bg-white/10 p-4 text-fine leading-[1.7] text-white ring-1 ring-white/15 ring-inset">
          <TriangleAlert
            aria-hidden
            className={`mt-px size-4 shrink-0 ${isDangerStatus(status) ? "text-danger" : "text-gold"}`}
          />
          {status === "NeedMoreInfo"
            ? `ใบสมัครหยุดรออยู่ที่ขั้น "${STATUS_TRACK[1].label}" จนกว่าร้านจะส่งข้อมูลเพิ่มเติมตามที่ขอไป`
            : `ใบสมัครนี้สิ้นสุดที่ขั้น "${STATUS_TRACK[1].label}" — ไม่เดินหน้าต่อ`}
        </p>
      ) : null}
    </div>
  );
}
