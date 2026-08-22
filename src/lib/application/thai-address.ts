import raw from "./data/thai-address.json";

/**
 * จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์ทั้งประเทศ — ที่มา: kongvut/thai-province-data (MIT)
 * เก็บเป็นชื่อ (ไม่ใช่ id) ใน ApplicationData เหมือนเดิม เพื่อไม่ต้องย้ายข้อมูลเก่า
 * ฟังก์ชันในไฟล์นี้จึงต้อง "ค้นด้วยชื่อ" แล้วแปลงเป็น id ภายในเพื่อกรองลูก เพราะชื่ออำเภอ/ตำบล
 * ซ้ำกันได้ข้ามจังหวัด (เช่น มีหลายจังหวัดที่มีอำเภอ "เมือง...") ต้องกรองจากจังหวัดที่เลือกไว้ก่อนเสมอ
 */

interface RawData {
  provinces: [id: number, name: string, nameEn: string][];
  districts: [id: number, name: string, provinceId: number, nameEn: string][];
  subDistricts: [
    id: number,
    name: string,
    districtId: number,
    zip: number,
    lat: number | null,
    lng: number | null,
  ][];
}

const data = raw as RawData;

const th = (a: string, b: string) => a.localeCompare(b, "th");

const provinces = data.provinces.map(([id, name, nameEn]) => ({ id, name, nameEn }));
const districts = data.districts.map(([id, name, provinceId, nameEn]) => ({
  id,
  name,
  provinceId,
  nameEn,
}));
const subDistricts = data.subDistricts.map(([id, name, districtId, zip, lat, lng]) => ({
  id,
  name,
  districtId,
  zip: String(zip),
  // ประมาณ 4% ของตำบลในฐานข้อมูลไม่มีพิกัด (lat/lng เป็น null) — กรณีนั้นให้ผู้ใช้ปักหมุดเอง
  lat,
  lng,
}));

export const THAI_PROVINCES: readonly string[] = provinces
  .map((p) => p.name)
  .sort(th);

const provinceIdByName = new Map(provinces.map((p) => [p.name, p.id]));
const provinceNameById = new Map(provinces.map((p) => [p.id, p.name]));
const districtById = new Map(districts.map((d) => [d.id, d]));

const districtsByProvinceId = new Map<number, { id: number; name: string; nameEn: string }[]>();
for (const d of districts) {
  const list = districtsByProvinceId.get(d.provinceId) ?? [];
  list.push({ id: d.id, name: d.name, nameEn: d.nameEn });
  districtsByProvinceId.set(d.provinceId, list);
}
for (const list of districtsByProvinceId.values()) list.sort((a, b) => th(a.name, b.name));

const subDistrictsByDistrictId = new Map<
  number,
  { name: string; zip: string; lat: number | null; lng: number | null }[]
>();
for (const s of subDistricts) {
  const list = subDistrictsByDistrictId.get(s.districtId) ?? [];
  list.push({ name: s.name, zip: s.zip, lat: s.lat, lng: s.lng });
  subDistrictsByDistrictId.set(s.districtId, list);
}
for (const list of subDistrictsByDistrictId.values()) list.sort((a, b) => th(a.name, b.name));

/** รายชื่ออำเภอ/เขตของจังหวัดที่เลือก ว่างถ้ายังไม่เลือกจังหวัดหรือชื่อไม่ตรงกับฐานข้อมูล */
export function districtsOf(provinceName: string): readonly string[] {
  const provinceId = provinceIdByName.get(provinceName);
  if (provinceId === undefined) return [];
  return (districtsByProvinceId.get(provinceId) ?? []).map((d) => d.name);
}

function findDistrictId(provinceName: string, districtName: string): number | undefined {
  const provinceId = provinceIdByName.get(provinceName);
  if (provinceId === undefined) return undefined;
  return districts.find((d) => d.provinceId === provinceId && d.name === districtName)?.id;
}

