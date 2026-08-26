"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SECTION_LINKS } from "./nav-links";
import { isSectionLinkActive, useActiveSectionId } from "./use-active-section";

/**
 * เมนูจอเล็กของแถบนำทาง — ใช้ทุกหน้า ไม่ใช่แค่หน้าแรก
 *
 * เดิมคอมโพเนนต์นี้ถูกเรียกเฉพาะตอน sectionNav (หน้าแรก) เพราะมีแต่หน้าแรกที่ล้นก่อน xl
 * แต่พอปุ่ม "หลังบ้าน"/"คำนวณผ่อนมือถือ" ย้ายมาโผล่ที่ lg แทน sm (ดู site-header.tsx)
 * ทุกหน้าก็ต้องมีที่ทางให้ปุ่มพวกนี้ไปอยู่ตอนจอแคบกว่า lg เหมือนกัน — จึงรับ `breakpoint`
 * และ `showSectionLinks` เข้ามาแทนการ hardcode xl ไว้ตัวเดียว
 *
 * ปุ่มในแผงที่ "จอกว้างพอจะเห็นอยู่แล้วนอกแผง" ต้องห่อด้วย lg:hidden ที่ตัวมันเอง (ไม่ใช่ที่นี่)
 * เพราะช่วง lg–xl บนหน้าแรก ตัวเปิดแผงยังโผล่อยู่ (รอ xl ของเมนูห้ารายการ) แต่ปุ่มพวกนั้นย้ายออก
 * ไปอยู่นอกแผงแล้วที่ lg — ถ้าไม่กันซ้ำ กดเปิดแผงช่วงนั้นจะเห็นปุ่มเดิมซ้อนสองที่
 */
export function MobileNav({
  actions,
  showSectionLinks = false,
  breakpoint = "lg",
}: {
  actions?: ReactNode;
  /** แสดงลิงก์ไปหมวดต่าง ๆ ของหน้าแรก — เปิดเฉพาะตอน sectionNav (หน้าแรก) เท่านั้น */
  showSectionLinks?: boolean;
  /**
   * จุดที่เมนูเต็มโผล่แทนตัวเปิดแผงนี้ — เลือกตามของที่ "หนักที่สุด" ที่แผงต้องเก็บ:
   * "xl" คู่กับเมนูห้ารายการของหน้าแรก, "lg" คู่กับปุ่มใช้งาน (หลังบ้าน/คำนวณผ่อน),
   * "sm" ตอนแผงมีแค่ปุ่ม "ใบสมัครของฉัน" ที่ย้ายมาเก็บเฉพาะจอมือถือ
   */
  breakpoint?: "sm" | "lg" | "xl";
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const activeId = useActiveSectionId();

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

  const hiddenClass =
    breakpoint === "xl" ? "xl:hidden" : breakpoint === "lg" ? "lg:hidden" : "sm:hidden";

  return (
    <div ref={panelRef} className={hiddenClass}>
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
        {showSectionLinks ? (
          <ul>
            {SECTION_LINKS.map(({ href, label }) => {
              const current = isSectionLinkActive(href, activeId);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-[52px] items-center border-b border-white/[0.07] text-body font-medium transition-colors ${
                      current ? "text-brand" : "text-white/85 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {actions ? (
          <div
            className={`flex flex-col gap-2.5 ${showSectionLinks ? "mt-5" : "pt-2"}`}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
