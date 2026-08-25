import type { DailyPoint } from "@/lib/db/dashboard";

/**
 * กราฟเส้นสองชุดพร้อมพื้นไล่เฉด วาดด้วย SVG ล้วน ไม่มีไลบรารีและไม่มี JS ฝั่งเบราว์เซอร์
 *
 * สองเส้นตอบคนละคำถามและต้องอ่านคู่กัน:
 *   แดง = ใบที่ส่งเข้ามาต่อวัน (งานที่ไหลเข้า)
 *   ทอง = ใบที่เจ้าหน้าที่เปลี่ยนสถานะต่อวัน (งานที่ไหลออก)
 * ถ้าเส้นแดงอยู่เหนือเส้นทองติดกันหลายวัน แปลว่างานกำลังกองขึ้น ซึ่งเป็นสิ่งเดียว
 * ที่กราฟนี้มีไว้บอก การใส่ตัวเลขสะสมแทนจะซ่อนสัญญาณนี้ไปทั้งหมด
 *
 * ทั้งสองเส้นวัดจากฟิลด์จริง (submittedAt / statusChangedAt) ไม่ได้ประมาณจากอะไร
 */

// viewBox ตั้งให้ใกล้ขนาดที่เรนเดอร์จริง เพราะ SVG ย่อ/ขยายทั้งก้อนรวมตัวหนังสือด้วย
// viewBox ที่กว้างกว่าการ์ดมาก ๆ จะทำให้ป้ายแกนเหลือ 7px อ่านไม่ออก
const W = 480;
const H = 230;
const PAD = { top: 14, right: 10, bottom: 30, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

interface Point {
  x: number;
  y: number;
}

/** ปัดเพดานแกน Y ให้เป็นเลขกลม ๆ ที่หารด้วย 4 ลงตัว เส้นกริดจะได้ไม่มีทศนิยม */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const rough = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;
  return step * 4;
}

/**
 * เส้นโค้งแบบ monotone cubic (Fritsch–Carlson)
 *
 * ใช้แทน cardinal spline ธรรมดาเพราะ cardinal จะเหวี่ยงเลยจุดข้อมูล เช่นวันที่มี 0 ใบ
 * เส้นจะโค้งลงไปติดลบ ซึ่งบนกราฟนับจำนวนใบคือภาพที่เป็นไปไม่ได้ monotone รับประกัน
 * ว่าเส้นไม่แกว่งเกินค่าจริงระหว่างจุด
 */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx);
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    // จุดยอด/จุดต่ำสุดต้องมีความชันเป็นศูนย์ ไม่งั้นเส้นจะพุ่งเลยจุดนั้นไป
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  // จำกัดความชันตามเงื่อนไข Fritsch–Carlson เพื่อไม่ให้เส้นเลยกรอบระหว่างจุดสองจุด
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const magnitude = Math.hypot(a, b);
    if (magnitude > 3) {
      tangents[i] = ((3 * a) / magnitude) * slopes[i];
      tangents[i + 1] = ((3 * b) / magnitude) * slopes[i];
    }
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (points[i + 1].x - points[i].x) / 3;
    const c1x = points[i].x + dx;
    const c1y = points[i].y + tangents[i] * dx;
    const c2x = points[i + 1].x - dx;
    const c2y = points[i + 1].y - tangents[i + 1] * dx;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }
  return d;
}

const shortDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Bangkok",
});

export function TrendChart({ points }: { points: DailyPoint[] }) {
  const max = niceMax(
    Math.max(1, ...points.map((p) => Math.max(p.submitted, p.handled))),
  );

  const xAt = (index: number) =>
    PAD.left + (points.length <= 1 ? PLOT_W / 2 : (index / (points.length - 1)) * PLOT_W);
  const yAt = (value: number) => PAD.top + PLOT_H - (value / max) * PLOT_H;

  const series = [
    {
      key: "submitted" as const,
      label: "ใบสมัครใหม่",
      color: "var(--brand)",
      gradient: "trend-fill-submitted",
    },
    {
      key: "handled" as const,
      label: "เจ้าหน้าที่ดำเนินการ",
      color: "var(--gold-deep)",
      gradient: "trend-fill-handled",
    },
  ];

  const gridValues = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);

  // ป้ายแกน X มากกว่าเจ็ดอันบนกราฟกว้างเท่านี้จะทับกัน จึงเว้นระยะให้เหลือราวเจ็ดอันเสมอ
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const isEmpty = points.every((p) => p.submitted === 0 && p.handled === 0);
  // จุดบนเส้นช่วยให้อ่านค่ารายวันได้ แต่พอเกินราวสองสัปดาห์มันจะชิดกันจนกลายเป็นเส้นหนา
  // ช่วง 30/90 วันคนดูภาพรวมอยู่แล้ว ไม่ได้ไล่อ่านทีละวัน
  const showDots = points.length <= 14;

  return (
    <figure className="mt-5">
      <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-caption text-ink-80">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </figcaption>

      {/* จอแคบให้กล่องนี้เลื่อนแนวนอนเองแทนการบีบ SVG ลงไปอีก — SVG ย่อทั้งก้อนรวมตัวหนังสือ
          ต่ำกว่า ~420px ป้ายวันที่จะเหลือราว 8px ซึ่งอ่านไม่ออก กฎเดียวกับตารางท้ายหน้า
          เพดานล่างต้องไม่เกินความกว้างจริงของการ์ดที่ 2xl (~429px) ไม่งั้นจอกว้างจะมีแถบเลื่อนโผล่มาเฉย ๆ */}
      <div className="mt-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block w-full min-w-[420px] max-w-[720px]"
        role="img"
        aria-label={`กราฟรายวัน ${points.length} วัน — สูงสุด ${max} ใบต่อวัน`}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.gradient} id={s.gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.20" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(value)}
              y2={yAt(value)}
              stroke="var(--divider-soft)"
              strokeWidth="1"
              strokeDasharray={value === 0 ? undefined : "4 6"}
            />
            <text
              x={PAD.left - 10}
              y={yAt(value) + 4}
              textAnchor="end"
              className="fill-ink-48 text-[11px] tabular-nums"
            >
              {Math.round(value)}
            </text>
          </g>
        ))}

        {!isEmpty
          ? series.map((s) => {
              const pts = points.map((p, i) => ({ x: xAt(i), y: yAt(p[s.key]) }));
              const line = smoothPath(pts);
              const area = `${line} L ${pts[pts.length - 1].x} ${yAt(0)} L ${pts[0].x} ${yAt(0)} Z`;
              return (
                <g key={s.key}>
                  <path d={area} fill={`url(#${s.gradient})`} />
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {showDots
                    ? pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.2" fill={s.color} />)
                    : null}
                </g>
              );
            })
          : null}

        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={p.date}
              x={xAt(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-ink-48 text-[11px]"
            >
              {shortDate.format(new Date(`${p.date}T00:00:00+07:00`))}
            </text>
          ) : null,
        )}
      </svg>
      </div>

      {isEmpty ? (
        <p className="mt-2 text-center text-caption text-ink-48">
          ยังไม่มีความเคลื่อนไหวในช่วงนี้
        </p>
      ) : null}
    </figure>
  );
}
