"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ShieldCheck, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";

const ITEMS = [
  { href: "/admin", label: "คิวใบสมัคร", icon: Inbox, adminOnly: false },
  { href: "/admin/users", label: "ผู้ใช้และบทบาท", icon: Users, adminOnly: true },
  { href: "/admin/permissions", label: "สิทธิ์พนักงาน", icon: ShieldCheck, adminOnly: true },
] as const;

export function AdminSidebar({
  role,
  email,
  name,
  signOutButton,
}: {
  role: Role;
  email: string;
  name: string;
  /** ฟอร์มออกจากระบบถูกส่งมาจาก layout เพราะเป็น server action ที่ client component สร้างเองไม่ได้ */
  signOutButton: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  // "/admin" ต้องเทียบแบบเป๊ะ ไม่งั้นมันจะถูกไฮไลต์ค้างตอนอยู่หน้าลูกทุกหน้า
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/SG-") : pathname.startsWith(href);

  return (
    <aside className="border-b border-hairline bg-nav text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-b-0 lg:border-r">
      {/* จอเล็กเรียงเป็นสองแถว จอใหญ่เป็นแถบข้าง — เมนูสามอันตัดบรรทัดปนกับชื่อผู้ใช้แล้วอ่านยาก */}
      <div className="flex flex-col lg:h-full lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-4 px-6 py-3 lg:px-0 lg:py-0">
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
          className="flex gap-1 overflow-x-auto px-4 pb-2 lg:mt-6 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-3 rounded-md px-3 text-caption transition-colors ${
                  active ? "bg-accent text-on-accent" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-white/15 pt-4 lg:block">
          <p className="truncate text-fine text-white/70">{name || email}</p>
          <p className="truncate text-fine text-white/45">{ROLE_LABELS[role]}</p>
          <div className="mt-2">{signOutButton}</div>
        </div>
      </div>
    </aside>
  );
}
