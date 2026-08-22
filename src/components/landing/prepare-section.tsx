import { Camera, IdCard, Phone } from "lucide-react";
import { Eyebrow, Section } from "@/components/ui/section";

const items = [
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

export function PrepareSection() {
  return (
    <Section tone="parchment">
      <Eyebrow>ก่อนเริ่ม</Eyebrow>
      <h2 className="mt-4 max-w-[22ch] text-h3 sm:text-h2">
        เตรียมไว้ 3 อย่าง แล้วกรอกจบในรอบเดียว
      </h2>

      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-lg bg-canvas p-6 ring-1 ring-hairline ring-inset"
          >
            {/* ชิปเหลืองเต็มวง ไอคอนสีเข้ม — เหลืองต้องเป็นพื้นเสมอเมื่ออยู่บนพื้นสว่าง */}
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent">
              <Icon
                aria-hidden
                className="size-5 text-on-accent"
                strokeWidth={1.75}
              />
            </span>
            <h3 className="mt-4 text-body font-semibold">{title}</h3>
            <p className="mt-2 text-caption text-ink-80">{body}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-[62ch] text-caption text-ink-48">
        รองรับไฟล์ JPG PNG และ PDF ขนาดไม่เกิน 10 MB ต่อไฟล์ ·
        กรอกไม่จบระบบบันทึกร่างให้อัตโนมัติ กลับมากรอกต่อจากเครื่องไหนก็ได้
      </p>
    </Section>
  );
}
