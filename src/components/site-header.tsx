import Link from "next/link";
import { Calculator, LogOut, SquarePen, UserRound } from "lucide-react";
import { signOut } from "@/auth";
import { AuthCta } from "@/components/auth/auth-cta";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileNav } from "@/components/mobile-nav";
import { SECTION_LINKS } from "@/components/nav-links";
import { ctaClass } from "@/components/ui/cta-button";
import type { Role } from "@/lib/auth/roles";

export function SiteHeader({
  signedIn,
  email,
  role,
  isActivePartner,
  sectionNav = false,
}: {
  signedIn: boolean;
  email?: string | null;
  role?: Role;
  /** ร้านมีใบสมัครถึงสถานะ ActivePartner แล้ว (หรือ admin) — เปิดปุ่มเครื่องคำนวณผ่อนบน navbar */
  isActivePartner?: boolean;
  /**
   * แสดงเมนูลิงก์ไปยังส่วนต่าง ๆ ของหน้าแรก — เปิดเฉพาะหน้าแรกเท่านั้น
   * หน้าอื่น (กรอกใบสมัคร ติดตามสถานะ) ผู้ใช้กำลังทำงานอยู่ เมนูการตลาดตรงนั้นเป็นสิ่งรบกวน
   * และเพราะเปิดเฉพาะหน้าแรก จึงรู้ได้เลยว่า "หน้าหลัก" คือรายการที่ active โดยไม่ต้องอ่าน pathname
   * (ซึ่งจะบังคับให้คอมโพเนนต์นี้กลายเป็น client component และเสีย server action ของปุ่มออกจากระบบ)
   */
  sectionNav?: boolean;
}) {
  // เจ้าหน้าที่ต้องมีทางเข้าหลังบ้านที่กดได้ ไม่ใช่ต้องจำ URL เอง
  const isStaff = role === "admin" || role === "employee";

  // server action สร้างที่นี่แล้วส่งลงไปเป็น element เพราะ MobileNav เป็น client component
  const signOutButton = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className={ctaClass("nav-ghost", "w-full")}>
        <LogOut aria-hidden className="size-4" />
        ออกจากระบบ
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-9999 border-b border-white/[0.08] bg-nav text-white">
      <nav
        aria-label="เมนูหลัก"
        className="relative mx-auto flex h-20 w-full max-w-[1280px] items-center gap-6 px-6 lg:px-8"
      >
        <Link
          href="/"
          aria-label="SG Partner — กลับหน้าแรก"
          className="rounded-sm focus-visible:outline-white"
        >
          <BrandLogo tone="dark" />
        </Link>

        {sectionNav ? (
          // เมนูเต็มโผล่ที่ xl (1280) ไม่ใช่ lg (1024) — คอนเทนเนอร์ตันที่ 1280 อยู่แล้ว
          // ที่ 1024 พื้นที่เหลือไม่พอวางเมนูห้ารายการคู่กับปุ่มฝั่งขวาโดยไม่ล้น (วัดแล้ว)
          // ช่วง 1024–1279 จึงใช้แฮมเบอร์เกอร์ ซึ่งเป็นพฤติกรรมปกติของแท็บเล็ตอยู่แล้ว
          <ul className="ml-auto hidden items-center gap-7 xl:flex">
            {SECTION_LINKS.map(({ href, label }, index) => {
              // แถบนี้เปิด sectionNav เฉพาะหน้าแรก รายการแรกจึงเป็นหน้าที่เปิดอยู่เสมอ
              const current = index === 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={`group relative inline-flex h-20 items-center whitespace-nowrap text-caption font-medium transition-colors focus-visible:outline-white ${
                      current ? "text-brand" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {label}
                    {/* ขีดใต้เมนูโตจากซ้ายไปขวาตอน hover — ตัวที่ active ขีดค้างไว้ตลอด */}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-6 h-[2px] origin-left rounded-full bg-brand transition-transform duration-300 ease-out ${
                        current ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div
          className={`ml-auto flex items-center gap-2.5 ${sectionNav ? "xl:ml-8" : ""}`}
        >
          {signedIn ? (
            <>
              {/* ซ่อน/แสดงด้วย wrapper ไม่ใช่คลาสบนตัวปุ่มเอง — ctaClass ใส่ inline-flex มาแล้ว
                  การเติม hidden เข้าไปในคลาสเดียวกันคือ display สองค่าชนกัน ผลลัพธ์ขึ้นกับ
                  ลำดับที่ Tailwind ปล่อย utility ออกมา ไม่ใช่ลำดับที่เขียน จึงเดาไม่ได้

                  บนหน้าแรกไม่แสดงปุ่มนี้บนแถบ (ยังอยู่ในเมนูแฮมเบอร์เกอร์) — พื้นที่ถูกเมนูห้ารายการ
                  กินไปแล้ว และ "หลังบ้าน" ไม่ใช่สิ่งที่คนมาหน้าแรกกำลังมองหา หน้าอื่นแสดงตามปกติ */}
              {isStaff && !sectionNav ? (
                <div className="hidden sm:block">
                  <Link href="/admin" className={ctaClass("nav-ghost")}>
                    หลังบ้าน
                  </Link>
                </div>
              ) : null}

              {/* เฉพาะร้านที่เป็นพาร์ทเนอร์แล้วเท่านั้น (หรือ admin) — ดู isActivePartnerUser */}
              {isActivePartner ? (
                <div className="hidden sm:block">
                  <Link href="/partner/calculator" className={ctaClass("nav-ghost")}>
                    <Calculator aria-hidden className="size-4" />
                    <span className="hidden sm:inline">คำนวณผ่อนมือถือ</span>
                  </Link>
                </div>
              ) : null}

              <AuthCta signedIn href="/me" variant="nav-brand">
                <SquarePen aria-hidden className="size-4" />
                <span className="hidden sm:inline">ใบสมัครของฉัน</span>
              </AuthCta>

              {/* กลุ่มบัญชีแยกจากเมนูใช้งานด้วยเส้นคั่น — สองกลุ่มนี้ตอบคนละคำถาม
                  (จะไปหน้าไหน vs กำลังใช้บัญชีใคร) คนที่มีหลาย Google account ต้องเห็นอีเมล */}
              <span aria-hidden className="mx-0.5 hidden h-7 w-px bg-white/15 sm:block" />

              <div className="hidden items-center gap-1.5 rounded-full p-1 ring-1 ring-inset ring-white/15 sm:flex">
                {email ? (
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold text-on-brand"
                  >
                    {email.charAt(0).toUpperCase()}
                  </span>
                ) : null}
                {/* หน้าแรกโชว์แค่อักษรย่อ ไม่โชว์อีเมล — เมนูห้ารายการกินความกว้างไปแล้ว
                    หน้าอื่นที่ไม่มีเมนูนั้นมีที่พอ จึงกางอีเมลเต็มได้ */}
                {email && !sectionNav ? (
                  <span className="hidden max-w-[15ch] truncate pl-0.5 text-fine text-white/70 xl:inline">
                    {email}
                  </span>
                ) : null}

                {/* server action — ไม่ต้องพึ่ง JS ฝั่ง client และได้ CSRF ของ NextAuth มาในตัว */}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    aria-label="ออกจากระบบ"
                    title="ออกจากระบบ"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
                  >
                    <LogOut aria-hidden className="size-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:block">
                <AuthCta
                  signedIn={false}
                  href="/me"
                  loginRedirect="/after-login"
                  variant="nav-ghost"
                >
                  <UserRound aria-hidden className="size-4" />
                  เข้าสู่ระบบ
                </AuthCta>
              </div>
              <AuthCta signedIn={false} href="/apply" variant="nav-brand">
                <SquarePen aria-hidden className="size-4" />
                <span className="hidden sm:inline">สมัครเป็นพาร์ทเนอร์</span>
                <span className="sm:hidden">สมัคร</span>
              </AuthCta>
            </>
          )}

          {sectionNav ? (
            <MobileNav
              actions={
                signedIn ? (
                  <>
                    {isStaff ? (
                      <Link href="/admin" className={ctaClass("nav-ghost", "w-full")}>
                        หลังบ้าน
                      </Link>
                    ) : null}
                    {isActivePartner ? (
                      <Link
                        href="/partner/calculator"
                        className={ctaClass("nav-ghost", "w-full")}
                      >
                        <Calculator aria-hidden className="size-4" />
                        คำนวณผ่อนมือถือ
                      </Link>
                    ) : null}
                    {email ? (
                      <p className="truncate pt-1 text-fine text-white/45">{email}</p>
                    ) : null}
                    {signOutButton}
                  </>
                ) : (
                  <AuthCta
                    signedIn={false}
                    href="/me"
                    loginRedirect="/after-login"
                    variant="nav-ghost"
                    className="w-full"
                  >
                    <UserRound aria-hidden className="size-4" />
                    เข้าสู่ระบบ
                  </AuthCta>
                )
              }
            />
          ) : null}
        </div>
      </nav>
    </header>
  );
}
