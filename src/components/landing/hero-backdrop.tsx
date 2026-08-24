/**
 * ฉากหลังของแบนเนอร์ — แสงเหลือง/แดงฟุ้ง เส้นโค้งบาง และลายจุด
 *
 * เป้าหมายคือ "มีรายละเอียดเมื่อมองใกล้ แต่สะอาดเมื่อมองภาพรวม" ทุกชิ้นจึง opacity ต่ำมาก
 * และไม่มีชิ้นไหนที่ขอบคมพอจะแย่งสายตาไปจากหัวข้อหรือปุ่ม
 *
 * วาดเองทั้งหมด ไม่ใช้ไฟล์ภาพ จึงคมทุกความละเอียดหน้าจอและไม่เพิ่ม request
 * ทุกชิ้นเป็น aria-hidden + pointer-events-none — เป็นบรรยากาศล้วน ๆ ห้ามบังการกดของจริง
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* แสงเหลืองฟุ้งหลังมือถือ ให้เครื่องมีฉากหลังแทนที่จะลอยบนพื้นขาวเปล่า */}
      <div
        className="absolute -right-32 -top-20 hidden size-[620px] rounded-full blur-[90px] lg:block"
        style={{ background: "color-mix(in oklab, var(--gold) 26%, transparent)" }}
      />

      {/* แสงแดงฟุ้งมุมซ้ายล่าง ถ่วงน้ำหนักสีให้สมดุลกับเหลืองฝั่งขวา */}
      <div
        className="absolute -bottom-40 -left-40 size-[560px] rounded-full blur-[100px]"
        style={{ background: "color-mix(in oklab, var(--brand) 16%, transparent)" }}
      />

      {/* แดงจุดเล็กเข้มขึ้นอีกชั้นตรงมุม ให้ไล่เฉดมีจุดที่เข้มที่สุดจริง ๆ ไม่ใช่ฟุ้งเท่ากันหมด */}
      <div
        className="absolute -bottom-24 -left-24 size-[280px] rounded-full blur-[70px]"
        style={{ background: "color-mix(in oklab, var(--brand) 22%, transparent)" }}
      />

      {/* ลายจุดริมซ้าย — รายละเอียดที่เห็นเฉพาะตอนมองใกล้ */}
      <div
        className="absolute left-0 top-[28%] hidden h-[200px] w-[92px] lg:block"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--brand) 22%, transparent) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* เส้นโค้งบางสองเส้นกวาดจากล่างซ้ายขึ้นขวา ให้สายตาไหลจากหัวข้อไปหามือถือ */}
      <svg
        className="absolute inset-0 hidden size-full lg:block"
        viewBox="0 0 1440 820"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-120 760 C 260 700, 520 520, 780 300 C 960 148, 1180 60, 1460 30"
          stroke="var(--brand)"
          strokeOpacity="0.12"
          strokeWidth="1.5"
        />
        <path
          d="M-120 830 C 300 790, 600 620, 860 380 C 1040 214, 1240 130, 1520 108"
          stroke="var(--gold-deep)"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
