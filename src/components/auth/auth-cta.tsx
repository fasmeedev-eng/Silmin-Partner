"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ctaClass, type CtaVariant } from "@/components/ui/cta-button";
import { useLoginDialog } from "./login-dialog";

/**
 * ปุ่มที่รู้ว่าผู้ใช้เข้าสู่ระบบแล้วหรือยัง
 * ยังไม่เข้าสู่ระบบ → เปิด popup ตรงนั้นเลย ไม่เด้งออกจากหน้า ผู้ใช้ไม่เสียบริบทที่กำลังอ่าน
 * เข้าสู่ระบบแล้ว → เป็นลิงก์ธรรมดา
 */
export function AuthCta({
  signedIn,
  href,
  loginRedirect,
  variant = "primary",
  className = "",
  children,
}: {
  signedIn: boolean;
  /** ปลายทางเมื่อผู้ใช้ล็อกอินอยู่แล้ว */
  href: string;
  /** ปลายทางหลังเพิ่งล็อกอินเสร็จ ถ้าไม่ระบุจะใช้ href
   *  แยกกันเพราะบางปุ่มต้องแยกทางตามบทบาทซึ่งรู้ได้หลังล็อกอินเท่านั้น */
  loginRedirect?: string;
  variant?: CtaVariant;
  className?: string;
  children: ReactNode;
}) {
  const openLogin = useLoginDialog();

  if (signedIn) {
    return (
      <Link href={href} className={ctaClass(variant, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openLogin(loginRedirect ?? href)}
      className={ctaClass(variant, className)}
    >
      {children}
    </button>
  );
}
