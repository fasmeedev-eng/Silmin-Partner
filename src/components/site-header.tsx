import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { AuthCta } from "@/components/auth/auth-cta";
import type { Role } from "@/lib/auth/roles";

export function SiteHeader({
  signedIn,
  email,
  role,
}: {
  signedIn: boolean;
  email?: string | null;
  role?: Role;
}) {
  // เจ้าหน้าที่ต้องมีทางเข้าหลังบ้านที่กดได้ ไม่ใช่ต้องจำ URL เอง
  const isStaff = role === "admin" || role === "employee";

  return (
    <header className="sticky top-0 z-40 bg-nav text-white">
      <nav
        aria-label="เมนูหลัก"
        className="mx-auto flex h-14 w-full max-w-[1040px] items-center justify-between px-6 sm:px-8"
      >
        <Link
          href="/"
          className="text-caption font-semibold tracking-[0.02em] text-white"
        >
          silmin<span className="pl-1.5 font-normal text-white/60">partner</span>
        </Link>

        {signedIn ? (
          <div className="-mr-3 flex items-center gap-1 sm:gap-3">
            {/* บอกว่ากำลังใช้บัญชีไหนอยู่ — คนที่มีหลายบัญชี Google ต้องเห็นก่อนกรอกใบสมัคร */}
            {email ? (
              <span className="hidden max-w-[20ch] truncate text-fine text-white/50 sm:inline">
                {email}
              </span>
            ) : null}

            {isStaff ? (
              <Link
                href="/admin"
                className="inline-flex min-h-[44px] items-center rounded-full bg-accent px-5 text-caption font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                หลังบ้าน
              </Link>
            ) : null}

            <AuthCta signedIn href="/me" variant="nav">
              ใบสมัครของฉัน
            </AuthCta>

            {/* server action — ไม่ต้องพึ่ง JS ฝั่ง client และได้ CSRF ของ NextAuth มาในตัว */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-caption text-white/70 transition-colors hover:text-white"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          </div>
        ) : (
          <AuthCta
            signedIn={false}
            href="/me"
            loginRedirect="/after-login"
            variant="nav"
            className="-mr-1"
          >
            เข้าสู่ระบบ
          </AuthCta>
        )}
      </nav>
    </header>
  );
}
