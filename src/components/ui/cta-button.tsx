import Link from "next/link";
import type { ReactNode } from "react";

export type CtaVariant = "primary" | "secondary" | "nav";

const base =
  "inline-flex items-center justify-center gap-2 transition-colors duration-200";

const pill =
  "min-h-[52px] rounded-full px-7 text-body active:scale-[0.98] motion-reduce:active:scale-100";

const variants: Record<CtaVariant, string> = {
  // ปุ่มหลัก — accent เดียวของทั้งระบบ ไม่มีเงา
  primary: `${pill} bg-accent text-on-accent hover:bg-accent-hover`,
  // ปุ่มรอง — พื้น pearl ให้ยังอ่านออกเมื่อวางบนพื้น parchment
  secondary: `${pill} bg-pearl text-ink ring-1 ring-hairline ring-inset hover:bg-canvas`,
  // ปุ่มบนแถบนำทางสีดำ — วงโฟกัสต้องเป็นเหลือง เพราะ --accent-focus (เหลืองเข้ม) จมบนพื้นดำ
  nav: "min-h-[44px] rounded-full px-5 text-caption text-white ring-1 ring-white/30 ring-inset hover:bg-white/10 focus-visible:outline-accent",
};

export function ctaClass(variant: CtaVariant, extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function CtaButton({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: CtaVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={ctaClass(variant, className)}>
      {children}
    </Link>
  );
}
