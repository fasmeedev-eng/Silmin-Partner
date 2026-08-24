/**
 * ตัวเลือกทั้งหมดของใบสมัคร — ที่มา: Product Requirements ข้อ 2–9
 *
 * เก็บ value เป็นภาษาอังกฤษเพื่อให้ query ในหลังบ้านได้โดยไม่ต้องพะวงเรื่อง encoding
 * ส่วน label ภาษาไทยคือสิ่งที่ผู้ใช้เห็น การแก้คำต้องแก้ที่นี่ที่เดียว
 */

export interface Option {
  value: string;
  label: string;
}

export const SHOP_TYPES = [
  { value: "mobile", label: "ร้านมือถือ" },
  { value: "mobile_accessories", label: "ร้านมือถือและอุปกรณ์เสริม" },
  { value: "it_tablet", label: "ร้าน IT / Tablet" },
  { value: "other", label: "อื่น ๆ" },
] as const satisfies readonly Option[];

export const BRANCH_COUNTS = [
  { value: "1", label: "1 สาขา" },
  { value: "2-5", label: "2–5 สาขา" },
  { value: "5+", label: "มากกว่า 5 สาขา" },
] as const satisfies readonly Option[];

export const CONTACT_POSITIONS = [
  { value: "owner", label: "เจ้าของร้าน" },
  { value: "manager", label: "ผู้จัดการ" },
  { value: "staff", label: "พนักงาน" },
  { value: "other", label: "อื่น ๆ" },
] as const satisfies readonly Option[];

export const PRODUCTS = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "smartwatch", label: "Smart Watch" },
  { value: "accessories", label: "Accessories" },
  { value: "iphone", label: "iPhone" },
  { value: "other", label: "อื่น ๆ" },
] as const satisfies readonly Option[];

export const BRANDS = [
  { value: "samsung", label: "Samsung" },
  { value: "apple", label: "Apple" },
  { value: "oppo", label: "OPPO" },
  { value: "vivo", label: "vivo" },
  { value: "xiaomi", label: "Xiaomi" },
  { value: "honor", label: "HONOR" },
  { value: "other", label: "อื่น ๆ" },
] as const satisfies readonly Option[];

export const PRICE_RANGES = [
  { value: "lt5000", label: "ต่ำกว่า 5,000 บาท" },
  { value: "5000-10000", label: "5,000–10,000 บาท" },
  { value: "10001-20000", label: "10,001–20,000 บาท" },
  { value: "20001-30000", label: "20,001–30,000 บาท" },
  { value: "gt30000", label: "มากกว่า 30,000 บาท" },
] as const satisfies readonly Option[];

export const INSTALLMENT_STATUS = [
  { value: "none", label: "ไม่มี" },
  { value: "yes", label: "มี" },
  { value: "former", label: "เคยมี แต่ปัจจุบันไม่ได้ใช้" },
] as const satisfies readonly Option[];

export const INTERESTS = [
  { value: "installment_channel", label: "ต้องการเพิ่มช่องทางผ่อนให้ลูกค้า" },
  { value: "increase_sales", label: "ต้องการเพิ่มยอดขาย" },
  { value: "partner_commission", label: "ต้องการรับค่าตอบแทน Partner" },
  { value: "more_info", label: "ต้องการทราบรายละเอียดเพิ่มเติม" },
  { value: "other", label: "อื่น ๆ" },
] as const satisfies readonly Option[];

export const CALLBACK_CHANNELS = [
  { value: "phone", label: "โทรศัพท์" },
  { value: "line", label: "LINE" },
  { value: "email", label: "อีเมล" },
] as const satisfies readonly Option[];

export const CALLBACK_SLOTS = [
  { value: "09-12", label: "09.00–12.00 น." },
  { value: "12-15", label: "12.00–15.00 น." },
  { value: "15-18", label: "15.00–18.00 น." },
  { value: "anytime", label: "เวลาใดก็ได้" },
] as const satisfies readonly Option[];

// รายชื่อจังหวัดแบบเรียบ (ไม่ผูกกับอำเภอ/ตำบล) ย้ายไปอยู่ที่ thai-address.ts แทน
// เพราะฟอร์มสมัครต้องกรองอำเภอ/ตำบล/รหัสไปรษณีย์ตามจังหวัดที่เลือกจริง แยกกันคนละชุดข้อมูลจะพลาดง่าย

/** แปลง value กลับเป็น label ไทย ใช้ตอนแสดงหน้าตรวจสอบข้อมูลและในหลังบ้าน */
export function labelOf(options: readonly Option[], value: string | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function labelsOf(options: readonly Option[], values: string[] | undefined): string {
  if (!values?.length) return "—";
  return values.map((v) => labelOf(options, v)).join(", ");
}

/** ขั้นตอนของฟอร์ม — ใช้ทั้งแถบความคืบหน้าและการตรวจความถูกต้องรายขั้น */
// title = หัวข้อเต็มของขั้น ใช้เป็น h1 ของหน้า
// short = ป้ายใต้วงกลมใน stepper ต้องสั้นพอให้เจ็ดขั้นเรียงกันได้ในบรรทัดเดียวโดยไม่ตัดคำ
export const STEPS = [
  { id: "shop", title: "ข้อมูลร้าน", short: "ร้าน" },
  { id: "contact", title: "ข้อมูลผู้ติดต่อ", short: "ผู้ติดต่อ" },
  { id: "business", title: "ข้อมูลธุรกิจ", short: "ธุรกิจ" },
  { id: "sales", title: "ข้อมูลการขาย", short: "การขาย" },
  { id: "documents", title: "เอกสาร", short: "เอกสาร" },
  { id: "interests", title: "ความสนใจและการติดต่อกลับ", short: "ความสนใจ" },
  { id: "review", title: "ตรวจสอบและยืนยัน", short: "ตรวจสอบ" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
