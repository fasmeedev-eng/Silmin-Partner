import type { TypeSlice } from "@/lib/db/dashboard";

/**
 * โดนัทแบ่งตามประเภทร้าน
 *
 * ต้นแบบใช้โทนน้ำเงินสำหรับชิ้นรอง ๆ ซึ่งเป็นสีที่ระบบนี้ไม่มี — พาเลตต์คือขาว/ดำ/ทอง/แดง
 * (ดู DESIGN.md) การเติมน้ำเงินเข้ามาที่นี่จะทำให้การ์ดใบเดียวในทั้งระบบมีสีที่ห้าโผล่มา
 * จึงไล่เฉดจากแดง → ทอง → ดำ → เทา แทน ซึ่งยังแยกชิ้นออกจากกันได้ครบและอยู่ในภาษาเดิม
 *
 * ลำดับสีผูกกับลำดับใน SHOP_TYPES ไม่ใช่ลำดับตามจำนวน สีของ "ร้านมือถือ" จึงคงที่ทุกวัน
 */
const SLICE_COLORS = [
  "var(--brand)",
  "var(--gold)",
  "var(--nav)",
  "var(--ink-48)",
  "var(--hairline)",
];

const SIZE = 168;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function TypeDonut({ slices, total }: { slices: TypeSlice[]; total: number }) {
  if (total === 0 || slices.length === 0) {
    return (
      <p className="mt-8 rounded-input bg-pearl px-5 py-12 text-center text-caption text-ink-48">
        ยังไม่มีใบสมัครให้แบ่งกลุ่ม
      </p>
    );
  }

  let offset = 0;

  return (
    // วางโดนัทไว้บนแล้วคำอธิบายอยู่ล่างเสมอ ไม่วางเคียงข้างแบบต้นแบบ
    // ชื่อประเภทร้านภาษาไทยยาวกว่าคำในต้นแบบมาก ("ร้านมือถือและอุปกรณ์เสริม") วางข้างกัน
    // ในการ์ดกว้าง ~380px แล้วต้องตัดคำทิ้ง ซึ่งทำให้อ่านไม่รู้เรื่องว่าเป็นประเภทไหน
    <div className="mt-6 flex flex-col items-center gap-6">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`แบ่งตามประเภทร้าน รวม ${total} ใบ`}
          className="-rotate-90"
        >
          {slices.map((slice, index) => {
            const length = CIRC * slice.share;
            const dash = `${length} ${CIRC - length}`;
            const circle = (
              <circle
                key={slice.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={SLICE_COLORS[index % SLICE_COLORS.length]}
                strokeWidth={STROKE}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return circle;
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span aria-hidden className="text-h3 font-bold tabular-nums text-ink">
            {total}
          </span>
          <span aria-hidden className="text-fine text-ink-48">
            รวมทั้งหมด
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-3">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-ink/[0.08]"
              style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 text-caption text-ink-80">{slice.label}</span>
            <span className="shrink-0 text-caption tabular-nums text-ink-48">
              <span className="font-semibold text-ink">{slice.count}</span>{" "}
              ({Math.round(slice.share * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
