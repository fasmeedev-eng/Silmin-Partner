import { Check, X } from "lucide-react";
import { Eyebrow, Section } from "@/components/ui/section";

const asked = [
  "ชื่อร้าน ที่อยู่ และพิกัดร้าน",
  "ชื่อผู้ติดต่อ เบอร์โทร อีเมล",
  "ประเภทสินค้าและแบรนด์ที่ขายอยู่",
  "ยอดขายโดยประมาณต่อเดือน",
  "รูปหน้าร้านและเอกสารร้านค้า",
];

const notAsked = [
  "เลขบัญชีธนาคาร",
  "สำเนาหน้าสมุดบัญชี",
  "หนังสือรับรองนิติบุคคล",
  "ภ.พ.20 และเอกสารภาษี",
  "สัญญาและเอกสารทางกฎหมาย",
];

export function DataScopeSection() {
  return (
    <Section tone="tile">
      <Eyebrow tone="dark">ขอบเขตข้อมูล</Eyebrow>
      <h2 className="mt-4 max-w-[24ch] text-h3 sm:text-h2">
        ขั้นตอนนี้เราขออะไร และไม่ขออะไร
      </h2>

      <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <div className="border-t border-white/20 pt-5">
          <h3 className="text-body font-semibold">ขอในขั้นตอนนี้</h3>
          <ul className="mt-4 space-y-3">
            {asked.map((item) => (
              <li key={item} className="flex items-start gap-3 text-caption">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-accent-on-dark"
                  strokeWidth={2.25}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/20 pt-5">
          <h3 className="text-body font-semibold">ยังไม่ขอในขั้นตอนนี้</h3>
          <ul className="mt-4 space-y-3">
            {notAsked.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-caption text-on-dark-muted"
              >
                <X aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-10 max-w-[62ch] rounded-lg bg-tile-alt p-5 text-caption text-on-dark-muted">
        ทั้งหมดนี้จะขอในขั้นตอนเปิดร้าน หลังจากทั้งสองฝ่ายตกลงร่วมงานกันแล้วเท่านั้น
        ถ้ามีใครติดต่อขอเลขบัญชีธนาคารในขั้นตอนสมัคร{" "}
        <span className="text-on-dark">นั่นไม่ใช่เรา</span>
      </p>
    </Section>
  );
}
