import { ArrowRight } from "lucide-react";
import { AuthCta } from "@/components/auth/auth-cta";
import { Section } from "@/components/ui/section";

/**
 * จังหวะปิดของหน้า — พื้นดำเต็มความกว้าง แล้ววางปุ่มแดงปุ่มเดียวไว้ตรงกลาง
 * แดงบนดำได้คอนทราสต์สูงกว่าแดงบนขาวมาก ปุ่มสุดท้ายของหน้าจึงเป็นสิ่งที่สว่างที่สุดในสายตา
 * ตรงนี้มีปุ่มเดียว ไม่มีปุ่มรอง — คนที่เลื่อนมาถึงบรรทัดนี้ตัดสินใจแล้ว เหลือแค่ให้กด
 */
export function ClosingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <Section tone="tile">
      <div className="mx-auto max-w-[52ch] text-center">
        <h2 className="text-h3 font-bold leading-[1.32] sm:text-h2">
          พร้อมเริ่มแล้วใช่ไหม
        </h2>
        <p className="mx-auto mt-5 max-w-[44ch] text-lead text-on-dark-muted">
          ใช้เวลา 2–3 นาที กรอกไม่จบวันนี้ ระบบเก็บร่างไว้ให้ กลับมาต่อเมื่อไหร่ก็ได้
        </p>

        <div className="mt-10 flex justify-center">
          <AuthCta signedIn={signedIn} href="/apply" variant="brand">
            สมัครเป็นพาร์ทเนอร์
            <ArrowRight aria-hidden className="size-[18px]" />
          </AuthCta>
        </div>

        <p className="mt-6 text-caption text-white/45">
          การกดสมัครยังไม่ผูกมัด คุณยกเลิกได้ทุกเมื่อก่อนเซ็นสัญญา
        </p>
      </div>
    </Section>
  );
}
