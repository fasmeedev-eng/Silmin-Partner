import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * พร็อกซีค้นหาพิกัดจากที่อยู่ (บ้านเลขที่/ถนนที่พิมพ์เอง) ผ่าน Nominatim — ใช้ฟรี ไม่ต้องมี API key
 *
 * ใช้ structured search (street/city/state แยกฟิลด์) ไม่ใช่ free-text รวมเป็นประโยคเดียว เพราะ
 * ทดสอบแล้วว่า Nominatim แทบไม่ตอบอะไรเลยถ้าใส่ชื่อจังหวัด/อำเภอเป็นภาษาไทยปนอยู่ในคำค้นเดียวกัน
 * (ดูเหมือนตัวค้นข้อความอิสระของเขาไม่รองรับภาษาไทยดี) แต่ถ้าแยก city/state เป็นภาษาอังกฤษ
 * (ดู englishNamesOf ใน thai-address.ts) ส่วน street ใส่เป็นภาษาไทยได้ตามที่ผู้ใช้พิมพ์จริง
 * ผลลัพธ์จะแม่นขึ้นมาก — ยังไม่ถึงระดับเลขที่บ้านเป๊ะเสมอไป (ข้อมูลเปิดของไทยไม่ละเอียดพอ)
 * แต่ดีกว่าจุดกึ่งกลางตำบลเฉย ๆ พอสมควร ผู้เรียกต้องเช็คระยะห่างจากพิกัดเดิมเองว่าน่าเชื่อถือไหม
 *
 * ต้องพร็อกซีผ่านเซิร์ฟเวอร์เราเอง เพราะนโยบายของ Nominatim กำหนดให้ต้องส่ง User-Agent
 * ที่ระบุตัวตนแอป ซึ่ง browser เขียนทับเองไม่ได้
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const street = searchParams.get("street")?.trim();
  const city = searchParams.get("city")?.trim();
  const state = searchParams.get("state")?.trim();
  if (!street || !city || !state) {
    return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("street", street);
  url.searchParams.set("city", city);
  url.searchParams.set("state", state);
  url.searchParams.set("country", "Thailand");
  url.searchParams.set("limit", "1");

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: {
        "User-Agent": "SilminPartner/1.0 (+https://silmin-partner.vercel.app; partner@silmin.co.th)",
      },
    });
  } catch {
    return NextResponse.json({ found: false as const });
  }

  if (!upstream.ok) {
    return NextResponse.json({ found: false as const });
  }

  const results = (await upstream.json()) as { lat: string; lon: string }[];
  if (!results.length) {
    return NextResponse.json({ found: false as const });
  }

  return NextResponse.json({ found: true as const, lat: results[0].lat, lng: results[0].lon });
}
