"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Inbox,
  Layers,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Smartphone,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly: boolean;
  badge: boolean;
  /** กลุ่มที่มีเมนูย่อย — ตัวแม่เป็นปุ่มพับ/กาง ไม่ใช่ลิงก์ เพราะ /admin/pricing ไม่มีหน้าของตัวเอง
   *  ปุ่มที่กดแล้วไปหน้า 404 แย่กว่าปุ่มที่กดแล้วกางรายการ */
  children?: readonly Omit<NavItem, "children">[];
}

const ITEMS: readonly NavItem[] = [
  { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, adminOnly: false, badge: false },
  { href: "/admin", label: "คิวใบสมัคร", icon: Inbox, adminOnly: false, badge: true },
  {
    href: "/admin/pricing",
    label: "การจัดการราคาจัด",
    icon: Tags,
    adminOnly: true,
    badge: false,
    children: [
      {
        href: "/admin/pricing/categories",
        label: "จัดการประเภทสินค้า",
        icon: Layers,
        adminOnly: true,
        badge: false,
      },
      {
        href: "/admin/pricing/products",
        label: "จัดการสินค้าราคาจัด",
        icon: Smartphone,
        adminOnly: true,
        badge: false,
      },
    ],
  },
  { href: "/admin/users", label: "ผู้ใช้และบทบาท", icon: Users, adminOnly: true, badge: false },
  { href: "/admin/permissions", label: "สิทธิ์พนักงาน", icon: ShieldCheck, adminOnly: true, badge: false },
];

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
  const [open, setOpen] = useState(false);

  // ปิดลิ้นชักเมื่อเปลี่ยนหน้า ไม่งั้นลิ้นชักจะค้างคาทับหน้าใหม่
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // "/admin" ต้องเทียบแบบเป๊ะ ไม่งั้นมันจะถูกไฮไลต์ค้างตอนอยู่หน้าลูกทุกหน้า
  // หน้ารายละเอียดใบสมัคร (/admin/SG-…) นับเป็นส่วนหนึ่งของคิวงานโดยตั้งใจ
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/SG-")
      : pathname.startsWith(href);

  // ตัวที่เปิดอยู่เป็นแดง — ตรงกับ "active state = แดง" ของแถบนำทางหน้าบ้าน
  // และเป็นเม็ดเล็ก ไม่ใช่พื้นที่ใหญ่ จึงไม่กลายเป็นแดงท่วมจอสำหรับคนที่เปิดทั้งวัน
  const itemClass = (active: boolean, nested = false) =>
    `flex min-h-[48px] w-full items-center gap-3 rounded-btn text-caption font-medium transition-colors ${
      nested ? "pl-11 pr-3.5" : "px-3.5"
    } ${active ? "bg-brand text-on-brand" : "text-white/70 hover:bg-white/[0.08] hover:text-white"}`;

  const renderLink = (item: Omit<NavItem, "children">, nested = false) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={itemClass(active, nested)}
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
  };

  const navList = (
    <nav aria-label="เมนูหลังบ้าน" className="flex flex-col gap-1">
      {ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) =>
        item.children ? <NavGroup key={item.href} item={item} renderLink={renderLink} /> : renderLink(item),
      )}
    </nav>
  );

  const accountBlock = (
    <div className="mt-auto border-t border-white/[0.08] pt-5">
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
        © {new Date().getFullYear()} SG PLUS Partner
      </p>
    </div>
  );

  return (
    <>
      {/* แถบบนจอแคบกว่า lg — โลโก้ + ปุ่มเปิดเมนูเท่านั้น เมนูจริงทั้งชุด (ทั้งรายการและบัญชี)
          ย้ายไปอยู่ในลิ้นชักที่กดเปิดแทน แถวไอคอนเลื่อนแนวนอนแบบเดิม เพราะจอแคบกว่า lg
          ไม่พอวางสี่รายการให้อ่านออกพร้อมกันโดยไม่ต้องเลื่อน ลิ้นชักที่กดเปิดคือ <aside> ตัวเดียวกับ
          แถบข้างของจอกว้าง แค่สลับ fixed/translate ตาม breakpoint — เนื้อหาข้างในจึงไม่มีวันเพี้ยนจากกัน */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-nav px-6 py-3 text-white lg:hidden">
        <Link
          href="/"
          aria-label="SG PLUS Partner — กลับหน้าแรก"
          className="rounded-sm focus-visible:outline-accent"
        >
          <BrandLogo tone="dark" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-sidebar-panel"
          aria-label="เปิดเมนู"
          className="inline-flex size-11 items-center justify-center rounded-btn text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </div>

      {/* ฉากหลังคลิกปิด — คลุมทั้งจอยกเว้นแถบที่เปิดอยู่ โผล่เฉพาะตอนลิ้นชักเปิดและจอแคบกว่า lg */}
      {open ? (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        id="admin-sidebar-panel"
        className={`fixed inset-y-0 left-0 z-50 w-72 -translate-x-full border-r border-white/[0.08] bg-nav text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          {/* โลโก้ของจอกว้าง — จอแคบมีโลโก้อยู่บนแถบด้านนอกแล้ว ในลิ้นชักจึงมีแต่ปุ่มปิดแทน */}
          <div className="hidden px-2 lg:block">
            <Link
              href="/"
              aria-label="SG PLUS Partner — กลับหน้าแรก"
              className="rounded-sm focus-visible:outline-accent"
            >
              <BrandLogo tone="dark" />
            </Link>
          </div>
          <div className="mb-2 flex items-center justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิดเมนู"
              className="inline-flex size-11 items-center justify-center rounded-btn text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <div className="mt-3 lg:mt-7">{navList}</div>

          {accountBlock}
        </div>
      </aside>
    </>
  );
}

/**
 * กลุ่มเมนูที่มีรายการย่อย
 *
 * ตัวแม่เป็นปุ่มพับ/กาง ไม่ใช่ลิงก์ เพราะ /admin/pricing ไม่มีหน้าของตัวเอง
 * กางอัตโนมัติเมื่อกำลังอยู่ในหน้าลูก ไม่งั้นคนที่กดลิงก์เข้ามาตรง ๆ จากที่อื่นจะเห็นเมนูพับอยู่
 * แล้วหาไม่เจอว่าตัวเองอยู่ตรงไหนของโครงสร้าง
 *
 * ตัวแม่ **ไม่** เป็นสีแดงตอนที่ลูกทำงานอยู่ — แดงหนึ่งจอควรมีที่เดียว ถ้าทั้งแม่และลูกแดง
 * สายตาจะอ่านว่ามีสองหน้าเปิดอยู่พร้อมกัน ตัวแม่ใช้แค่ตัวอักษรขาวเต็มบอกว่า "อยู่ในกลุ่มนี้"
 */
function NavGroup({
  item,
  renderLink,
}: {
  item: NavItem;
  renderLink: (child: Omit<NavItem, "children">, nested?: boolean) => React.ReactNode;
}) {
  const pathname = usePathname();
  const children = item.children ?? [];
  const hasActiveChild = children.some((child) => pathname.startsWith(child.href));
  const [open, setOpen] = useState(hasActiveChild);

  // เปลี่ยนหน้าเข้ามาในกลุ่มนี้แล้วต้องกางเอง แต่ไม่บังคับพับกลับเมื่อออกไปหน้าอื่น —
  // ถ้าผู้ใช้กางไว้เองแล้วโดนพับปิดตอนกดไปหน้าอื่น จะรู้สึกเหมือนเมนูขัดขืน
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const Icon = item.icon;
  const panelId = `nav-group-${item.href.replace(/\//g, "-")}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex min-h-[48px] w-full items-center gap-3 rounded-btn px-3.5 text-caption font-medium transition-colors ${
          hasActiveChild ? "text-white" : "text-white/70"
        } hover:bg-white/[0.08] hover:text-white`}
      >
        <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div id={panelId} hidden={!open} className="mt-1 flex flex-col gap-1">
        {children.map((child) => renderLink(child, true))}
      </div>
    </div>
  );
}