/** รายชื่อตำบล/แขวงของอำเภอที่เลือก ต้องรู้จังหวัดด้วยเพราะชื่ออำเภอซ้ำกันข้ามจังหวัดได้ */
export function subDistrictsOf(provinceName: string, districtName: string): readonly string[] {
  const districtId = findDistrictId(provinceName, districtName);
  if (districtId === undefined) return [];
  return (subDistrictsByDistrictId.get(districtId) ?? []).map((s) => s.name);
}

function findSubDistrict(provinceName: string, districtName: string, subDistrictName: string) {
  const districtId = findDistrictId(provinceName, districtName);
  if (districtId === undefined) return undefined;
  return (subDistrictsByDistrictId.get(districtId) ?? []).find((s) => s.name === subDistrictName);
}

/** รหัสไปรษณีย์ของตำบลที่เลือก — ใช้เติมอัตโนมัติ ไม่ต้องให้ผู้ใช้พิมพ์เอง */
export function zipCodeOf(
  provinceName: string,
  districtName: string,
  subDistrictName: string,
): string {
  return findSubDistrict(provinceName, districtName, subDistrictName)?.zip ?? "";
}

/**
 * ชื่อจังหวัด/อำเภอภาษาอังกฤษของที่เลือกไว้ — ใช้ส่งให้ Nominatim ตอนลองค้นหาตำแหน่งจากถนน/เลขที่
 * ที่พิมพ์เอง เพราะทดสอบแล้วว่าค้นด้วยชื่อภาษาไทยล้วนไม่น่าเชื่อถือ แต่ถ้าใส่จังหวัด/อำเภอเป็น
 * ภาษาอังกฤษ (ถนนเป็นภาษาไทยได้ปกติ) จะได้ผลลัพธ์ที่แม่นกว่ามาก
 */
export function englishNamesOf(
  provinceName: string,
  districtName: string,
): { provinceEn: string; districtEn: string } | undefined {
  const provinceId = provinceIdByName.get(provinceName);
  if (provinceId === undefined) return undefined;
  const province = provinces.find((p) => p.id === provinceId);
  const district = (districtsByProvinceId.get(provinceId) ?? []).find(
    (d) => d.name === districtName,
  );
  if (!province || !district) return undefined;
  return { provinceEn: province.nameEn, districtEn: district.nameEn };
}

/**
 * พิกัดกึ่งกลางของตำบลที่เลือก — ใช้ปักหมุดอัตโนมัติเป็นจุดเริ่มต้น ไม่ใช่ตำแหน่งร้านที่แม่นยำ
 * ที่อยู่ไทยไม่มีตัวระบุพิกัดระดับเลขที่บ้านที่เชื่อถือได้ในข้อมูลเปิด จึงพาไปที่ตำบลก่อน
 * แล้วให้ผู้ใช้ลากหมุดไปยังตำแหน่งร้านจริงเอง — ตำบลประมาณ 4% ในฐานข้อมูลไม่มีพิกัด จะคืน undefined
 */
export function latLngOf(
  provinceName: string,
  districtName: string,
  subDistrictName: string,
): { lat: number; lng: number } | undefined {
  const match = findSubDistrict(provinceName, districtName, subDistrictName);
  if (!match || match.lat === null || match.lng === null) return undefined;
  return { lat: match.lat, lng: match.lng };
}

const EARTH_RADIUS_KM = 6371;
/** ระยะทางตรงระหว่างสองพิกัด (กม.) — ใช้เช็คว่าผลค้นหาที่ได้มาสมเหตุสมผลไหมก่อนเชื่อ */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return haversineKm(a, b);
}
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * หาตำบลที่ใกล้พิกัดที่ให้มาที่สุด จากพิกัดกึ่งกลางตำบลที่มากับฐานข้อมูลของแอปเอง
 *
 * ใช้เป็น "ทางสำรอง" เมื่อ matchAdminNames() (จับคู่จากผลย้อนกลับพิกัดของ Nominatim) หาไม่เจอ
 * เช่น ออฟไลน์ หรือ Nominatim ล่ม — ไม่ใช่ทางหลัก เพราะ **ทุกตำบลในกรุงเทพมหานครไม่มีพิกัด
 * ในฐานข้อมูลนี้เลยสักตำบลเดียว** (ข้อจำกัดของ dataset ต้นทาง) การค้นแบบนี้ในพื้นที่กรุงเทพฯ
 * จะไถลไปจับตำบลของจังหวัดข้างเคียงที่มีพิกัดแทน ซึ่งอาจห่างไปหลายกิโลเมตรและผิดจังหวัดไปเลย —
 * จึงต้องกำหนด maxDistanceKm กันไว้ ถ้าตำบลที่ใกล้ที่สุดยังไกลเกินไปให้ถือว่าไม่เจอดีกว่าเดาผิด
 */
