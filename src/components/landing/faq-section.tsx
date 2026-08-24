import { Plus } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";

const FAQS = [
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

/**
 * ใช้ <details> ล้วน ไม่ต้องมี JS ฝั่ง client — เปิดปิดได้แม้สคริปต์ยังโหลดไม่เสร็จ
 * และ Ctrl+F ของเบราว์เซอร์ยังหาข้อความในคำตอบที่ปิดอยู่เจอ ซึ่ง accordion ที่ทำด้วย JS มักทำไม่ได้
 *
 * เครื่องหมายเป็น + ที่หมุนเป็น × ตอนเปิด แทนลูกศรลง — บอกได้ตรงกว่าว่า "กดเพื่อกาง/พับ"
 */
export function FaqSection() {
  return (
    <Section tone="canvas" id="faq">
      <SectionHeading title="คำถามที่พบบ่อย" />

      <div className="mt-12 max-w-[80ch] space-y-3">
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-card bg-canvas ring-1 ring-hairline transition-colors open:ring-hairline hover:ring-ink-48/25"
          >
            <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-6 px-6 py-4 text-body font-semibold">
              {q}
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink transition-transform duration-300 ease-out group-open:rotate-[135deg]"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </span>
            </summary>
            <p className="px-6 pb-6 text-body leading-[1.75] text-ink-80">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
