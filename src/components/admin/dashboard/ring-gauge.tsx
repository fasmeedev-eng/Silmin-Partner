/**
 * วงแหวนสัดส่วนพร้อมตัวเลขเปอร์เซ็นต์ตรงกลาง
 *
 * วาดด้วย SVG ตรง ๆ ไม่พึ่งไลบรารีกราฟ — ทั้งหน้ามีกราฟสามแบบและทุกแบบเป็นรูปทรงคงที่
 * การลากไลบรารีเข้ามาแลกกับ bundle ฝั่งเบราว์เซอร์ทั้งก้อนไม่คุ้ม และคอมโพเนนต์นี้
 * เป็น server component ล้วน ไม่มี JS ไปถึงผู้ใช้เลย
 */

const SIZE = 56;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function RingGauge({
  share,
  color,
  label,
}: {
  /** 0–1 */
  share: number;
  /** ค่าสีสำหรับ stroke — ส่งเป็น var(--…) จากโทเคนของระบบ */
  color: string;
  /** อ่านให้เครื่องอ่านหน้าจอฟัง ตัวเลขในวงแหวนเป็นภาพประกอบเท่านั้น */
  label: string;
}) {
  const clamped = Math.max(0, Math.min(1, share));
  const percent = Math.round(clamped * 100);

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${label} ${percent}%`}
        // หมุนให้เริ่มนับที่ 12 นาฬิกา ไม่ใช่ 3 นาฬิกาแบบค่าตั้งต้นของ SVG
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--divider-soft)"
          strokeWidth={STROKE}
        />
        {clamped > 0 ? (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRC * clamped} ${CIRC}`}
          />
        ) : null}
      </svg>
      <span
        aria-hidden
        className="absolute text-[11px] font-semibold tabular-nums text-ink-80"
      >
        {percent}%
      </span>
    </span>
  );
}
