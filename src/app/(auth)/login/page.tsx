import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { signIn } from "@/auth";
import sgMark from "@/components/brand/sg-mark.png";
import { GoogleMark } from "@/components/auth/google-mark";
import { resolveRedirect } from "@/lib/safe-redirect";

export const metadata = { title: "เข้าสู่ระบบ" };

// ต้องพูดตรงกับป็อปอัปในหน้าแรก — คนที่ถูก middleware เด้งมาที่นี่กำลังตอบคำถามเดียวกัน
// ว่า "ทำไมต้องล็อกอิน" ถ้าสองที่ให้เหตุผลคนละชุดจะดูเหมือนคนละระบบ
const REASONS = [
  "กรอกไม่จบ ระบบเก็บร่างไว้ให้ กลับมากรอกต่อได้",
  "ติดตามสถานะใบสมัครเองได้ ไม่ต้องโทรถาม",
  "อัปโหลดเอกสารเพิ่มได้เมื่อเจ้าหน้าที่ขอ",
];

/**
 * หน้าเข้าสู่ระบบเต็มหน้า — ใช้เมื่อ middleware เด้งคนที่ยังไม่ล็อกอินมาจาก /apply หรือ /me
 * ทางเข้าปกติจากหน้าแรกคือ popup ไม่ใช่หน้านี้ ทั้งสองที่จึงใช้หน้าตาและถ้อยคำชุดเดียวกัน
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  // NextAuth ส่ง callbackUrl มาเป็น URL เต็ม ส่วน middleware ของเราส่งมาเป็น path
  // resolveRedirect รับได้ทั้งสองแบบ และตัดปลายทางนอกโดเมนทิ้ง
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const target = resolveRedirect(callbackUrl, `${proto}://${host}`, "/after-login");

  return (
    <main className="surface-tint flex min-h-svh flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-[27rem] rounded-card bg-canvas p-8 shadow-soft ring-1 ring-hairline/70">
        <Image src={sgMark} alt="" priority className="h-10 w-auto" sizes="44px" />

        <h1 className="mt-5 text-h3 font-bold leading-[1.32]">เข้าสู่ระบบเพื่อไปต่อ</h1>
        <p className="mt-3 text-caption leading-[1.7] text-ink-80">
          ใช้บัญชี Google ของคุณ ไม่ต้องตั้งรหัสผ่านใหม่ และไม่ต้องจำเลขที่ใบสมัคร
        </p>

        <ul className="mt-6 space-y-3">
          {REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-3 text-caption text-ink-80">
              <span
                aria-hidden
                className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-brand/10"
              >
                <Check className="size-3.5 text-brand-ink" strokeWidth={3} />
              </span>
              {reason}
            </li>
          ))}
        </ul>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: target });
          }}
        >
          {/* พื้นขาว + โลโก้สี่สีของ Google ตามแนวปฏิบัติของเขา ไม่ย้อมเป็นสีแบรนด์เรา */}
          <button
            type="submit"
            className="mt-7 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-btn bg-canvas text-body font-semibold text-ink shadow-soft ring-1 ring-hairline ring-inset transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lift hover:ring-ink-48/40 motion-reduce:hover:translate-y-0"
          >
            <GoogleMark />
            เข้าสู่ระบบด้วย Google
          </button>
        </form>

        <p className="mt-6 flex items-start gap-2.5 rounded-input bg-pearl p-4 text-fine leading-[1.7] text-ink-48 ring-1 ring-hairline ring-inset">
          <ShieldCheck aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.9} />
          เราขอจากบัญชี Google ของคุณแค่ชื่อและอีเมลเท่านั้น
          ไม่มีสิทธิ์อ่านอีเมลหรือไฟล์ใน Google Drive ของคุณ
        </p>
      </div>

      <Link
        href="/"
        className="mx-auto mt-7 inline-flex min-h-[44px] items-center gap-2 text-caption font-medium text-ink-80 transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        กลับหน้าแรก
      </Link>
    </main>
  );
}
