import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * พร็อกซีย้อนกลับพิกัด → ที่อยู่ ผ่าน Nominatim (OpenStreetMap) — ใช้ฟรี ไม่ต้องมี API key
 *
 * ส่งฟิลด์ address ทั้งก้อนกลับไปดิบ ๆ ให้ฝั่ง client จับคู่เอง (ดู matchAdminNames ใน
 * thai-address.ts) เพราะทดสอบแล้วว่า Nominatim ใช้ชื่อฟิลด์ไม่ตรงกันระหว่างกรุงเทพฯ กับต่างจังหวัด
 * (กรุงเทพฯ: quarter/suburb/city, ต่างจังหวัด: city_district/county/province) จะเดาเอาที่นี่ว่า
 * ฟิลด์ไหนคือระดับไหนไม่ได้แม่นพอ ต้องลองจับคู่กับฐานข้อมูลจริงของแอปแทนการเชื่อชื่อฟิลด์
 *
 * ต้องพร็อกซีผ่านเซิร์ฟเวอร์เราเอง ด้วยเหตุผลเดียวกับ /api/geocode เดิม — นโยบายของ Nominatim
 * กำหนดให้ต้องส่ง User-Agent ที่ระบุตัวตนแอป ซึ่ง browser เขียนทับเองไม่ได้
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ message: "ไม่มีพิกัด" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  // Nominatim ล่มไม่ได้แปลว่าหาบ้านเลขที่ไม่ได้ — Overpass เป็นคนละบริการ ยังลองต่อได้
  // ส่วนจังหวัด/อำเภอ/ตำบลปล่อยว่างไว้ ฝั่ง client มีทางสำรองออฟไลน์ (nearestSubDistrict) อยู่แล้ว
  const withoutNominatim = async () => {
    const { best, candidates } = await lookupHouseNumbers(Number(lat), Number(lng));
    return NextResponse.json({
      houseNumber: best?.houseNumber ?? "",
      road: best?.street ?? "",
      houseNumberNearby: Boolean(best),
      houseNumberCandidates: candidates,
      adminFields: [] as string[],
    });
  };

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        "User-Agent": "SilminPartner/1.0 (+https://silmin-partner.vercel.app; partner@silmin.co.th)",
        "Accept-Language": "th",
      },
    });
  } catch {
    return withoutNominatim();
  }

  if (!upstream.ok) {
    return withoutNominatim();
  }

  const result = (await upstream.json()) as {
    address?: {
      house_number?: string;
      road?: string;
      quarter?: string;
      city_district?: string;
      suburb?: string;
      county?: string;
      city?: string;
      town?: string;
      state?: string;
      province?: string;
    };
  };
  const address = result.address ?? {};

  let houseNumber = address.house_number ?? "";
  let road = address.road ?? "";
  // บ้านเลขที่ที่ได้มาเป็นของ "หลังที่ใกล้ที่สุด" ไม่ใช่ของจุดที่ยืนอยู่เป๊ะ ๆ — ผู้ใช้ต้องตรวจทาน
  let houseNumberNearby = false;
  let houseNumberCandidates: HouseNumberCandidate[] = [];

  // Nominatim ตอบบ้านเลขที่เฉพาะตอนที่จุดนั้นตกลงบนวัตถุที่มี addr:housenumber จริง ๆ
  // ถ้า GPS เคลื่อนไปตกบนถนน/ทางเดินหน้าร้าน (ปกติมากบนมือถือ คลาดเคลื่อน 5–30 ม.)
  // มันจะ snap ไปที่ถนนแล้วไม่มีบ้านเลขที่กลับมาเลย จึงถามหาหลังใกล้เคียงจาก Overpass ต่อ
  if (!houseNumber) {
    const { best, candidates } = await lookupHouseNumbers(Number(lat), Number(lng));
    houseNumberCandidates = candidates;
    if (best) {
      houseNumber = best.houseNumber;
      if (!road && best.street) road = best.street;
      houseNumberNearby = true;
    }
  }

  return NextResponse.json({
    houseNumber,
    road,
    houseNumberNearby,
    houseNumberCandidates,
    // ทุกฟิลด์ที่อาจเป็นชื่อจังหวัด/อำเภอ/ตำบล ส่งไปให้ client ลองจับคู่ทั้งหมด
    // ไม่รู้ล่วงหน้าว่าอันไหนคือระดับไหนเพราะ Nominatim ใช้ชื่อฟิลด์ไม่คงที่ (ดูคอมเมนต์ด้านบน)
    adminFields: [
      address.quarter,
      address.city_district,
      address.suburb,
      address.county,
      address.city,
      address.town,
      address.state,
      address.province,
    ].filter((v): v is string => Boolean(v)),
  });
}

