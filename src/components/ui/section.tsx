import type { ReactNode } from "react";

type Tone = "canvas" | "tint" | "tile";

/**
 * ตัวคั่นส่วนคือการเปลี่ยนสีพื้นเต็มความกว้าง ไม่ใช้เส้นขอบหรือเงา
 *
 * จังหวะของหน้าแรกคือ tint → canvas → tint → tile → canvas → tile
 * สลับอ่อน/ขาว/ดำ เพื่อให้เลื่อนแล้วรู้สึกว่าเปลี่ยนเรื่อง โดยไม่ต้องขีดเส้นบอก
 */
const tones: Record<Tone, string> = {
  canvas: "bg-canvas text-ink",
  tint: "surface-tint text-ink",
  tile: "bg-nav text-white",
};

export function Section({
  tone = "canvas",
  id,
  children,
  className = "",
}: {
  tone?: Tone;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    // scroll-mt กันหัวข้อไปซ่อนใต้แถบนำทางที่ sticky อยู่ เวลากดลิงก์ #id จากเมนู
    <section id={id} className={`scroll-mt-20 ${tones[tone]} ${className}`}>
      {/* คอนเทนเนอร์เดียวกับแถบนำทางและแบนเนอร์ (1280) ทุกส่วนของหน้าจึงชิดขอบซ้ายเส้นเดียวกัน */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-8 lg:py-28">
        {children}
      </div>
    </section>
  );
}

/**
 * หัวข้อของส่วน
 *
 * ไม่มี eyebrow/kicker เหนือหัวข้อโดยตั้งใจ — ป้ายเล็ก ๆ ที่พูดซ้ำสิ่งที่หัวข้อพูดอยู่แล้ว
 * (เช่น "ก่อนเริ่ม" เหนือ "เตรียมไว้ 3 อย่าง…") ไม่ได้เพิ่มข้อมูลอะไร มีแต่เพิ่มบรรทัดให้อ่าน
 * ข้อความที่เคยอยู่ใน eyebrow ถูกย้ายเข้าไปอยู่ในหัวข้อจริงเมื่อมันมีความหมาย
 */
export function SectionHeading({
  title,
  lead,
  tone = "light",
}: {
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div>
      <h2 className="max-w-[24ch] text-h3 font-bold leading-[1.32] sm:text-h2">
        {title}
      </h2>
      {lead ? (
        <p
          className={`mt-5 max-w-[56ch] text-lead ${
            tone === "dark" ? "text-on-dark-muted" : "text-ink-80"
          }`}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
