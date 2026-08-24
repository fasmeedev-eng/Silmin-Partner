import { Check } from "lucide-react";

/**
 * สิทธิประโยชน์ตามที่ฝ่ายขายกำหนด — ข้อแรกคือเหตุผลที่แรงที่สุด จึงวางบนสุดและเน้นน้ำหนัก
 *
 * ติ๊กถูกใช้ "แดงจาง" (พื้น brand/10 + ไอคอนแดง) ไม่ใช่วงกลมแดงทึบห้าวง
 * เพราะแดงทึบห้าจุดเรียงกันจะมีน้ำหนักสายตารวมมากกว่าปุ่ม CTA สีแดงปุ่มเดียวด้านล่าง
 * แล้วสายตาจะไปจบที่รายการแทนที่จะไปจบที่ปุ่ม — แดงต้องเหลือ "เสียงดังที่สุด" ไว้ให้ CTA
 */
const BENEFITS = [
  { text: "รับค่าตอบแทนสูงสุด 10% ต่อเครื่อง", lead: true },
  { text: "เพิ่มทางเลือกให้ลูกค้า ด้วยแผนผ่อนชำระที่หลากหลาย" },
  { text: "ช่วยเพิ่มอัตราการปิดการขายและยอดขายของร้าน" },
  { text: "มีทีมงาน Sales และ Support ดูแลอย่างใกล้ชิด" },
  { text: "ติดตามสถานะการสมัครได้แบบเรียลไทม์" },
];

export function BenefitsList() {
  return (
    <div id="benefits" className="scroll-mt-28">
      <h2 className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-48">
        สิ่งที่พาร์ทเนอร์ได้รับ
      </h2>

      <ul className="mt-4 space-y-3">
        {BENEFITS.map(({ text, lead }) => (
          <li
            key={text}
            className={`flex items-start gap-3 text-body ${
              lead ? "font-semibold text-ink" : "text-ink-80"
            }`}
          >
            <span
              aria-hidden
              className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-brand/10"
            >
              <Check className="size-3.5 text-brand-ink" strokeWidth={3} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-caption text-ink-48">
        ค่าตอบแทนเป็นไปตามเงื่อนไขที่บริษัทกำหนด
      </p>
    </div>
  );
}