/**
 * รัศมีที่ยอมรับว่า "ใกล้พอจะเป็นหลังเดียวกัน" แล้วกรอกให้อัตโนมัติได้เลย
 * ไกลกว่านี้เป็นบ้านคนอื่น การกรอกให้เองถือว่าใส่ข้อมูลผิดลงใบสมัคร จึงได้แค่ "เสนอให้เลือก"
 */
const AUTOFILL_RADIUS_M = 45;
/** ไกลสุดที่ยังเสนอเป็นตัวเลือกให้ผู้ใช้กดเลือกเอง (ไม่กรอกให้อัตโนมัติ) */
const SUGGEST_RADIUS_M = 250;
/** เสนอไม่เกินเท่านี้ — รายการยาวเกินคือให้ไล่อ่าน ไม่ใช่ให้เลือก */
const MAX_SUGGESTIONS = 6;

export interface HouseNumberCandidate {
  houseNumber: string;
  street: string;
  distanceM: number;
}

/**
 * แคชผลค้นบ้านเลขที่ในหน่วยความจำ กันยิง Overpass ซ้ำที่จุดเดิม
 *
 * จำเป็นจริง ๆ ไม่ใช่การปรับให้เร็วขึ้นเฉย ๆ — overpass-api.de จำกัดที่ 2 คำขอพร้อมกันต่อ IP
 * แล้วตอบ 429 ทันทีเมื่อเกิน ซึ่งบนเซิร์ฟเวอร์จริงผู้ใช้ทุกคนใช้ IP เดียวกัน ถ้าไม่แคชไว้
 * พอมีคนกดปุ่มพร้อมกันแค่ไม่กี่คนก็จะเริ่มหาเลขที่ไม่เจอทั้งที่ข้อมูลมีอยู่
 *
 * ปัดพิกัดเหลือ 4 ตำแหน่ง (~11 ม.) พอให้คนกดซ้ำที่เดิมหรือคนในร้านเดียวกันใช้ผลร่วมกันได้
 * ข้อมูลบ้านเลขที่ใน OSM แทบไม่เปลี่ยนรายชั่วโมง เก็บไว้ 1 ชั่วโมงจึงปลอดภัย
 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const houseNumberCache = new Map<
  string,
  { at: number; value: { best?: { houseNumber: string; street: string }; candidates: HouseNumberCandidate[] } }
>();

function cacheKeyFor(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * หาบ้านเลขที่รอบพิกัดจาก OpenStreetMap ผ่าน Overpass API (ฟรี ไม่ต้องมี key)
 *
 * แยกเป็นสองระดับโดยตั้งใจ: หลังที่อยู่ในรัศมี AUTOFILL_RADIUS_M กรอกให้เลย
 * ส่วนที่ไกลกว่านั้นแต่ยังอยู่ใน SUGGEST_RADIUS_M คืนเป็น "ตัวเลือก" ให้ผู้ใช้กดเลือกเอง
 * เพราะการกรอกเลขที่ของบ้านหลังอื่นให้อัตโนมัติแย่กว่าการเว้นว่างไว้ — ผู้ใช้อาจไม่ทันสังเกตแล้วส่งไปเลย
 *
 * ข้อมูลบ้านเลขที่ใน OSM ของไทยมีไม่ทั่วถึง หลายพื้นที่ (โดยเฉพาะต่างจังหวัด) ไม่มีเลยสักหลัง
 * กรณีนั้นคืนลิสต์ว่าง แล้วให้ฝั่ง UI บอกผู้ใช้ตรง ๆ ว่าไม่พบ ไม่ใช่เงียบไว้เฉย ๆ
 */
