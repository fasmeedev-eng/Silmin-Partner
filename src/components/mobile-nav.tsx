"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SECTION_LINKS } from "./nav-links";
import { isSectionLinkActive, useActiveSectionId } from "./use-active-section";

/**
 * เมนูแบบแฮมเบอร์เกอร์ของแถบนำทาง — ใช้ทุกหน้า ไม่ใช่แค่จอเล็ก
 *
 * เดิมคอมโพเนนต์นี้เป็น "เมนูจอเล็ก" ล้วน ๆ ตัวเปิดแผงจะหายไปเมื่อจอกว้างพอให้เมนูเต็มกางบนแถบได้
 * ตอนนี้ลิงก์ไปหมวดต่าง ๆ ของหน้าแรก (หน้าหลัก / ขั้นตอนการสมัคร / คำถามที่พบบ่อย / ติดต่อเรา)
 * ย้ายมาอยู่ในแผงนี้ **ทุกความกว้าง** ตามที่ผู้ใช้กำหนด แถบจึงเหลือแค่โลโก้กับปุ่มลงมือทำ
 * และ breakpoint="always" คือโหมดที่ตัวเปิดแผงไม่หายไปที่จอไหนเลย
 *
 * ผลพลอยได้ที่ตั้งใจ: งบความกว้างของแถบไม่ตึงอีกต่อไป เดิมต้องวัดแล้ววัดอีกว่าเมนูสี่รายการ
 * บวกกลุ่มปุ่มฝั่งขวาล้น 1280 หรือยัง (ดู CLAUDE.md หัวข้อ nav width budget)
 *
 * ปุ่มในแผงที่ "จอกว้างพอจะเห็นอยู่แล้วนอกแผง" ต้องห่อด้วย lg:hidden / sm:hidden ที่ตัวมันเอง
 * (ไม่ใช่ที่นี่) เพราะตอนนี้ตัวเปิดแผงอยู่ทุกความกว้าง ปุ่มที่ไม่กันซ้ำจะโผล่พร้อมกันสองที่
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
   * "lg" คู่กับปุ่มใช้งาน (หลังบ้าน/คำนวณผ่อน),
   * "sm" ตอนแผงมีแค่ปุ่ม "ใบสมัครของฉัน" ที่ย้ายมาเก็บเฉพาะจอมือถือ
   * "always" = ไม่มีเมนูเต็มบนแถบเลย ตัวเปิดแผงอยู่ทุกความกว้าง — ใช้กับหน้าที่เปิด sectionNav
   *
   * "xl" ถูกถอดออกแล้ว: เดิมมีไว้คู่กับแถวลิงก์สี่รายการที่กางบนแถบตั้งแต่ 1280 ขึ้นไป
   * ตอนนี้ลิงก์ชุดนั้นอยู่ในแฮมเบอร์เกอร์ทุกความกว้าง จึงไม่มีอะไรรอ xl อีกต่อไป
   */
  breakpoint?: "sm" | "lg" | "always";
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

  // "always" = ไม่ซ่อนที่ความกว้างไหนเลย ตัวเปิดแผงจึงอยู่ครบทุกจอ
  const hiddenClass =
    breakpoint === "always" ? "" : breakpoint === "lg" ? "lg:hidden" : "sm:hidden";

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

      {/* แผงมีสองรูปทรง เพราะสองความกว้างนี้ต้องการคนละอย่างจริง ๆ

          มือถือ (< sm): แถบกางเต็มความกว้างใต้แถบนำทาง แถวละเต็มบรรทัด สูง 52px มีเส้นคั่น
          — นิ้วโป้งต้องการเป้ากดใหญ่ และการ์ดลอยเล็ก ๆ บนจอ 390px คือการเสียพื้นที่เปล่า

          sm ขึ้นไป: การ์ดดรอปดาวน์กว้าง 20rem ห้อยใต้ปุ่มแฮมเบอร์เกอร์ มุมมน เงา shadow-lift
          — แถบดำพาดเต็มจอ 1920px เพื่อลิงก์สี่รายการคือสิ่งที่ทำให้หน้าเว็บดูไม่เป็นมืออาชีพ
          รูปทรงนี้ตรงกับดรอปดาวน์กระดิ่งแจ้งเตือนบนแถบเดียวกัน (ต่างแค่พื้นดำ/ขาว) จึงอ่านเป็นระบบเดียวกัน
          right-6 / lg:right-8 เท่ากับ padding ของ <nav> พอดี ขอบขวาการ์ดจึงตรงกับขอบขวาปุ่มที่กดเปิดมัน */}
      <div
        id="mobile-nav-panel"
        hidden={!open}
        className={
          "nav-panel-in absolute inset-x-0 top-full border-t border-white/10 bg-nav px-6 pb-6 pt-2 " +
          "sm:inset-x-auto sm:right-6 sm:top-[calc(100%+10px)] sm:w-[20rem] sm:rounded-card " +
          "sm:border-t-0 sm:p-2.5 sm:shadow-lift sm:ring-1 sm:ring-white/10 lg:right-8"
        }
      >
        {showSectionLinks ? (
          <ul>
            {SECTION_LINKS.map(({ href, label }) => {
              const current = isSectionLinkActive(href, activeId);
              return (
                <li key={href}>
                  {/* มือถือ: แถวเต็มบรรทัดมีเส้นคั่น / sm ขึ้นไป: รายการเมนูมุมมนที่ไฮไลต์ตอน hover
                      เส้นคั่นถูกถอดออกบนเดสก์ท็อป เพราะในการ์ดเล็ก ๆ เส้นสี่เส้นทำให้ดูรกกว่าที่ควร
                      ตัวที่ active ยังเป็นสีแบรนด์เหมือนกันทั้งสองแบบ */}
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-[52px] items-center border-b border-white/[0.07] text-body font-medium transition-colors sm:min-h-[44px] sm:rounded-input sm:border-b-0 sm:px-3.5 sm:text-caption ${
                      current
                        ? "text-brand"
                        : "text-white/85 hover:text-white sm:hover:bg-white/[0.08]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* บนเดสก์ท็อปต้องมีเส้นคั่นระหว่างลิงก์กับปุ่ม เพราะสองกลุ่มนี้ทำคนละหน้าที่
            (ไปหมวดไหนของหน้า vs ลงมือทำอะไร) และในการ์ดแคบ ๆ ถ้าไม่คั่นจะอ่านเป็นกองเดียว */}
        {actions ? (
          <div
            className={`flex flex-col gap-2.5 ${
              showSectionLinks
                ? "mt-5 sm:mt-1.5 sm:gap-1.5 sm:border-t sm:border-white/[0.08] sm:pt-2.5"
                : "pt-2 sm:pt-0"
            }`}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
