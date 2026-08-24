import { ArrowRight, FileText, Store } from "lucide-react";
import { AuthCta } from "@/components/auth/auth-cta";
import { BenefitsList } from "./benefits-list";
import { FeatureStrip } from "./feature-strip";
import { HeroBackdrop } from "./hero-backdrop";
import { PhoneMockup } from "./phone-mockup";
import { TrustInfo } from "./trust-info";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    // พื้นอุ่นจาง ๆ ไม่ใช่ขาวล้วน — การ์ดจุดเด่นด้านล่างเป็นสีขาว ถ้าพื้นหลังขาวเหมือนกัน
    // ขอบมนของการ์ดจะหายไปกับพื้น เหลือแต่เงาลอย ๆ ที่ดูเหมือนความผิดพลาดมากกว่าดีไซน์
    <section
      id="top"
      className="relative scroll-mt-20 overflow-hidden"
      style={{ background: "color-mix(in oklab, var(--brand) 2%, var(--canvas))" }}
    >
      <HeroBackdrop />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 pt-16 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">
          {/* ── คอลัมน์ซ้าย: ข้อความและปุ่ม ─────────────────────────── */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-caption font-semibold text-brand-ink ring-1 ring-inset ring-brand/15">
              <Store aria-hidden className="size-4" strokeWidth={2} />
              โครงการร้านค้าพาร์ทเนอร์
            </p>

            <h1 className="mt-6 max-w-[15ch] text-h2 font-bold leading-[1.28] sm:text-display">
              ให้ร้านของคุณเป็นพาร์ทเนอร์{" "}
              {/* ไล่เฉดทอง→แดงตาม brief แทนทองล้วน — ทองสด #FFD84D บนขาวได้แค่ 1.5:1
                  อ่านไม่ออกจริง ปลายทองจึงเริ่มที่ --gold-deep (~3.2:1) แล้วไล่ไปจบที่แดง
                  ทั้งสองปลายจึงผ่านเกณฑ์คอนทราสต์ของตัวอักษรขนาดใหญ่ */}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--gold-deep) 0%, var(--brand) 92%)",
                }}
              >
                SG
              </span>
            </h1>

            <p className="mt-6 max-w-[42ch] text-lead text-ink-80">
              กรอกใบสมัครออนไลน์ใน 2–3 นาที
              ทีมงานตรวจสอบและติดต่อกลับภายใน 3 วันทำการ
            </p>

            {/* สิ่งที่ร้านได้รับ ต้องมาก่อนปุ่ม — คนควรรู้ว่าได้อะไรก่อนถูกขอให้กด */}
            <div className="mt-10">
              <BenefitsList />
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <AuthCta signedIn={signedIn} href="/apply" variant="brand">
                สมัครเป็นพาร์ทเนอร์
                <ArrowRight aria-hidden className="size-[18px]" />
              </AuthCta>
              <AuthCta signedIn={signedIn} href="/me" variant="brand-outline">
                <FileText aria-hidden className="size-[18px] text-ink-48" />
                ตรวจสอบสถานะใบสมัคร
              </AuthCta>
            </div>

            <div className="mt-7">
              <TrustInfo />
            </div>
          </div>

          {/* ── คอลัมน์ขวา: ตัวอย่างหน้าจอจริงของใบสมัคร ──────────────
              บนมือถือย้ายไปอยู่ท้ายสุด (order-last) เพราะบนจอแคบ สิ่งที่ต้องมาก่อน
              คือหัวข้อ → ประโยชน์ → ปุ่ม ไม่ใช่ภาพประกอบที่กินความสูงไปทั้งจอ */}
          <div className="order-last flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>

      <div className="relative mt-16 lg:mt-24">
        <FeatureStrip />
      </div>
    </section>
  );
}
