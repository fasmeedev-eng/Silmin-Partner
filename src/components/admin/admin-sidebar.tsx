"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Inbox, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";

const ITEMS = [
  { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, adminOnly: false, badge: false },
  { href: "/admin", label: "คิวใบสมัคร", icon: Inbox, adminOnly: false, badge: true },
  { href: "/admin/users", label: "ผู้ใช้และบทบาท", icon: Users, adminOnly: true, badge: false },
  { href: "/admin/permissions", label: "สิทธิ์พนักงาน", icon: ShieldCheck, adminOnly: true, badge: false },
] as const;

export function AdminSidebar({
  role,
  email,
  name,
  signOutButton,
  pendingCount,
}: {
  role: Role;
  email: string;
  name: string;
  /** ฟอร์มออกจากระบบถูกส่งมาจาก layout เพราะเป็น server action ที่ client component สร้างเองไม่ได้ */
  signOutButton: React.ReactNode;
  /** จำนวนใบสถานะ New — ตัวเลขจริงจากฐานข้อมูล ดึงใน layout ฝั่งเซิร์ฟเวอร์แล้วส่งลงมา */
  pendingCount: number;
}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  // "/admin" ต้องเทียบแบบเป๊ะ ไม่งั้นมันจะถูกไฮไลต์ค้างตอนอยู่หน้าลูกทุกหน้า
  // หน้ารายละเอียดใบสมัคร (/admin/SG-…) นับเป็นส่วนหนึ่งของคิวงานโดยตั้งใจ
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/SG-")
      : pathname.startsWith(href);

  return (
    <aside className="border-b border-white/[0.08] bg-nav text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      {/* จอเล็กเรียงเป็นสองแถว จอใหญ่เป็นแถบข้าง — เมนูสี่อันตัดบรรทัดปนกับชื่อผู้ใช้แล้วอ่านยาก */}
      <div className="flex flex-col lg:h-full lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-4 px-6 py-3 lg:px-2 lg:py-0">
          <Link
            href="/"
            aria-label="SG Partner — กลับหน้าแรก"
            className="rounded-sm focus-visible:outline-accent"
          >
            <BrandLogo tone="dark" />
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="min-w-0 text-right">
              <p className="truncate text-fine text-white/70">{name || email}</p>
              <p className="truncate text-fine text-white/45">{ROLE_LABELS[role]}</p>
            </div>
            {signOutButton}
          </div>
        </div>

        <nav
          aria-label="เมนูหลังบ้าน"
          className="flex gap-1 overflow-x-auto px-4 pb-2 lg:mt-7 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // ตัวที่เปิดอยู่เป็นแดง — ตรงกับ "active state = แดง" ของแถบนำทางหน้าบ้าน
                // และเป็นเม็ดเล็ก ไม่ใช่พื้นที่ใหญ่ จึงไม่กลายเป็นแดงท่วมจอสำหรับคนที่เปิดทั้งวัน
                className={`inline-flex min-h-[48px] shrink-0 items-center gap-3 rounded-btn px-3.5 text-caption font-medium transition-colors lg:w-full ${
                  active
                    ? "bg-brand text-on-brand"
                    : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={2} />
                <span className="flex-1">{item.label}</span>
                {/* ตัวเลขงานค้างเห็นได้จากทุกหน้าในหลังบ้าน ไม่ต้องกลับไปเปิดคิวเพื่อรู้ว่ามีของใหม่
                    ซ่อนเมื่อเป็นศูนย์ — ป้าย "0" ไม่ได้บอกอะไรนอกจากกินที่ */}
                {item.badge && pendingCount > 0 ? (
                  <span
                    className={`ml-2 shrink-0 text-fine font-semibold tabular-nums ${active ? "text-white/85" : "text-white/45"}`}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* กลุ่มบัญชีอยู่ท้ายแถบ แยกจากเมนูด้วยเส้นบาง — ตอบคนละคำถามกัน (ไปหน้าไหน vs ใครกำลังใช้)
            อักษรย่อในวงกลมช่วยให้เจ้าหน้าที่ที่ใช้เครื่องร่วมกันเห็นได้ทันทีว่ากำลังล็อกอินเป็นใคร
            พับด้วย <details> ไม่ใช่ state เพราะปุ่มออกจากระบบข้างในเป็น server action */}
        <div className="mt-auto hidden border-t border-white/[0.08] pt-5 lg:block">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-btn px-2 py-2 transition-colors hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold text-on-brand"
              >
                {(name || email).charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-caption font-semibold text-white/90">
                  {name || email}
                </span>
                <span className="block truncate text-fine text-white/45">{ROLE_LABELS[role]}</span>
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-white/45 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-2 px-2">
              <p className="truncate pb-2 text-fine text-white/45">{email}</p>
              {signOutButton}
            </div>
          </details>

          <p className="mt-5 border-t border-white/[0.08] pt-4 text-fine text-white/35">
            © {new Date().getFullYear()} SG Partner
          </p>
        </div>
      </div>
    </aside>
  );
}
