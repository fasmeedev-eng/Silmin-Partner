import Image from "next/image";
import sgMark from "./sg-mark.png";

/**
 * โลโก้ SG Partner — เครื่องหมาย + ชื่อ
 *
 * ไฟล์ภาพ import แบบ static ไม่ใช่อ้างด้วย path สตริง เพื่อให้ Next รู้ขนาดจริงของภาพตั้งแต่ตอน
 * build (กัน layout shift) และใส่ hash ให้ชื่อไฟล์เอง ภาพเป็น PNG โปร่งใสจริง (~70% ของพื้นที่)
 * จึงวางบนแถบดำได้โดยไม่มีกรอบขาว
 *
 * priority: โลโก้อยู่บนสุดของทุกหน้าเสมอ ถ้าปล่อยให้ lazy-load มันจะกะพริบตอนเข้าหน้าแรก
 *
 * tone="dark" ใช้บนพื้นดำ (แถบนำทาง/ท้ายหน้า) — ต่างกันแค่สีตัวอักษร ตัวเครื่องหมายใช้ไฟล์เดียวกัน
 * เพราะไล่เฉดทอง→แดงของมันอ่านออกดีทั้งบนขาวและบนดำอยู่แล้ว
 */
export function BrandLogo({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <Image
        src={sgMark}
        alt=""
        priority
        className="h-9 w-auto"
        sizes="40px"
      />
      <span className="flex items-baseline gap-2">
        <span
          className={`text-h3 font-bold leading-none tracking-tight ${
            tone === "dark" ? "text-white" : "text-ink"
          }`}
        >
          SG
        </span>
        <span
          className={`text-fine font-semibold uppercase leading-none tracking-[0.2em] ${
            tone === "dark" ? "text-white/50" : "text-ink-48"
          }`}
        >
          partner
        </span>
      </span>
    </span>
  );
}
