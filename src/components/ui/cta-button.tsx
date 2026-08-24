import Link from "next/link";
import type { ReactNode } from "react";

export type CtaVariant =
  | "primary"
  | "secondary"
  | "nav"
  | "nav-ghost"
  | "nav-brand"
  | "brand"
  | "brand-outline";

// whitespace-nowrap: ป้ายปุ่มภาษาไทยห้ามตัดบรรทัด — บนแถบนำทางที่สูงคงที่ การตัดคำทำให้ปุ่มสูงเกินแถบ
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 ease-out";

const pill =
  "min-h-[52px] rounded-full px-7 text-body active:scale-[0.98] motion-reduce:active:scale-100";

/* ปุ่มของภาษาดีไซน์หน้าแรก — สี่เหลี่ยมมุมมน 14px คนละไวยากรณ์กับปุ่มแคปซูลของหน้าแอปโดยตั้งใจ
   hover ยกตัวขึ้น 2px พร้อมเงา เป็น micro-interaction เดียวที่ปุ่มมี ไม่มีการเปลี่ยนขนาดหรือหมุน */
const rect =
  "min-h-[56px] rounded-btn px-7 text-body font-semibold active:translate-y-0 active:scale-[0.99] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";
const navRect =
  "min-h-[46px] rounded-btn px-5 text-caption font-semibold active:scale-[0.98] motion-reduce:active:scale-100";

const variants: Record<CtaVariant, string> = {
  // ปุ่มหลักของหน้าแอป — accent เหลืองเดียวของระบบ ไม่มีเงา
  primary: `${pill} bg-accent text-on-accent hover:bg-accent-hover`,
  // ปุ่มรอง — พื้น pearl ให้ยังอ่านออกเมื่อวางบนพื้น parchment
  secondary: `${pill} bg-pearl text-ink ring-1 ring-hairline ring-inset hover:bg-canvas`,
  // ปุ่มบนแถบนำทางแบบเดิม — วงโฟกัสต้องเป็นเหลือง เพราะ --accent-focus (เหลืองเข้ม) จมบนพื้นดำ
  nav: "min-h-[44px] rounded-full px-5 text-caption text-white ring-1 ring-white/30 ring-inset hover:bg-white/10 focus-visible:outline-accent",
  // บนแถบนำทาง วงโฟกัสใช้ขาว — ทั้งเหลืองเข้มและแดงจมหายบนพื้นดำเหมือนกัน
  "nav-ghost": `${navRect} text-white/90 ring-1 ring-white/20 ring-inset hover:bg-white/[0.08] hover:text-white hover:ring-white/35 focus-visible:outline-white`,
  "nav-brand": `${navRect} bg-brand text-on-brand hover:bg-brand-hover focus-visible:outline-white`,
  brand: `${rect} bg-brand text-on-brand shadow-soft hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lift`,
  "brand-outline": `${rect} bg-canvas text-ink ring-1 ring-hairline ring-inset hover:-translate-y-0.5 hover:shadow-soft hover:ring-ink-48/40`,
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
