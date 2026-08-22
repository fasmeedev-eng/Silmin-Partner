import { Eyebrow, Section } from "@/components/ui/section";

// ลำดับตัวเลขที่นี่สื่อความหมายจริง — เป็นลำดับเวลาที่ใบสมัครเดินผ่าน
const steps = [
  {
    no: "01",
    title: "ส่งใบสมัคร",
    body: "ได้เลขที่ใบสมัครทันที เช่น SG-2026-000125 ใช้อ้างอิงได้ทุกครั้งที่ติดต่อกลับมา",
  },
  {
    no: "02",
    title: "ตรวจสอบเอกสาร",
    body: "ภายใน 1–3 วันทำการ ถ้าเอกสารไม่ครบ เราแจ้งให้แก้ในใบเดิม ไม่ต้องกรอกใหม่ทั้งชุด",
  },
  {
    no: "03",
    title: "ทีมขายติดต่อกลับ",
    body: "ตามช่วงเวลาที่คุณเลือกไว้ เพื่อคุยเงื่อนไขการร่วมงานและตอบข้อสงสัย",
  },
  {
    no: "04",
    title: "เปิดร้านพาร์ทเนอร์",
    body: "เมื่อทั้งสองฝ่ายตกลงกันแล้ว จึงเข้าสู่ขั้นตอนทำสัญญาและเปิดระบบให้ใช้งาน",
  },
];

export function ProcessSection() {
  return (
    <Section tone="canvas">
      <Eyebrow>หลังกดส่ง</Eyebrow>
      <h2 className="mt-4 max-w-[22ch] text-h3 sm:text-h2">
        คุณจะรู้ตลอดว่าใบสมัครอยู่ขั้นไหน
      </h2>
      <p className="mt-4 max-w-[52ch] text-body text-ink-80">
        ทุกครั้งที่สถานะเปลี่ยน ระบบแจ้งเตือนในหน้าใบสมัครของฉันและส่งอีเมลถึงคุณ
        ไม่ต้องโทรมาถามเอง
      </p>

      <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ no, title, body }) => (
          <li key={no} className="border-t border-hairline pt-5">
            <span className="text-caption font-semibold tabular-nums text-accent-ink">
              {no}
            </span>
            <h3 className="mt-2 text-body font-semibold">{title}</h3>
            <p className="mt-2 text-caption text-ink-80">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
