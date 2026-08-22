import { AuthCta } from "@/components/auth/auth-cta";
import { Section } from "@/components/ui/section";

export function ClosingCta({ signedIn }: { signedIn: boolean }) {
  return (
    // พื้นดำสำหรับจังหวะปิด — เหลืองบนดำคอนทราสต์สูงสุด ปุ่มสุดท้ายจึงเด่นที่สุดในหน้า
    <Section tone="tile">
      <div className="mx-auto max-w-[46ch] text-center">
        <h2 className="text-h3 sm:text-h2">พร้อมเริ่มแล้วใช่ไหม</h2>
        <p className="mt-4 text-body text-on-dark-muted">
          ใช้เวลา 2–3 นาที กรอกไม่จบวันนี้ ระบบเก็บร่างไว้ให้
          กลับมาต่อเมื่อไหร่ก็ได้
        </p>
        <div className="mt-8 flex justify-center">
          <AuthCta signedIn={signedIn} href="/apply">
            สมัครเป็นพาร์ทเนอร์
          </AuthCta>
        </div>
        <p className="mt-5 text-caption text-on-dark-muted">
          การกดสมัครยังไม่ผูกมัด คุณยกเลิกได้ทุกเมื่อก่อนเซ็นสัญญา
        </p>
      </div>
    </Section>
  );
}
