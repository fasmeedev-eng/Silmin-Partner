import { Calculator } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InstallmentCalculator } from "./installment-calculator";

export const metadata = { title: "คำนวณผ่อนมือถือ" };

export default async function PartnerCalculatorPage() {
  // ผ่าน guardPartnerAccess ใน layout.tsx มาแล้ว — ที่นี่แค่ดึง session มาแสดงผลบน SiteHeader
  const session = await auth();

  return (
    <>
      <SiteHeader
        signedIn
        email={session?.user?.email}
        role={session?.user?.role}
        isActivePartner
      />

      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[1080px] px-6 py-12 lg:px-8 lg:py-16">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-input bg-brand text-on-brand"
            >
              <Calculator className="size-[22px]" strokeWidth={2} />
            </span>
            <h1 className="text-h3 font-bold leading-[1.32]">คำนวณผ่อนมือถือ</h1>
          </div>

          <p className="mt-5 max-w-[58ch] text-lead text-ink-80">
            ใส่ราคาเครื่องและเงินดาวน์ เพื่อดูยอดผ่อนต่อเดือนคร่าว ๆ สำหรับแนะนำลูกค้าที่หน้าร้าน
          </p>

          <div className="mt-10">
            <InstallmentCalculator />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
