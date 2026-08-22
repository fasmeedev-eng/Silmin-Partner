import { ChevronDown } from "lucide-react";
import { Eyebrow, Section } from "@/components/ui/section";

const faqs = [
  {
    q: "สมัครมีค่าใช้จ่ายไหม",
    a: "ไม่มีค่าสมัครและไม่มีค่ามัดจำ การกรอกใบสมัครยังไม่ผูกมัดว่าต้องร่วมงานกัน คุณยกเลิกได้ทุกเมื่อก่อนเซ็นสัญญา",
  },
  {
    q: "ร้านยังไม่จดทะเบียนพาณิชย์ สมัครได้ไหม",
    a: "สมัครได้ ใช้บัตรประชาชนของเจ้าของร้านยื่นในนามบุคคลธรรมดา หากภายหลังจดทะเบียนแล้วค่อยแจ้งเพิ่มเข้ามาได้",
  },
  {
    q: "กรอกไม่จบ ต้องเริ่มใหม่ไหม",
    a: "ไม่ต้อง ระบบบันทึกร่างให้อัตโนมัติทุกขั้นตอน เข้าสู่ระบบด้วยบัญชี Google เดิมแล้วกรอกต่อจากจุดที่ค้างไว้ได้เลย",
  },
  {
    q: "ส่งใบสมัครไปแล้ว แก้ไขข้อมูลได้ไหม",
    a: "แก้ไขได้ระหว่างที่สถานะเป็น ใบสมัครใหม่ หรือ รอข้อมูลเพิ่มเติม เมื่อทีมงานอนุมัติแล้วระบบจะล็อกข้อมูล เพื่อให้สิ่งที่อนุมัติตรงกับสิ่งที่ตรวจสอบจริง หากต้องแก้หลังจากนั้นให้แจ้งทีมงานที่ดูแลใบสมัครของคุณ",
  },
  {
    q: "มีหลายสาขา ต้องสมัครกี่ใบ",
    a: "ใบเดียวในนามกิจการ ไม่ต้องแยกตามสาขา ในฟอร์มมีช่องให้ระบุจำนวนสาขาอยู่แล้ว ส่วนที่อยู่และรูปหน้าร้านให้ใช้ของสาขาหลักที่ติดต่อได้สะดวกที่สุด รายละเอียดของสาขาอื่นจะเก็บในขั้นตอนเปิดร้าน หลังจากตกลงร่วมงานกันแล้ว",
  },
];

export function FaqSection() {
  return (
    <Section tone="canvas" id="faq">
      <Eyebrow>คำถามที่พบบ่อย</Eyebrow>
      <h2 className="mt-4 max-w-[20ch] text-h3 sm:text-h2">ถามกันมาบ่อยที่สุด</h2>

      <div className="mt-10 max-w-[72ch]">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group border-b border-hairline">
            <summary className="flex min-h-[60px] items-center justify-between gap-6 py-4 text-body font-semibold">
              {q}
              <ChevronDown
                aria-hidden
                className="size-5 shrink-0 text-accent-ink transition-transform duration-200 group-open:rotate-180"
                strokeWidth={2}
              />
            </summary>
            <p className="pb-5 text-caption text-ink-80">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
