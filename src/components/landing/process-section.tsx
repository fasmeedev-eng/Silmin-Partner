import { Section, SectionHeading } from "@/components/ui/section";

// ตัวเลขที่นี่สื่อความหมายจริง — เป็นลำดับเวลาที่ใบสมัครเดินผ่าน ไม่ใช่เลขประดับหัวข้อ
const STEPS = [
  {
    no: 1,
    title: "ส่งใบสมัคร",
    body: "ได้เลขที่ใบสมัครทันที เช่น SG-2026-000125 ใช้อ้างอิงได้ทุกครั้งที่ติดต่อกลับมา",
  },
  {
    no: 2,
    title: "ตรวจสอบเอกสาร",
    body: "ภายใน 1–3 วันทำการ ถ้าเอกสารไม่ครบ เราแจ้งให้แก้ในใบเดิม ไม่ต้องกรอกใหม่ทั้งชุด",
  },
  {
    no: 3,
    title: "ทีมขายติดต่อกลับ",
    body: "ตามช่วงเวลาที่คุณเลือกไว้ เพื่อคุยเงื่อนไขการร่วมงานและตอบข้อสงสัย",
  },
  {
    no: 4,
    title: "เปิดร้านพาร์ทเนอร์",
    body: "เมื่อทั้งสองฝ่ายตกลงกันแล้ว จึงเข้าสู่ขั้นตอนทำสัญญาและเปิดระบบให้ใช้งาน",
  },
];

/**
 * วงกลมตัวเลขเป็นสีดำ ไม่ใช่แดง — ตามการแบ่งบทบาทสีของหน้านี้ ดำคือ "โครงสร้าง/ลำดับ"
 * ส่วนแดงคือ "สิ่งที่กดได้" ลำดับขั้นตอนเป็นโครงสร้าง จึงเป็นดำ
 */
export function ProcessSection() {
  return (
    <Section tone="tint" id="process">
      <SectionHeading
        title="หลังกดส่ง คุณจะรู้ตลอดว่าใบสมัครอยู่ขั้นไหน"
        lead="ทุกครั้งที่สถานะเปลี่ยน ระบบแจ้งเตือนในหน้าใบสมัครของฉันและส่งอีเมลถึงคุณ ไม่ต้องโทรมาถามเอง"
      />

      <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ no, title, body }, index) => (
          <li key={no} className="relative">
            <div className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nav text-caption font-semibold tabular-nums text-white">
                {no}
              </span>
              {/* เส้นเชื่อมไปขั้นถัดไป มีเฉพาะจอกว้างที่ทั้งสี่ขั้นเรียงเป็นแถวเดียว
                  จอแคบเรียงลงมาเป็นคอลัมน์ เส้นแนวนอนจะชี้ไปผิดทางทันที */}
              {index < STEPS.length - 1 ? (
                <span aria-hidden className="hidden h-px flex-1 bg-hairline lg:block" />
              ) : null}
            </div>
            <h3 className="mt-5 text-body font-semibold">{title}</h3>
            <p className="mt-2.5 max-w-[34ch] text-caption leading-[1.7] text-ink-80">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
