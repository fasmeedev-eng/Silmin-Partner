import { Calculator, Percent } from "lucide-react";

/**
 * ภาพประกอบหัวหน้า — วาดเองด้วย CSS/ไอคอน ไม่ใช้ไฟล์ภาพ (เช่นเดียวกับ HeroBackdrop ของหน้าแรก)
 * เพื่อให้คมทุกความละเอียดและไม่เพิ่ม request ตัดที่ lg ลงมา เพราะบนจอแคบพื้นที่ควรเป็นของ
 * หัวข้อและช่องกรอกก่อน ไม่ใช่ภาพตกแต่ง
 */
export function CalculatorHeroArt() {
  return (
    <div aria-hidden className="relative hidden h-[220px] w-[260px] shrink-0 lg:block">
      <div
        className="absolute -right-6 -top-6 size-[220px] rounded-full blur-[70px]"
        style={{ background: "color-mix(in oklab, var(--gold) 30%, transparent)" }}
      />
      <div
        className="absolute -bottom-8 -left-4 size-[180px] rounded-full blur-[70px]"
        style={{ background: "color-mix(in oklab, var(--brand) 20%, transparent)" }}
      />

      <div className="absolute left-1/2 top-1/2 flex size-[150px] -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] items-center justify-center rounded-phone bg-nav shadow-device">
        <Calculator aria-hidden className="size-16 text-gold" strokeWidth={1.6} />
      </div>

      <span className="absolute right-2 top-6 flex size-14 items-center justify-center rounded-full bg-gold text-[22px] font-bold text-[#0a0a0a] shadow-lift">
        ฿
      </span>

      <span className="absolute bottom-4 left-0 flex size-12 items-center justify-center rounded-full bg-brand text-on-brand shadow-lift">
        <Percent aria-hidden className="size-5" strokeWidth={2.25} />
      </span>
    </div>
  );
}
