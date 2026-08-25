/**
 * การ์ดข้อมูลแบบ label ซ้าย/value ขวา ใช้ในคอลัมน์สรุปของหน้ารายละเอียดใบสมัคร
 *
 * ต่างจาก Row/Block แบบเดิมของหน้านี้ (label เต็มบรรทัดบนมือถือ, value ชิดซ้าย) ตรงที่นี่
 * label กับ value อยู่บรรทัดเดียวกันเสมอและ value ชิดขวา ตามดีไซน์อ้างอิง — ใช้ได้เพราะ
 * ค่าที่แสดงในคอลัมน์นี้สั้น (ชื่อ, เบอร์, ชิปสถานะ) ไม่ใช่ข้อความยาวที่ต้องการเต็มบรรทัด
 *
 * ไม่มี "แก้ไข" ที่หัวการ์ดแบบดีไซน์อ้างอิง เพราะเจ้าหน้าที่แก้ข้อมูลที่ร้านกรอกเองไม่ได้
 * (มีแต่ผู้สมัครที่แก้ไขได้ และแก้ได้เฉพาะสถานะ "รับข้อมูลแล้ว" ผ่าน /me/[id]/edit) การใส่ปุ่ม
 * "แก้ไข" ไว้ตรงนี้จะเป็นปุ่มที่กดแล้วไม่มีอะไรเกิดขึ้น ซึ่งแย่กว่าไม่มีปุ่ม
 */
export function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
      <h2 className="text-body font-semibold text-ink">{title}</h2>
      <dl className="mt-1">{children}</dl>
    </section>
  );
}

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  /** รับ ReactNode ได้ ไม่ใช่แค่ string — บางแถวต้องแสดงชิปสถานะหรืออวาตาร์ ไม่ใช่แค่ตัวหนังสือ */
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-divider-soft py-3 last:border-b-0">
      <dt className="shrink-0 text-caption text-ink-48">{label}</dt>
      <dd className="min-w-0 text-right text-caption font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}
