import Link from "next/link";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { GoogleMark } from "@/components/auth/google-mark";
import { resolveRedirect } from "@/lib/safe-redirect";

export const metadata = { title: "เข้าสู่ระบบ" };

/**
 * หน้าเข้าสู่ระบบเต็มหน้า — ใช้เมื่อ middleware เด้งคนที่ยังไม่ล็อกอินมาจาก /apply หรือ /me
 * ทางเข้าปกติจากหน้าแรกคือ popup ไม่ใช่หน้านี้
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
    <main className="mx-auto flex min-h-svh w-full max-w-[26rem] flex-col justify-center px-6 py-16">
      <h1 className="text-h3">เข้าสู่ระบบเพื่อไปต่อ</h1>
      <p className="mt-4 text-caption text-ink-80">
        ใช้บัญชี Google เพื่อให้ระบบเก็บร่างใบสมัครไว้ให้
        และให้คุณกลับมาติดตามสถานะเองได้
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: target });
        }}
      >
        <button
          type="submit"
          className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-pearl text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
        >
          <GoogleMark />
          เข้าสู่ระบบด้วย Google
        </button>
      </form>

      <p className="mt-5 text-fine text-ink-48">
        เราขอจากบัญชี Google ของคุณแค่ชื่อและอีเมลเท่านั้น
        ไม่มีสิทธิ์อ่านอีเมลหรือไฟล์ใน Google Drive ของคุณ
      </p>

      <Link
        href="/"
        className="mt-8 self-start text-caption text-accent-ink underline underline-offset-4"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
