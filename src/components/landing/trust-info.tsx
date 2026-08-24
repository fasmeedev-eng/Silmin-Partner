import { Clock, Lock, ShieldCheck } from "lucide-react";

/**
 * แถบความน่าเชื่อถือใต้ปุ่ม CTA — ตอบสามคำถามที่ค้างในใจร้านค้าตอนนิ้วจ่ออยู่เหนือปุ่ม:
 * นานไหม / ต้องให้ข้อมูลอะไรบ้าง / ข้อมูลปลอดภัยไหม
 *
 * ทั้งไอคอนและตัวอักษรเป็นสีเทาทั้งแถบโดยตั้งใจ ไม่ใส่แดงหรือเหลืองแม้แต่จุดเดียว —
 * มันอยู่ห่างจากปุ่ม CTA แค่ไม่กี่สิบพิกเซล ถ้าใส่สีเข้าไปจะกลายเป็นคู่แข่งของปุ่มทันที
 * หน้าที่ของแถบนี้คือ "ลดความลังเล" ไม่ใช่ "เรียกความสนใจ"
 */
const ASSURANCES = [
  { icon: Clock, label: "ใช้เวลา 2–3 นาที" },
  { icon: Lock, label: "ยังไม่ต้องใช้เลขบัญชีธนาคาร" },
  { icon: ShieldCheck, label: "เก็บข้อมูลตาม PDPA" },
];

export function TrustInfo() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
      {ASSURANCES.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-caption text-ink-48">
          <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
          {label}
        </li>
      ))}
    </ul>
  );
}
