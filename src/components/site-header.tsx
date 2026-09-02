import Link from "next/link";
import { Calculator, LayoutDashboard, LogOut, SquarePen, Tags, UserRound } from "lucide-react";
import { auth, signOut } from "@/auth";
import { AuthCta } from "@/components/auth/auth-cta";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ctaClass } from "@/components/ui/cta-button";
import { countUnread, listNotifications } from "@/lib/db/notifications";
import type { Role } from "@/lib/auth/roles";

/**
 * แถบนำทางดึงการแจ้งเตือนของตัวเอง ไม่รับมาเป็น prop — ไม่งั้นทุกหน้าที่ใช้แถบนี้ (เจ็ดหน้า)
 * ต้องจำไว้ว่าต้องส่งมาด้วย และหน้าที่ลืมจะได้กระดิ่งว่างเปล่าโดยไม่มีอะไรเตือน
 * auth() ถูกแคชต่อ request อยู่แล้ว การเรียกซ้ำจากตรงนี้จึงไม่เพิ่มงาน
 */
export async function SiteHeader({
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
   * แสดงเมนูลิงก์ไปยังส่วนต่าง ๆ ของหน้าแรก — ค่าเริ่มต้นปิด เพราะหน้าที่ผู้ใช้กำลังทำงานอยู่
   * (กรอกใบสมัคร ติดตามสถานะ) เมนูการตลาดตรงนั้นเป็นสิ่งรบกวน เปิดได้บนหน้าอื่นด้วยถ้าอยากได้แถบ
   * แบบเดียวกับหน้าแรกเป๊ะ ๆ (เช่น /partner/calculator)
   *
   * ลิงก์ชุดนี้อยู่ในแฮมเบอร์เกอร์ทุกความกว้าง ไม่กางบนแถบ รายการที่ active จริงตาม path +
   * แฮชปัจจุบัน (ดู use-active-section.ts ผ่าน MobileNav) —
   * หน้าอื่นที่ไม่ใช่ "/" เลยจะไม่มีรายการไหน active เพราะไม่มี section ไหนอยู่ในจอจริง ๆ
   */
  sectionNav?: boolean;
}) {
  // เจ้าหน้าที่ต้องมีทางเข้าหลังบ้านที่กดได้ ไม่ใช่ต้องจำ URL เอง
  const isStaff = role === "admin" || role === "employee";
  // ปุ่มกลุ่มนี้โผล่บนแถบเฉพาะ lg ขึ้นไป — ต้องรู้ก่อนว่ามีอะไรจะโผล่บ้าง เพื่อวาดเส้นคั่นให้ถูก
  // และส่งชุดเดียวกันไปให้แผงมือถือ (ซึ่งกันซ้ำเองด้วย lg:hidden ในปุ่มแต่ละอัน)
  const showBackOfficeLink = isStaff && !sectionNav;
  const hasUtilityLinks = showBackOfficeLink || isActivePartner;

  const session = signedIn ? await auth() : null;
  const notifications = session?.user?.id
    ? {
        items: await listNotifications(session.user.id),
        unread: await countUnread(session.user.id),
      }
    : null;

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
        // relative ตรงนี้เป็น containing block ของแผงแฮมเบอร์เกอร์ (ดู MobileNav)
        // จอมือถือแผงกาง inset-x-0 = เต็มความกว้างแถบ ซึ่งก็คือเต็มจอ เพราะ 1280 ยังไม่บีบ
        // จอ sm ขึ้นไปแผงเปลี่ยนเป็นการ์ดสั้น ๆ เกาะขอบขวาของคอนเทนเนอร์นี้ ตรงกับปุ่มแฮมเบอร์เกอร์พอดี
        className="relative mx-auto flex h-20 w-full max-w-[1280px] items-center gap-8 px-6 lg:px-8"
      >
        <Link
          href="/"
          aria-label="SG PLUS Partner — กลับหน้าแรก"
          className="rounded-sm focus-visible:outline-white"
        >
          <BrandLogo tone="dark" />
        </Link>

        {/* ลิงก์ไปหมวดต่าง ๆ ของหน้าแรกไม่กางบนแถบอีกแล้ว — อยู่ในแฮมเบอร์เกอร์ทุกความกว้าง
            ตามที่ผู้ใช้กำหนด (ดู MobileNav breakpoint="always" ด้านล่าง) แถบจึงเหลือแค่โลโก้
            กับกลุ่มปุ่มลงมือทำ และงบความกว้างที่เคยต้องวัดทุกครั้งที่เพิ่มของก็หมดปัญหาไปด้วย */}

        <div className="ml-auto flex items-center gap-3">
          {signedIn ? (
            <>
              {/* เมนูใช้งาน (หลังบ้าน/คำนวณผ่อน) โผล่จาก lg เท่านั้น ไม่ใช่ sm — จอแท็บเล็ต
                  (640–1023) มีตัวเลือกอื่นในแถบอยู่แล้ว (ใบสมัครของฉัน/กระดิ่ง/บัญชี) ถ้าโผล่ตั้งแต่
                  sm ทุกอย่างจะเบียดกันจนอ่านเป็นแถวเดียวไม่ออกกลุ่ม ต่ำกว่า lg ไปอยู่ในแฮมเบอร์เกอร์แทน
                  (ดู MobileNav — แต่ละปุ่มกันการโผล่ซ้ำเองด้วย lg:hidden)

                  บนหน้าแรก "หลังบ้าน" ไม่ขึ้นบนแถบเลยไม่ว่าจอกว้างแค่ไหน (ยังอยู่ในแฮมเบอร์เกอร์เท่านั้น)
                  เพราะไม่ใช่สิ่งที่คนมาหน้าแรกกำลังมองหา (เดิมมีเหตุผลเรื่องพื้นที่ด้วย
                  แต่พอลิงก์หมวดย้ายเข้าแฮมเบอร์เกอร์แล้ว เหลือเหตุผลเรื่องความตั้งใจอย่างเดียว) */}
              {hasUtilityLinks ? (
                <div className="hidden items-center gap-2 lg:flex">
                  {showBackOfficeLink ? (
                    <Link href="/admin" className={ctaClass("nav-ghost")}>
                      <LayoutDashboard aria-hidden className="size-4" />
                      หลังบ้าน
                    </Link>
                  ) : null}
                  {/* สองปุ่มนี้เห็นเฉพาะร้านที่เป็นพาร์ทเนอร์แล้ว (isActivePartner) — เงื่อนไขเดียวกับ
                      ที่ guardPartnerAccess ใช้กันหน้า /partner/* จริง ๆ ซ่อนปุ่มเฉย ๆ ไม่ใช่การกันสิทธิ์ */}
                  {isActivePartner ? (
                    <>
                      <Link href="/partner/products" className={ctaClass("nav-ghost")}>
                        <Tags aria-hidden className="size-4" />
                        สินค้าราคาจัด
                      </Link>
                      <Link href="/partner/calculator" className={ctaClass("nav-ghost")}>
                        <Calculator aria-hidden className="size-4" />
                        คำนวณผ่อนมือถือ
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* เส้นคั่นกลุ่มที่สอง — แยก "เครื่องมือใช้งาน" ออกจาก "ปุ่มหลัก" ให้เห็นเป็นสองกลุ่ม
                  ไม่ใช่แถวปุ่มยาวเส้นเดียว โผล่พร้อมกลุ่มที่มันคั่นเท่านั้น ไม่งั้นจะเหลือเส้นคั่นลอย ๆ */}
              {hasUtilityLinks ? (
                <span aria-hidden className="hidden h-7 w-px bg-white/15 lg:block" />
              ) : null}

              {/* ซ่อนด้วย wrapper ไม่ใช่คลาสบนปุ่มเอง (ctaClass ใส่ inline-flex มาแล้ว — เติม hidden
                  เข้าไปตรง ๆ คือ display สองค่าชนกัน ผลลัพธ์เดาไม่ได้ ดูเหตุผลเดียวกันที่ปุ่ม
                  "เข้าสู่ระบบ" ด้านล่าง) จอมือถือ (ต่ำกว่า sm) ปุ่มนี้ย้ายไปอยู่ในแฮมเบอร์เกอร์แทน
                  เพราะบนจอแคบมันแย่งที่กับกระดิ่ง/บัญชี — ดู MobileNav actions ด้านล่าง */}
              <div className="hidden sm:block">
                <AuthCta signedIn href="/me" variant="nav-brand">
                  <SquarePen aria-hidden className="size-4" />
                  ใบสมัครของฉัน
                </AuthCta>
              </div>

              {/* กลุ่มบัญชีแยกจากปุ่มหลักด้วยเส้นคั่น — สองกลุ่มนี้ตอบคนละคำถาม
                  (จะไปหน้าไหน vs กำลังใช้บัญชีใคร) คนที่มีหลาย Google account ต้องเห็นอีเมล */}
              <span aria-hidden className="hidden h-7 w-px bg-white/15 sm:block" />

              {notifications ? (
                <NotificationBell
                  initialItems={notifications.items}
                  initialUnread={notifications.unread}
                  tone="dark"
                />
              ) : null}

              <div className="hidden items-center gap-1.5 rounded-full p-1 ring-1 ring-inset ring-white/15 sm:flex">
                {email ? (
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold text-on-brand"
                  >
                    {email.charAt(0).toUpperCase()}
                  </span>
                ) : null}
                {/* หน้าที่เปิด sectionNav โชว์แค่อักษรย่อ ไม่กางอีเมลบนแถบ — อีเมลเต็มอยู่ใน
                    แผงแฮมเบอร์เกอร์แล้ว (ดู actions ด้านล่าง) กางซ้ำบนแถบด้วยคือของซ้ำ
                    หน้าอื่นไม่มีแผงนั้นให้พึ่ง จึงกางเต็มบนแถบตั้งแต่ xl */}
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
              {/* จอมือถือ (ต่ำกว่า sm) ไม่โชว์ปุ่มนี้เลย — หน้าแรกมี StickyCta ปักไว้ล่างจอมือถือ
                  อยู่แล้ว (ดู page.tsx: "เว้นที่ด้านล่างให้แถบ CTA ติดขอบจอมือถือ") ปุ่มเดียวกันสองที่
                  พร้อมกันบนจอแคบเป็นของซ้ำ ไม่ใช่ทางเลือก ซ่อนด้วย wrapper ไม่ใช่คลาสบนปุ่มเอง
                  ด้วยเหตุผลเดียวกับปุ่ม "เข้าสู่ระบบ" ด้านบน (ctaClass ใส่ inline-flex มาแล้ว) */}
              <div className="hidden sm:block">
                <AuthCta signedIn={false} href="/apply" variant="nav-brand">
                  <SquarePen aria-hidden className="size-4" />
                  สมัครเป็นพาร์ทเนอร์
                </AuthCta>
              </div>
            </>
          )}

          {/* แผงมือถือขึ้นเมื่อมีอะไรต้องเก็บจริง ๆ เท่านั้น — ลูกค้าที่ล็อกอินอยู่มีอย่างน้อย
              "ใบสมัครของฉัน" ที่ย้ายไปเก็บตอนจอมือถือเสมอ (ดู threshold ด้านล่าง) ผู้ที่ยังไม่ล็อกอิน
              และไม่ใช่หน้าแรกไม่มีอะไรต้องเก็บเลยไม่ควรเห็นไอคอนแฮมเบอร์เกอร์ที่กดแล้วไม่มีอะไรอยู่ข้างใน */}
          {sectionNav || signedIn ? (
            <MobileNav
              showSectionLinks={sectionNav}
              // จุดที่แผงต้องเริ่มรับช่วง เลือกจากของที่ "หนักที่สุด" ที่มันเก็บอยู่:
              // ลิงก์หมวดของหน้าแรก (ทุกความกว้าง) > ปุ่มใช้งานหลังบ้าน/คำนวณผ่อน (lg)
              // > แค่ "ใบสมัครของฉัน" (sm)
              breakpoint={sectionNav ? "always" : hasUtilityLinks ? "lg" : "sm"}
              actions={
                <>
                  {isStaff ? (
                    <Link
                      href="/admin"
                      className={ctaClass("nav-ghost", `w-full ${sectionNav ? "" : "lg:hidden"}`)}
                    >
                      <LayoutDashboard aria-hidden className="size-4" />
                      หลังบ้าน
                    </Link>
                  ) : null}
                  {isActivePartner ? (
                    <>
                      <Link
                        href="/partner/products"
                        className={ctaClass("nav-ghost", "w-full lg:hidden")}
                      >
                        <Tags aria-hidden className="size-4" />
                        สินค้าราคาจัด
                      </Link>
                      <Link
                        href="/partner/calculator"
                        className={ctaClass("nav-ghost", "w-full lg:hidden")}
                      >
                        <Calculator aria-hidden className="size-4" />
                        คำนวณผ่อนมือถือ
                      </Link>
                    </>
                  ) : null}
                  {/* ปุ่มหลักย้ายมาที่นี่เฉพาะจอมือถือ (ต่ำกว่า sm) — sm:hidden กันไม่ให้ซ้ำกับ
                      ตัวที่โผล่บนแถบแล้วตั้งแต่ sm ขึ้นไป (ดู wrapper ของปุ่มนี้ด้านบน) */}
                  {signedIn ? (
                    <Link href="/me" className={ctaClass("nav-brand", "w-full sm:hidden")}>
                      <SquarePen aria-hidden className="size-4" />
                      ใบสมัครของฉัน
                    </Link>
                  ) : null}
                  {/* อีเมล/ออกจากระบบ อยู่ในแผงเฉพาะหน้าแรก — หน้าอื่นมีกลุ่มบัญชีโชว์อยู่แล้วตั้งแต่ sm */}
                  {/* sm:px-3.5 เท่ากับ padding ของรายการลิงก์ในการ์ดดรอปดาวน์ ไม่งั้นบรรทัดอีเมล
                      จะเยื้องซ้ายกว่าทุกอย่างในการ์ด 14px ซึ่งเห็นชัดเพราะการ์ดกว้างแค่ 20rem */}
                  {sectionNav && signedIn && email ? (
                    <p className="truncate pt-1 text-fine text-white/45 sm:px-3.5 sm:pb-0.5">
                      {email}
                    </p>
                  ) : null}
                  {sectionNav && signedIn ? signOutButton : null}
                  {/* sm:hidden กันซ้ำกับปุ่มเดียวกันที่โผล่บนแถบตั้งแต่ sm ขึ้นไป
                      เดิมไม่ต้องกัน เพราะทั้งแผงถูกซ่อนที่ xl อยู่แล้ว แต่ตอนนี้แผงอยู่ทุกความกว้าง */}
                  {sectionNav && !signedIn ? (
                    <AuthCta
                      signedIn={false}
                      href="/me"
                      loginRedirect="/after-login"
                      variant="nav-ghost"
                      className="w-full sm:hidden"
                    >
                      <UserRound aria-hidden className="size-4" />
                      เข้าสู่ระบบ
                    </AuthCta>
                  ) : null}
                </>
              }
            />
          ) : null}
        </div>
      </nav>
    </header>
  );
}
