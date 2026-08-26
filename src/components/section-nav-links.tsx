"use client";

import Link from "next/link";
import { SECTION_LINKS } from "./nav-links";
import { isSectionLinkActive, useActiveSectionId } from "./use-active-section";

/**
 * เมนูไปหมวดต่าง ๆ ของหน้าแรกบนแถบเดสก์ท็อป (xl ขึ้นไป) — แยกออกมาเป็น client component ต่างหาก
 * เพราะต้องรู้ว่ากำลังอยู่หมวดไหนจริง ๆ (ดู use-active-section.ts) SiteHeader ที่เรียกใช้ตัวนี้
 * ยังเป็น server component ได้ตามเดิม เพราะ sign-out server action ไม่ได้อยู่ในไฟล์นี้
 */
export function SectionNavLinks() {
  const activeId = useActiveSectionId();

  return (
    <ul className="ml-auto hidden items-center gap-7 xl:flex">
      {SECTION_LINKS.map(({ href, label }) => {
        const current = isSectionLinkActive(href, activeId);
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
  );
}
