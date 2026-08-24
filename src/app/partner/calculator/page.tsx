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

      <main className="mx-auto w-full max-w-[1040px] px-6 py-12 sm:px-8 sm:py-16">
        <h1 className="text-h3 sm:text-h2">คำนวณผ่อนมือถือ</h1>
        <p className="mt-4 max-w-[56ch] text-body text-ink-80">
          ใส่ราคาเครื่องและเงินดาวน์ เพื่อดูยอดผ่อนต่อเดือนคร่าว ๆ สำหรับแนะนำลูกค้าที่หน้าร้าน
        </p>

        <div className="mt-10">
          <InstallmentCalculator />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
