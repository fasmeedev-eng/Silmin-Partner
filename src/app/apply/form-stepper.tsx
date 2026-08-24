import { Check } from "lucide-react";
import { STEPS } from "@/lib/application/options";

/**
 * แถบขั้นตอนของฟอร์มเจ็ดขั้น — แทนแถบความคืบหน้าแบบเส้นเดียว
 *
 * ต่างกันตรงที่แถบเส้นเดียวบอกได้แค่ "ไปได้กี่ % แล้ว" ส่วนอันนี้บอกได้ว่าทั้งหมดมีอะไรบ้าง
 * ผ่านอะไรมาแล้ว และเหลืออะไรอีก ซึ่งเป็นสิ่งที่คนกรอกฟอร์มยาว ๆ อยากรู้จริง ๆ
 *
 * ขั้นที่ผ่านแล้วกดย้อนกลับไปได้ ขั้นที่ยังไม่ถึงกดไม่ได้ — การกระโดดข้ามไปข้างหน้าจะข้าม
 * การตรวจข้อมูลของขั้นที่คั่นอยู่ ส่วนการย้อนกลับไม่มีปัญหา เพราะตอนกด "ถัดไป" ระบบตรวจซ้ำอยู่แล้ว
 *
 * จอเล็กซ่อนป้ายชื่อขั้น เหลือแต่วงกลม — เจ็ดป้ายภาษาไทยเรียงกันในความกว้างมือถือจะตัดคำจนอ่านไม่ออก
 * ชื่อขั้นปัจจุบันยังเห็นได้จาก h1 ที่อยู่ใต้แถบนี้อยู่แล้ว
 */
export function FormStepper({
  currentIndex,
  onStepSelect,
}: {
  currentIndex: number;
  onStepSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="ขั้นตอนการกรอกใบสมัคร">
      <ol className="flex items-start">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;

          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center">
              {/* เส้นเชื่อมวาดย้อนจากวงนี้ไปหาวงก่อนหน้า จึงข้ามวงแรกไป
                  ส่วนที่ผ่านมาแล้วเป็นแดง ที่เหลือเป็นเส้นจาง — เห็นความคืบหน้าได้เหมือนแถบเดิม */}
              {index > 0 ? (
                <span
                  aria-hidden
                  className={`absolute right-1/2 top-4 h-0.5 w-full transition-colors duration-300 sm:top-[18px] ${
                    done || current ? "bg-brand" : "bg-hairline"
                  }`}
                />
              ) : null}

              <StepMarker
                index={index}
                done={done}
                current={current}
                label={step.title}
                onSelect={done ? () => onStepSelect(index) : undefined}
              />

              <span
                className={`mt-2.5 hidden text-center text-fine leading-tight lg:block ${
                  current
                    ? "font-semibold text-ink"
                    : done
                      ? "text-ink-80"
                      : "text-ink-48"
                }`}
              >
                {step.short}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepMarker({
  index,
  done,
  current,
  label,
  onSelect,
}: {
  index: number;
  done: boolean;
  current: boolean;
  label: string;
  onSelect?: () => void;
}) {
  const shape =
    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-fine font-semibold tabular-nums transition-all sm:size-9";

  const tone = current
    ? "bg-brand text-on-brand ring-4 ring-brand/15"
    : done
      ? "bg-brand text-on-brand"
      : "bg-canvas text-ink-48 ring-1 ring-hairline ring-inset";

  const content = done ? (
    <Check aria-hidden className="size-4" strokeWidth={3} />
  ) : (
    index + 1
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        // ขั้นที่ผ่านแล้วเป็นปุ่มจริง ต้องบอก screen reader ว่ากดแล้วเกิดอะไร ไม่ใช่อ่านแค่เครื่องหมายถูก
        aria-label={`ย้อนกลับไปขั้นที่ ${index + 1} ${label}`}
        className={`${shape} ${tone} cursor-pointer hover:bg-brand-hover focus-visible:outline-ink`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      aria-current={current ? "step" : undefined}
      className={`${shape} ${tone}`}
    >
      {content}
      <span className="sr-only">
        {current ? `ขั้นปัจจุบัน: ${label}` : `ยังไม่ถึงขั้น: ${label}`}
      </span>
    </span>
  );
}
