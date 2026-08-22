import { Check, Clock, Lock, ShieldCheck } from "lucide-react";
import { AuthCta } from "@/components/auth/auth-cta";
import { Eyebrow } from "@/components/ui/section";
import { FormPreview } from "./form-preview";

// สิทธิประโยชน์ตามที่ฝ่ายขายกำหนด — ข้อแรกคือเหตุผลที่แรงที่สุด จึงวางไว้บนสุดและเน้นน้ำหนัก
const benefits = [
  { text: "รับค่าตอบแทนสูงสุด 10% ต่อเครื่อง", lead: true },
  { text: "เพิ่มทางเลือกให้ลูกค้า ด้วยแผนผ่อนชำระที่หลากหลาย" },
  { text: "ช่วยเพิ่มอัตราการปิดการขายและยอดขายของร้าน" },
  { text: "มีทีมงาน Sales และ Support ดูแลอย่างใกล้ชิด" },
  { text: "ติดตามสถานะการสมัครได้แบบเรียลไทม์" },
];

// สามข้อนี้พูดถึง "การกรอกฟอร์ม" ไม่ใช่ "ข้อเสนอ" จึงแยกจากสิทธิประโยชน์ด้านบน
const assurances = [
  { icon: Clock, label: "ใช้เวลา 2–3 นาที" },
  { icon: Lock, label: "ยังไม่ต้องใช้เลขบัญชีธนาคาร" },
  { icon: ShieldCheck, label: "เก็บข้อมูลตาม PDPA" },
];

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto grid w-full max-w-[1040px] items-center gap-14 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-[80px]">
        <div>
          <Eyebrow>โครงการร้านค้าพาร์ทเนอร์</Eyebrow>

          <h1 className="mt-4 max-w-[15ch] text-h2 sm:text-display">
            ให้ร้านของคุณเป็นพาร์ทเนอร์ Silmin
          </h1>

          <p className="mt-5 max-w-[38ch] text-lead text-ink-80">
            กรอกใบสมัครออนไลน์ใน 2–3 นาที
            ทีมงานตรวจสอบและติดต่อกลับภายใน 3 วันทำการ
          </p>

          {/* สิ่งที่ร้านได้รับ ต้องอยู่ก่อนปุ่ม — คนควรรู้ว่าได้อะไรก่อนถูกขอให้กด */}
          <div className="mt-8">
            <p className="text-caption font-semibold text-ink">
              สิ่งที่ร้านพาร์ทเนอร์ได้รับ
            </p>
            <ul className="mt-3 space-y-2.5">
              {benefits.map(({ text, lead }) => (
                <li
                  key={text}
                  className={`flex items-start gap-3 text-body ${
                    lead ? "font-semibold text-ink" : "text-ink-80"
                  }`}
                >
                  <Check
                    aria-hidden
                    className="mt-1.5 size-4 shrink-0 text-accent-ink"
                    strokeWidth={2.5}
                  />
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-caption text-ink-48">
              ค่าตอบแทนเป็นไปตามเงื่อนไขที่บริษัทกำหนด
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AuthCta signedIn={signedIn} href="/apply">
              สมัครเป็นพาร์ทเนอร์
            </AuthCta>
            <AuthCta signedIn={signedIn} href="/me" variant="secondary">
              ตรวจสอบสถานะใบสมัคร
            </AuthCta>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {assurances.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-caption text-ink-48"
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <FormPreview />
        </div>
      </div>
    </section>
  );
}
