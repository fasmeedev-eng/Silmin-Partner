/**
 * เวลาแบบ "เมื่อสักครู่ / 5 นาทีที่แล้ว" — อ่านเร็วกว่าวันที่เต็มสำหรับของที่เพิ่งเกิด
 *
 * ไฟล์ข้อมูลล้วน ไม่ import อะไรเลย เพราะถูกใช้ทั้งจากกระดิ่ง (client component)
 * และจากการ์ดบนแดชบอร์ด (server component) การมีสองสำเนาแปลว่าวันหนึ่งคำจะไม่ตรงกัน
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}
