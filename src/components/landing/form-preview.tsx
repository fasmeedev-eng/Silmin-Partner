/**
 * ภาพตัวอย่างฟอร์มบนมือถือ — เป็น SVG ล้วน ไม่มีไฟล์ภาพภายนอก
 * ใช้ตัวแปรสีจาก globals.css จึงเปลี่ยนตามธีมสว่าง/มืดเอง
 * นี่คือจุดเดียวในระบบที่อนุญาตให้ใช้เงา (คลาส product-shadow)
 */
export function FormPreview() {
  return (
    <svg
      viewBox="0 0 320 600"
      role="img"
      aria-label="ตัวอย่างหน้าจอใบสมัครบนมือถือ แสดงแถบความคืบหน้าขั้นที่ 2 จาก 7 ช่องกรอกชื่อร้าน เบอร์โทรศัพท์ จังหวัด และปุ่มถ่ายรูปหน้าร้าน"
      className="product-shadow h-auto w-full max-w-[300px] font-sans lg:max-w-[330px]"
    >
      {/* ตัวเครื่อง */}
      <rect
        x="3"
        y="3"
        width="314"
        height="594"
        rx="44"
        fill="var(--canvas)"
        stroke="var(--hairline)"
        strokeWidth="1.5"
      />
      <rect x="126" y="22" width="68" height="7" rx="3.5" fill="var(--divider-soft)" />

      {/* หัวข้อหน้า */}
      <text x="28" y="68" fontSize="15" fontWeight="600" fill="var(--ink)">
        ใบสมัครพาร์ทเนอร์
      </text>

      {/* ความคืบหน้า — บอกเสมอว่าอยู่ขั้นไหนและเหลืออีกกี่ขั้น */}
      <text x="28" y="100" fontSize="12" fill="var(--ink-48)">
        ขั้นที่ 2 จาก 7
      </text>
      <text x="292" y="100" fontSize="12" textAnchor="end" fill="var(--ink-48)">
        ข้อมูลผู้ติดต่อ
      </text>
      <rect x="28" y="110" width="264" height="5" rx="2.5" fill="var(--divider-soft)" />
      <rect x="28" y="110" width="75" height="5" rx="2.5" fill="var(--accent-ink)" />

      {/* ช่องกรอกที่กรอกแล้ว */}
      <text x="28" y="152" fontSize="12" fill="var(--ink-48)">
        ชื่อร้าน
      </text>
      <rect
        x="28"
        y="163"
        width="264"
        height="48"
        rx="11"
        fill="var(--pearl)"
        stroke="var(--hairline)"
      />
      <text x="44" y="192" fontSize="14" fill="var(--ink)">
        ABC Mobile
      </text>

      <text x="28" y="238" fontSize="12" fill="var(--ink-48)">
        เบอร์โทรศัพท์
      </text>
      <rect
        x="28"
        y="249"
        width="264"
        height="48"
        rx="11"
        fill="var(--pearl)"
        stroke="var(--hairline)"
      />
      <text x="44" y="278" fontSize="14" fill="var(--ink)">
        08X-XXX-XXXX
      </text>

      {/* ช่องที่กำลังโฟกัส — ขอบ accent */}
      <text x="28" y="324" fontSize="12" fill="var(--ink-48)">
        จังหวัด
      </text>
      <rect
        x="28"
        y="335"
        width="264"
        height="48"
        rx="11"
        fill="var(--canvas)"
        stroke="var(--accent-ink)"
        strokeWidth="2"
      />
      <text x="44" y="364" fontSize="14" fill="var(--ink)">
        กรุงเทพมหานคร
      </text>

      {/* พื้นที่อัปโหลดรูปหน้าร้าน */}
      <rect
        x="28"
        y="405"
        width="264"
        height="88"
        rx="11"
        fill="none"
        stroke="var(--hairline)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <g stroke="var(--ink-48)" strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M146 437h8l3-4h6l3 4h8a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-28a3 3 0 0 1-3-3v-14a3 3 0 0 1 3-3Z" />
        <circle cx="160" cy="447" r="6" />
      </g>
      <text x="160" y="481" fontSize="13" textAnchor="middle" fill="var(--ink-48)">
        แตะเพื่อถ่ายรูปหน้าร้าน
      </text>

      {/* ปุ่มหลัก */}
      {/* ปุ่มหลักใช้เหลืองแบรนด์เต็มพื้น ตัวอักษรสีเข้ม — เหลืองบนขาวใช้เป็น "พื้น" ได้ แต่ใช้เป็นตัวอักษรไม่ได้ */}
      <rect x="28" y="513" width="264" height="52" rx="26" fill="var(--accent)" />
      <text
        x="160"
        y="545"
        fontSize="15"
        fontWeight="600"
        textAnchor="middle"
        fill="var(--on-accent)"
      >
        ถัดไป
      </text>

      <rect x="125" y="578" width="70" height="4" rx="2" fill="var(--divider-soft)" />
    </svg>
  );
}
