"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SECTION_LINKS } from "./nav-links";

/**
 * เมนูจอเล็กของแถบนำทาง
 *
 * เป็น client component เพราะต้องเก็บสถานะเปิด/ปิดและปิดตัวเองเมื่อกด Esc หรือเปลี่ยนหน้า
 * ส่วนปุ่มที่ต้องใช้ server action (ออกจากระบบ) รับเข้ามาทาง prop `actions` แทนที่จะสร้างที่นี่
 * — client component สร้าง server action เองไม่ได้ ต้องให้ฝั่ง server เรนเดอร์มาให้แล้วส่งลงมา
 */
export function MobileNav({ actions }: { actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อเปลี่ยนหน้า ไม่งั้นเมนูจะค้างคาหน้าจอทับเนื้อหาของหน้าใหม่
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // แตะนอกแผงถือว่าตั้งใจปิด — เป็นพฤติกรรมที่คนคาดหวังจากเมนูแบบดรอปดาวน์
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        className="inline-flex size-11 items-center justify-center rounded-btn text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-white"
      >
        {open ? (
          <X aria-hidden className="size-5" />
        ) : (
          <Menu aria-hidden className="size-5" />
        )}
      </button>

      {/* แผงกางเต็มความกว้างใต้แถบ ไม่ใช่ดรอปดาวน์แคบ ๆ — บนมือถือ เป้ากดกว้างเต็มจอกดง่ายกว่ามาก */}
      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="nav-panel-in absolute inset-x-0 top-full border-t border-white/10 bg-nav px-6 pb-6 pt-2"
      >
        <ul>
          {SECTION_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center border-b border-white/[0.07] text-body font-medium text-white/85 transition-colors hover:text-white"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {actions ? <div className="mt-5 flex flex-col gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}
