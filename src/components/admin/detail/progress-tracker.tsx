import { Check } from "lucide-react";
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
 * แถบความคืบหน้าห้าขั้นของหน้ารายละเอียดใบสมัคร (ฝั่งเจ้าหน้าที่)
 *
 * ใช้ STATUS_TRACK ชุดเดียวกับที่ผู้สมัครเห็นบน /me/[id] — ทั้งสองหน้าต้องนับขั้นตรงกัน
 * เพราะเป็นใบสมัครใบเดียวกัน แต่ **สีของขั้นปัจจุบันไม่เหมือนกัน**: /me ใช้วงกลมแดงแบรนด์เสมอ
 * (กฎของฝั่งผู้สมัคร: แดง = ไฮไลต์/ต้องสนใจ) ส่วนที่นี่ใช้ statusBarClass ตัวเดียวกับที่แถบ
 * ความคืบหน้าในตารางคิวงานใช้ — ทอง = ถึงตาร้าน, ดำ = อนุมัติ/ผ่านแล้ว, แดง = ไม่ผ่าน,
 * เทา = กำลังเดินอยู่ปกติ เพราะหน้านี้อยู่ในหลังบ้านซึ่งรัดเข็มขัดสีแดงไว้ให้เหลือแค่
 * ปุ่มดำเนินการกับข้อผิดพลาดเท่านั้น (ดู DESIGN.md ส่วนหลังบ้าน) และเพื่อให้จุดสีตรงนี้
 * อ่านสอดคล้องกับแถบเดียวกันที่อยู่แถวเดียวกันในตารางคิวงานที่เพิ่งดูมาก่อนเปิดหน้านี้
 *
 * ขั้นที่ผ่านมาแล้วใช้สีหมึกเข้ม (ไม่ใช่สีสถานะ) เพราะเป็นข้อเท็จจริงที่ไม่เปลี่ยนแล้ว
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
    <section
      className="mt-6 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:p-7"
      aria-label="ความคืบหน้าการสมัคร"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-ink">ความคืบหน้าการสมัคร</h2>
        <p className="flex items-center gap-2.5 text-caption text-ink-48">
          ความคืบหน้า{" "}
          <span className="font-semibold tabular-nums text-ink">
            {current + 1}/{STATUS_TRACK.length}
          </span>
          <span
            role="img"
            aria-label={`${current + 1} จาก ${STATUS_TRACK.length} ขั้นตอน`}
            className="block h-1.5 w-24 overflow-hidden rounded-full bg-divider-soft"
          >
            <span
              aria-hidden
              className={`block h-full rounded-full ${currentBar}`}
              style={{ width: `${((current + 1) / STATUS_TRACK.length) * 100}%` }}
            />
          </span>
        </p>
      </div>

      <ol className="mt-7 flex items-start">
        {STATUS_TRACK.map((step, index) => {
          const done = index < current;
          const isCurrent = index === current;
          return (
            <li key={step.status} className="relative flex flex-1 flex-col items-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  // เส้นเชื่อมที่ผ่านมาแล้วเป็นหมึกเข้ม (ข้อเท็จจริงที่นิ่งแล้ว) เส้นข้างหน้าเป็นสีจาง
                  className={`absolute right-1/2 top-4 h-0.5 w-full sm:top-[18px] ${
                    done || isCurrent ? "bg-ink-48" : "bg-hairline"
                  }`}
                />
              ) : null}
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-fine font-semibold tabular-nums sm:size-9 ${
                  isCurrent
                    ? `${currentBar} ${statusOnBarClass(status)} ring-4 ring-ink/[0.06]`
                    : done
                      ? "bg-ink text-canvas"
                      : "bg-canvas text-ink-48 ring-1 ring-hairline ring-inset"
                }`}
              >
                {done ? <Check aria-hidden className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <p
                className={`mt-2.5 text-center text-fine leading-tight ${
                  isCurrent ? "font-semibold text-ink" : done ? "text-ink-80" : "text-ink-48"
                }`}
              >
                {step.label}
              </p>
              {isCurrent && anchorAt ? (
                <p className="mt-0.5 text-center text-fine tabular-nums text-ink-48">
                  {thaiDate.format(anchorAt)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {branchedOff ? (
        <p
          className={`mt-7 rounded-input p-4 text-caption leading-[1.7] ring-1 ring-inset ${
            isDangerStatus(status)
              ? "bg-danger/[0.06] text-danger-ink ring-danger/25"
              : "bg-gold-soft text-ink-80 ring-gold"
          }`}
        >
          {status === "NeedMoreInfo"
            ? `ใบสมัครหยุดรออยู่ที่ขั้น "${STATUS_TRACK[1].label}" จนกว่าร้านจะส่งข้อมูลเพิ่มเติมตามที่ขอไป`
            : `ใบสมัครนี้สิ้นสุดที่ขั้น "${STATUS_TRACK[1].label}" — ไม่เดินหน้าต่อ`}
        </p>
      ) : null}
    </section>
  );
}
