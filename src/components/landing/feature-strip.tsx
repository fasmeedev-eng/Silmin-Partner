import { Headset, ShieldCheck, TrendingUp, Wallet } from "lucide-react";

/**
 * แถบสรุปสี่จุดเด่น ลอยคร่อมรอยต่อท้ายแบนเนอร์
 *
 * สลับแดง/เหลืองเพื่อให้อ่านเป็นสี่ก้อนแยกกันตั้งแต่ยังไม่ทันอ่านตัวหนังสือ ไม่ใช่เพื่อความสวย —
 * ถ้าใช้สีเดียวกันทั้งสี่ ไอคอนจะกลายเป็นลายพรมที่สายตากวาดข้ามไปทั้งแถบ
 *
 * ตัวอักษรบนชิปเหลืองเป็นสีดำ ไม่ใช่ขาว — ขาวบน #FFD84D ได้คอนทราสต์แค่ ~1.5:1
 * ส่วนขาวบนแดง #EF2027 ได้ ~4.5:1 จึงใช้ขาวได้ ความไม่สมมาตรตรงนี้เป็นเรื่องของสีจริง ไม่ใช่ความพลาด
 */
const FEATURES = [
  {
    icon: TrendingUp,
    tone: "brand",
    title: "เพิ่มยอดขาย",
    detail: "ช่วยขยายฐานลูกค้า",
  },
  {
    icon: Wallet,
    tone: "gold",
    title: "แผนผ่อนหลากหลาย",
    detail: "สร้างความแตกต่างให้ร้าน",
  },
  {
    icon: Headset,
    tone: "brand",
    title: "ทีมงานดูแลใกล้ชิด",
    detail: "พร้อมช่วยเหลือทุกขั้นตอน",
  },
  {
    icon: ShieldCheck,
    tone: "gold",
    title: "ปลอดภัย มั่นใจได้",
    detail: "ข้อมูลของคุณได้รับการคุ้มครอง",
  },
] as const;

export function FeatureStrip() {
  return (
    <div className="relative mx-auto w-full max-w-[1280px] px-6 lg:px-8">
      <ul className="grid grid-cols-1 gap-y-1 rounded-t-card bg-canvas px-6 py-7 shadow-soft ring-1 ring-hairline/60 sm:grid-cols-2 sm:gap-y-4 sm:px-8 lg:grid-cols-4 lg:gap-y-0">
        {FEATURES.map(({ icon: Icon, tone, title, detail }, index) => (
          <li
            key={title}
            className={`flex items-center gap-4 py-3 sm:py-1 lg:px-7 ${
              index > 0 ? "lg:border-l lg:border-hairline" : "lg:pl-0"
            } ${index === FEATURES.length - 1 ? "lg:pr-0" : ""}`}
          >
            <span
              aria-hidden
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                tone === "brand" ? "bg-brand text-on-brand" : "bg-gold text-[#0a0a0a]"
              }`}
            >
              <Icon className="size-[22px]" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-body font-semibold text-ink">{title}</span>
              <span className="mt-0.5 block text-caption text-ink-48">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
