import { auth } from "@/auth";
import { LoginDialogProvider } from "@/components/auth/login-dialog";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/landing/hero";
import { PrepareSection } from "@/components/landing/prepare-section";
import { ProcessSection } from "@/components/landing/process-section";
import { DataScopeSection } from "@/components/landing/data-scope-section";
import { FaqSection } from "@/components/landing/faq-section";
import { ClosingCta } from "@/components/landing/closing-cta";
import { StickyCta } from "@/components/landing/sticky-cta";

export default async function Home() {
  // หน้านี้เปิดสาธารณะ อ่าน session เพียงเพื่อตัดสินใจว่าปุ่มจะเปิด popup เข้าสู่ระบบหรือพาไปต่อ
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <LoginDialogProvider>
      <SiteHeader signedIn={signedIn} email={session?.user?.email} role={session?.user?.role} />

      {/* เว้นที่ด้านล่างให้แถบ CTA ติดขอบจอมือถือ */}
      <main className="pb-24 sm:pb-0">
        <Hero signedIn={signedIn} />
        <PrepareSection />
        <ProcessSection />
        <DataScopeSection />
        <FaqSection />
        <ClosingCta signedIn={signedIn} />
      </main>

      <SiteFooter />
      <StickyCta signedIn={signedIn} />
    </LoginDialogProvider>
  );
}
