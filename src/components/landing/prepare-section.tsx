import { Camera, IdCard, Phone } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";

const ITEMS = [
  {
    icon: Camera,
    title: "รูปหน้าร้าน",
    body: "ถ่ายจากมือถือได้เลย ขอให้เห็นป้ายชื่อร้านชัด ถ้ามีหลายสาขาให้ใช้รูปของสาขาหลัก",
  },
  {
    icon: IdCard,
    title: "บัตรประชาชนเจ้าของร้าน",
    body: "ถ่ายรูปหรือสแกนก็ได้ ถ้ามีทะเบียนพาณิชย์แนบเพิ่มจะช่วยให้ตรวจสอบเร็วขึ้น",
  },
  {
    icon: Phone,
    title: "เบอร์ที่ติดต่อได้จริง",
    body: "พร้อมช่วงเวลาที่สะดวกให้ทีมงานโทรกลับ เราจะโทรตามเวลาที่คุณเลือก",
  },
];

/**
 * ชิปไอคอนเป็นเหลืองทั้งสามใบ ไม่สลับแดง — ส่วนนี้คือ "สิ่งที่ต้องเตรียม" ไม่ใช่สิ่งที่ต้องกด
 * แดงถูกกันไว้ให้ปุ่มกับสถานะ active เท่านั้น ถ้าโปรยแดงมาที่นี่ด้วย ปุ่ม CTA จะเหลือเสียงเบาลง
 */
export function PrepareSection() {
  return (
    <Section tone="canvas">
      <SectionHeading
        title="เตรียมไว้ 3 อย่าง แล้วกรอกจบในรอบเดียว"
        lead="ไม่ต้องเตรียมเอกสารบริษัทหรือเลขบัญชีธนาคารในขั้นตอนนี้ แค่สามอย่างนี้ก็กรอกจบได้"
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-card bg-canvas p-7 shadow-soft ring-1 ring-hairline/70"
          >
            {/* เหลืองเป็นพื้นเสมอเมื่ออยู่บนพื้นสว่าง ไอคอนจึงต้องเป็นสีเข้ม ไม่ใช่ขาว */}
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-gold">
              <Icon aria-hidden className="size-[22px] text-[#0a0a0a]" strokeWidth={1.9} />
            </span>
            <h3 className="mt-5 text-body font-semibold">{title}</h3>
            <p className="mt-2.5 text-caption leading-[1.7] text-ink-80">{body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-[68ch] text-caption text-ink-48">
        รองรับไฟล์ JPG PNG และ PDF ขนาดไม่เกิน 10 MB ต่อไฟล์ ·
        กรอกไม่จบระบบบันทึกร่างให้อัตโนมัติ กลับมากรอกต่อจากเครื่องไหนก็ได้
      </p>
    </Section>
  );
}
