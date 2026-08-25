import type { ApplicationData } from "./schema";

type Address = ApplicationData["shop"]["address"];

/** คำนำหน้าที่ผู้ใช้มักพิมพ์ติดมาเอง — ตัดออกก่อนแล้วค่อยเติมกลับให้เป็นรูปแบบเดียวกัน
 *  พิมพ์ "ม.4" "หมู่ 4" หรือ "4" ต้องออกมาเป็น "หมู่ 4" เหมือนกันหมด ไม่ใช่ "หมู่ ม.4" */
const PREFIXES: Record<"moo" | "soi" | "road", { strip: RegExp; add: string }> = {
  moo: { strip: /^(?:หมู่ที่|หมู่|ม\.)\s*/, add: "หมู่ " },
  soi: { strip: /^(?:ซอย|ซ\.)\s*/, add: "ซอย" },
  road: { strip: /^(?:ถนน|ถ\.)\s*/, add: "ถนน" },
};

function part(value: string | undefined, key: keyof typeof PREFIXES): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const { strip, add } = PREFIXES[key];
  return `${add}${trimmed.replace(strip, "")}`;
}

/**
 * ที่อยู่บรรทัดเดียวตามลำดับการเขียนแบบไทย — นิยามเดียวที่ใช้ร่วมกันทั้งหน้าตรวจทานก่อนส่ง
 * หน้าผู้สมัคร และหน้าหลังบ้าน ก่อนหน้านี้ทั้งสามหน้าต่อสตริงเองคนละชุด ซึ่งแปลว่าการเพิ่มช่อง
 * ที่อยู่หนึ่งช่องต้องไปแก้สามที่ และถ้าลืมที่ใดที่หนึ่ง ข้อมูลที่กรอกไว้จะหายไปเงียบ ๆ ในหน้านั้น
 *
 * จุดสังเกตไม่รวมอยู่ในนี้ตั้งใจ — มันไม่ใช่ส่วนหนึ่งของที่อยู่ไปรษณีย์ และยาวพอที่จะกลบ
 * ที่อยู่จริงถ้าเอามาต่อท้ายในบรรทัดเดียวกัน ทุกหน้าจึงแสดงมันเป็นบรรทัดของตัวเอง
 */
export function formatAddress(address: Address): string {
  return [
    address.line1,
    part(address.moo, "moo"),
    part(address.soi, "soi"),
    part(address.road, "road"),
    address.subDistrict,
    address.district,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
}