export function nearestSubDistrict(
  point: { lat: number; lng: number },
  maxDistanceKm = 3,
): { province: string; district: string; subDistrict: string; zip: string } | undefined {
  let best: { s: (typeof subDistricts)[number]; distanceKm: number } | undefined;
  for (const s of subDistricts) {
    if (s.lat === null || s.lng === null) continue;
    const distanceKm = haversineKm(point, { lat: s.lat, lng: s.lng });
    if (!best || distanceKm < best.distanceKm) best = { s, distanceKm };
  }
  if (!best || best.distanceKm > maxDistanceKm) return undefined;

  const district = districtById.get(best.s.districtId);
  if (!district) return undefined;
  const province = provinceNameById.get(district.provinceId);
  if (!province) return undefined;

  return { province, district: district.name, subDistrict: best.s.name, zip: best.s.zip };
}

const ADMIN_PREFIXES = ["ตำบล", "แขวง", "อำเภอ", "เขต", "จังหวัด"];

/** คืนทั้งชื่อดิบและชื่อที่ตัดคำนำหน้าออก (ถ้ามี) เพื่อลองจับคู่ทั้งสองแบบ */
function nameCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  const prefix = ADMIN_PREFIXES.find((p) => trimmed.startsWith(p));
  return prefix ? [trimmed, trimmed.slice(prefix.length)] : [trimmed];
}

/**
 * จับคู่ชื่อจังหวัด/อำเภอ/ตำบลจากข้อความอิสระ (ผลลัพธ์ address ของ Nominatim reverse geocode)
 * เข้ากับชื่อทางการในฐานข้อมูลของแอป — เป็นทางหลักในการย้อนกลับจาก GPS เป็นจังหวัด/อำเภอ/ตำบล
 *
 * รับ "ทุกฟิลด์ที่อาจเป็นชื่อระดับใดระดับหนึ่ง" มาเป็น array เดียว ไม่สนใจว่าฟิลด์ไหนคือระดับไหน
 * เพราะทดสอบจริงแล้วพบว่า Nominatim ใช้ชื่อฟิลด์ไม่ตรงกันระหว่างกรุงเทพฯ (quarter/suburb/city)
 * กับต่างจังหวัด (city_district/county/province) — ลองจับคู่ทุกคำ (ทั้งมี/ไม่มีคำนำหน้า) กับ
 * ฐานข้อมูลจริงแทนที่จะเดาว่าฟิลด์ไหนคือระดับไหน ทนต่อความไม่คงที่ของฟิลด์ได้ดีกว่า
 */
export function matchAdminNames(
  rawFields: readonly string[],
): { province: string; district: string; subDistrict: string; zip: string } | undefined {
  const candidates = new Set(rawFields.flatMap(nameCandidates));

  const province = provinces.find((p) => candidates.has(p.name));
  if (!province) return undefined;

  const district = (districtsByProvinceId.get(province.id) ?? []).find((d) =>
    candidates.has(d.name),
  );
  if (!district) return undefined;

  const subDistrict = (subDistrictsByDistrictId.get(district.id) ?? []).find((s) =>
    candidates.has(s.name),
  );
  if (!subDistrict) return undefined;

  return {
    province: province.name,
    district: district.name,
    subDistrict: subDistrict.name,
    zip: subDistrict.zip,
  };
}