async function lookupHouseNumbers(
  lat: number,
  lng: number,
): Promise<{ best?: { houseNumber: string; street: string }; candidates: HouseNumberCandidate[] }> {
  const none = { candidates: [] as HouseNumberCandidate[] };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return none;

  const cacheKey = cacheKeyFor(lat, lng);
  const cached = houseNumberCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const query =
    `[out:json][timeout:20];(` +
    `node(around:${SUGGEST_RADIUS_M},${lat},${lng})["addr:housenumber"];` +
    `way(around:${SUGGEST_RADIUS_M},${lat},${lng})["addr:housenumber"];` +
    `);out center 80;`;

  try {
    const data = await fetchOverpass(query);
    if (!data) return none;

    const found: HouseNumberCandidate[] = [];
    for (const element of data.elements ?? []) {
      const houseNumber = element.tags?.["addr:housenumber"];
      if (!houseNumber) continue;
      const point = element.center ?? { lat: element.lat, lon: element.lon };
      if (typeof point.lat !== "number" || typeof point.lon !== "number") continue;

      const distanceM = Math.round(metersBetween(lat, lng, point.lat, point.lon));
      if (distanceM > SUGGEST_RADIUS_M) continue;
      found.push({ houseNumber, street: element.tags?.["addr:street"] ?? "", distanceM });
    }

    found.sort((a, b) => a.distanceM - b.distanceM);

    // เลขซ้ำกันหลายจุด (อาคารเดียวแยกเป็นหลาย node) เก็บอันที่ใกล้ที่สุดพอ
    const seen = new Set<string>();
    const unique = found.filter((c) => {
      if (seen.has(c.houseNumber)) return false;
      seen.add(c.houseNumber);
      return true;
    });

    const nearest = unique[0];
    const best =
      nearest && nearest.distanceM <= AUTOFILL_RADIUS_M
        ? { houseNumber: nearest.houseNumber, street: nearest.street }
        : undefined;

    const value = {
      best,
      // ถ้ากรอกให้อัตโนมัติแล้ว ไม่ต้องเสนอตัวเดิมซ้ำอีก
      candidates: (best ? unique.slice(1) : unique).slice(0, MAX_SUGGESTIONS),
    };

    // เก็บเฉพาะผลที่ได้ข้อมูลจริง — ผลว่างอาจมาจากโดน 429 ไม่ใช่ "บริเวณนี้ไม่มีบ้านเลขที่"
    // ถ้าแคชผลว่างไว้ ผู้ใช้จะติดคำตอบผิดไปทั้งชั่วโมงทั้งที่กดใหม่แล้วน่าจะได้
    if (unique.length > 0) {
      if (houseNumberCache.size >= CACHE_MAX_ENTRIES) {
        const oldest = houseNumberCache.keys().next().value;
        if (oldest) houseNumberCache.delete(oldest);
      }
      houseNumberCache.set(cacheKey, { at: Date.now(), value });
    }

    return value;
  } catch {
    return none;
  }
}

interface OverpassResponse {
  elements?: {
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }[];
}

/**
 * ยิง Overpass พร้อมลองซ้ำเมื่อโดนจำกัดอัตรา
 *
 * overpass-api.de ให้ 2 ช่องต่อ IP แล้วช่องจะว่างคืนภายในไม่กี่วินาที การลองใหม่อีกครั้งเดียว
 * จึงกู้คืนได้เกือบทุกกรณีที่คนกดพร้อมกันพอดี (มิเรอร์สาธารณะอื่นทดสอบแล้วต่อไม่ติดจากที่นี่
 * จึงไม่มีตัวสำรองให้สลับไป)
 *
 * **ต้องตรวจเนื้อความ ไม่ใช่แค่ status** — เมื่อโดนจำกัดอัตรา Overpass ตอบ HTTP 200
 * พร้อมหน้า HTML ที่เขียนว่า rate_limited ไม่ใช่ 429 เสมอไป ถ้าเชื่อ response.ok อย่างเดียว
 * JSON.parse จะพังแล้วตกไปที่ catch กลายเป็น "ไม่พบบ้านเลขที่" ทั้งที่ข้อมูลมีอยู่จริง
 * — อาการนี้คือสาเหตุที่ผู้ใช้เจอว่าปุ่มกรอกเลขที่ให้บ้างไม่ให้บ้าง
 */
async function fetchOverpass(query: string): Promise<OverpassResponse | undefined> {
  const ATTEMPT_TIMEOUT_MS = 6_000;
  const RETRY_DELAY_MS = 1_500;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "SilminPartner/1.0 (+https://silmin-partner.vercel.app; partner@silmin.co.th)",
        },
        body: new URLSearchParams({ data: query }),
        signal: abort.signal,
      });

      // 429 = ช่องเต็ม, 504 = คิวยาว — ทั้งคู่คือ "ลองใหม่อีกทีน่าจะได้"
      if (!response.ok) {
        if (response.status !== 429 && response.status !== 504) return undefined;
        continue;
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as OverpassResponse;
      } catch {
        // ตอบ 200 แต่ไม่ใช่ JSON = หน้า error ของ Overpass เอง ลองใหม่ถ้าเป็นเรื่องโควตา
        if (!text.includes("rate_limited") && !text.includes("runtime error")) return undefined;
      }
    } catch {
      // หมดเวลา/เครือข่ายล้ม — ลองอีกรอบตามลูป
    } finally {
      clearTimeout(timer);
    }
  }

  return undefined;
}

/** ระยะทางแบบ haversine หน่วยเมตร */
function metersBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(a));
}
