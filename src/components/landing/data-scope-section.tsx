import { Check, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";

const ASKED = [
  "ชื่อร้าน ที่อยู่ และพิกัดร้าน",
  "ชื่อผู้ติดต่อ เบอร์โทร อีเมล",
  "ประเภทสินค้าและแบรนด์ที่ขายอยู่",
  "ยอดขายโดยประมาณต่อเดือน",
  "รูปหน้าร้านและเอกสารร้านค้า",
];

const NOT_ASKED = [
  "เลขบัญชีธนาคาร",
  "สำเนาหน้าสมุดบัญชี",
  "หนังสือรับรองนิติบุคคล",
  "ภ.พ.20 และเอกสารภาษี",
  "สัญญาและเอกสารทางกฎหมาย",
];

/**
 * ส่วนนี้อยู่บนพื้นดำเพราะเป็นจังหวะ "หยุดแล้วอ่าน" ของหน้า — เป็นคำสัญญาเรื่องข้อมูล
 * ที่ต้องอ่านจริง ไม่ใช่ผ่านตา การเปลี่ยนพื้นเป็นดำทำให้คนชะลอลงเองโดยไม่ต้องขยายตัวอักษร
 *
 * บนพื้นดำ เหลืองสด #FFD84D ได้คอนทราสต์ ~13:1 จึงใช้เป็นสีไอคอน/ตัวอักษรได้เต็มที่
 * ตรงข้ามกับบนพื้นขาวที่มันอ่านไม่ออกเลย — นี่คือเหตุผลที่เหลืองมี "ที่ของมัน" อยู่ตรงนี้
 */
export function DataScopeSection() {
  return (
    <Section tone="tile">
      <SectionHeading tone="dark" title="ขั้นตอนนี้เราขออะไร และไม่ขออะไร" />

      <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        <div>
          <h3 className="text-body font-semibold text-white">ขอในขั้นตอนนี้</h3>
          <ul className="mt-5 space-y-3.5">
            {ASKED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-white/90">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-gold/15"
                >
                  <Check className="size-3.5 text-gold" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-body font-semibold text-white">ยังไม่ขอในขั้นตอนนี้</h3>
          <ul className="mt-5 space-y-3.5">
            {NOT_ASKED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-white/50">
                <span
                  aria-hidden
                  className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.07]"
                >
                  <X className="size-3.5 text-white/45" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-12 max-w-[66ch] rounded-card bg-white/[0.05] p-6 text-body leading-[1.75] text-white/70 ring-1 ring-inset ring-white/10">
        ทั้งหมดนี้จะขอในขั้นตอนเปิดร้าน หลังจากทั้งสองฝ่ายตกลงร่วมงานกันแล้วเท่านั้น
        ถ้ามีใครติดต่อขอเลขบัญชีธนาคารในขั้นตอนสมัคร{" "}
        <span className="font-semibold text-gold">นั่นไม่ใช่เรา</span>
      </p>
    </Section>
  );
}
