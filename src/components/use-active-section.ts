"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SECTION_LINKS } from "./nav-links";

/**
 * รู้ว่ากำลังอยู่หมวดไหนของหน้าแรกจริง ๆ ด้วย IntersectionObserver — ไม่ใช้ hashchange event
 * ลองแล้วใช้ไม่ได้จริง: Link ของ Next.js นำทางด้วย History API (pushState) ซึ่งไม่ยิง hashchange
 * แม้ location.hash จะเปลี่ยนค่าไปแล้วก็ตาม (ยืนยันด้วยการทดสอบจริงในเบราว์เซอร์ — กดเมนูแล้ว hash
 * เปลี่ยนถูกต้อง แต่ event ไม่ยิง ตัว active เลยไม่อัปเดต) วิธีนี้ยังได้ผลพลอยได้คือทำงานถูกต้อง
 * ทั้งตอนกดเมนูและตอนเลื่อนหน้าเอง ไม่ใช่แค่ตอนกด ซึ่งตรงกับพฤติกรรมที่คนคาดหวังจากเมนูแบบนี้อยู่แล้ว
 *
 * คืนค่าเป็น id เปล่า "" เมื่อไม่ใช่หน้าแรก (ไม่ใช้ null) — จงใจไม่ให้ปนกับ "ยังไม่ได้ observe"
 * เพราะ "" ไม่มีทางตรงกับ id ไหนใน SECTION_LINKS อยู่แล้ว ตัวเรียกจึงไม่ต้องแยกสองเคสนี้เอง
 * (บั๊กที่เจอจริง: ใช้ null แทนสองความหมายนี้ปนกัน ทำให้ "หน้าหลัก" ติด active แม้อยู่หน้า /apply)
 *
 * ไฟล์นี้แยกเป็น client อย่างเดียว (ไม่ import อะไรที่แตะ MongoDB/Drive) เพื่อให้ SiteHeader
 * (server component ที่มี sign-out server action ฝังอยู่) ยังคงเรียก MobileNav
 * ซึ่งเป็น client component ลูกได้ตามเดิม โดยตัวมันเองไม่ต้องกลายเป็น client
 */
export function useActiveSectionId(): string {
  const pathname = usePathname();
  // เริ่มที่ "top" ไว้ก่อน — ระหว่างรอ observer ยิงครั้งแรกบนหน้าแรก ให้ "หน้าหลัก" active
  // ไว้ก่อนเป็นค่าเริ่มต้นที่สมเหตุสมผลที่สุด effect ด้านล่างจะแก้ให้ถูกทันทีถ้าไม่ใช่กรณีนี้
  const [activeId, setActiveId] = useState("top");

  useEffect(() => {
    // หน้าอื่นที่ไม่ใช่ "/" เลย ไม่มี section ไหนอยู่ในจอจริง ๆ — เมนูพวกนี้ทำหน้าที่แค่
    // "กลับไปที่หมวดนี้ของหน้าแรก" ไม่ใช่ตำแหน่งปัจจุบัน จึงไม่มีรายการไหนควร active
    if (pathname !== "/") {
      setActiveId("");
      return;
    }
    setActiveId("top");

    const ids = SECTION_LINKS.map(({ href }) => href.split("#")[1]).filter(
      (id): id is string => Boolean(id),
    );
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // หมวดสุดท้าย ("ติดต่อเรา" = ท้ายหน้า) มักเตี้ยกว่าจอ (เป็นแค่ footer ไม่ใช่ section เต็มจอ
    // เหมือนหมวดอื่น) พอเลื่อนสุดล่างของหน้า มันจึงมีสัดส่วนที่โผล่ในกรอบน้อยกว่าหมวดก่อนหน้า
    // (เช่น "คำถามที่พบบ่อย") ที่ยังกินพื้นที่จอเหลืออยู่เยอะกว่า ทำให้ผลจาก IntersectionObserver
    // เลือกหมวดก่อนหน้าผิด ๆ ทั้งที่เลื่อนไปสุดตีนหน้าแล้วจริง ๆ — เช็กแยกว่าสุดหน้าหรือยัง
    // แล้วบังคับให้หมวดสุดท้ายชนะเสมอ ไม่ต้องพึ่งสัดส่วนที่ IntersectionObserver รายงาน
    const lastId = ids[ids.length - 1];
    const isAtBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAtBottom()) {
          setActiveId(lastId);
          return;
        }
        // เอาตัวที่โผล่มากที่สุดในกรอบมุมมอง ณ ตอนนั้น — กันเคสสอง section คาบเกี่ยวกันครึ่งจอ
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // เผื่อความสูงแถบนำทางแบบ sticky ด้านบน (80px) และนับเฉพาะโซนบนของจอเป็นหลัก
      { rootMargin: "-88px 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    elements.forEach((el) => observer.observe(el));

    // IntersectionObserver ยิงเฉพาะตอนสัดส่วนที่โผล่ของ element ที่ observe อยู่เปลี่ยน ไม่ใช่ทุกจุด
    // ที่เลื่อน — ถ้าเลื่อนถึงสุดล่างแล้วไม่มี element ไหนเปลี่ยนสัดส่วนอีก (นิ่งอยู่ตรงนั้น)
    // ก็จะไม่มีการยิงมาแก้ให้ ต้องมี scroll listener แยกไว้เช็กเช่นนี้โดยเฉพาะ
    const onScroll = () => {
      if (isAtBottom()) setActiveId(lastId);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return activeId;
}

/**
 * true เมื่อ href (รูปแบบ "/#id") ตรงกับหมวดที่กำลังอยู่จริง — เป็นฟังก์ชันธรรมดา ไม่ใช่ hook
 * เรียกใน .map() ได้ตามปกติ เพราะ useActiveSectionId ถูกเรียกครั้งเดียวที่ต้นคอมโพเนนต์แล้ว
 */
export function isSectionLinkActive(href: string, activeId: string): boolean {
  const linkId = href.includes("#") ? href.split("#")[1] : "";
  return linkId === activeId;
}
