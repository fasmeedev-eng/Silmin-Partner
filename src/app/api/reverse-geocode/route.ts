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

  const empty = {
    houseNumber: "",
    road: "",
    adminFields: [] as string[],
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
    return NextResponse.json(empty);
  }

  if (!upstream.ok) {
    return NextResponse.json(empty);
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

  return NextResponse.json({
    houseNumber: address.house_number ?? "",
    road: address.road ?? "",
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
