import { AuthCta } from "@/components/auth/auth-cta";

/**
 * แถบ CTA ติดขอบล่าง แสดงเฉพาะจอมือถือ
 * หน้านี้เข้าจากการสแกน QR ในร้าน คนอ่านด้วยมือเดียว ปุ่มจึงต้องอยู่ในระยะนิ้วโป้งเสมอ
 */
export function StickyCta({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/90 backdrop-blur-xl sm:hidden">
      <div className="flex items-center gap-4 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <p className="flex-1 text-fine leading-snug text-ink-48">
          ใช้เวลา 2–3 นาที ไม่มีค่าสมัคร
        </p>
        <AuthCta
          signedIn={signedIn}
          href="/apply"
          variant="brand"
          className="min-h-[46px] shrink-0 px-6 text-caption"
        >
          สมัครเลย
        </AuthCta>
      </div>
    </div>
  );
}
