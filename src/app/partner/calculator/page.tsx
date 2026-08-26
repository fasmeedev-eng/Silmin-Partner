import { Headset, ShieldCheck, Zap } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InstallmentCalculator } from "./installment-calculator";
import { CalculatorHeroArt } from "./calculator-hero-art";

export const metadata = { title: "คำนวณผ่อนมือถือ" };

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "ปลอดภัย มั่นใจได้",
    detail: "ข้อมูลลูกค้าปลอดภัย 100% ตามมาตรฐานบริษัท",
  },
  {
    icon: Zap,
    title: "อนุมัติไว ผ่อนสบาย",
    detail: "รู้ผลอนุมัติไว ผ่อนสบาย ๆ นานสูงสุด 12 เดือน",
  },
  {
    icon: Headset,
    title: "ดูแลทุกขั้นตอน",
    detail: "ทีมงานช่วยให้คำแนะนำตลอดการผ่อนชำระ",
  },
] as const;

export default async function PartnerCalculatorPage() {
  // ผ่าน guardPartnerAccess ใน layout.tsx มาแล้ว — ที่นี่แค่ดึง session มาแสดงผลบน SiteHeader
  const session = await auth();

  return (
    <>
      {/* ใช้แถบนำทางแบบเดียวกับหน้าแรก (sectionNav) — เมนูใช้งานพิเศษ ("หลังบ้าน") จึงย้ายไปอยู่ใน
          แฮมเบอร์เกอร์แทนการโผล่บนแถบ เหมือนหน้าแรกทุกประการ ส่ง isActivePartner ด้วยตามที่ผู้ใช้
          ต้องการให้ปุ่ม "คำนวณผ่อนมือถือ" โผล่บนแถบแม้อยู่หน้านี้อยู่แล้ว (ผ่าน guardPartnerAccess
          มาแล้ว จึงเป็น true เสมอ ไม่ต้องคำนวณจริงเหมือนหน้าแรก) */}
      <SiteHeader
        signedIn
        email={session?.user?.email}
        role={session?.user?.role}
        isActivePartner
        sectionNav
      />

      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-12 lg:px-8 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-h2 font-bold leading-[1.32]">
                <span className="text-brand">คำนวณ</span>ผ่อนมือถือ
              </h1>
              <p className="mt-4 max-w-[52ch] text-lead text-ink-80">
                ใส่ราคาเครื่องและเงินดาวน์ เพื่อดูยอดผ่อนต่อเดือนคร่าว ๆ
                สำหรับแนะนำลูกค้าให้กับร้าน
              </p>
            </div>

            <div className="order-first flex justify-center lg:order-last lg:justify-end">
              <CalculatorHeroArt />
            </div>
          </div>

          <div className="mt-10 print:mt-0">
            <InstallmentCalculator />
          </div>

          <ul className="mt-10 grid gap-y-5 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-0 sm:p-8 print:hidden">
            {TRUST_ITEMS.map(({ icon: Icon, title, detail }, index) => (
              <li
                key={title}
                className={`flex items-start gap-4 ${
                  index > 0 ? "sm:border-l sm:border-hairline sm:pl-6" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pearl text-ink"
                >
                  <Icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-caption leading-[1.6] text-ink-48">
                    {detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
