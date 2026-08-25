import type { NextRequest } from "next/server";
import { guardRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db/mongo";
import type { ApplicationDoc } from "@/lib/db/applications";
import { STATUS_META, kpiBucketById } from "@/lib/application/status";
import { documentsComplete } from "@/lib/application/categories";
import {
  BRANCH_COUNTS,
  CONTACT_POSITIONS,
  SHOP_TYPES,
  labelOf,
} from "@/lib/application/options";

/**
 * ดาวน์โหลดใบสมัครเป็น CSV
 *
 * มีอยู่เพราะปุ่ม "ส่งออกข้อมูล" บนหัวคิวต้องทำงานได้จริง ปุ่มที่กดแล้วไม่เกิดอะไร
 * แย่กว่าไม่มีปุ่ม เพราะคนกดจะเชื่อว่ามันทำงานแล้ว
 *
 * รับ searchParam ชุดเดียวกับหน้าคิว (tab, range, type, province, documents, q)
 * เพื่อให้ "ส่งออกตามตัวกรองที่เลือกอยู่" ได้ไฟล์ที่ตรงกับสิ่งที่เห็นบนจอจริง ๆ
 * ถ้าสองอย่างนี้ไม่ตรงกัน คนจะเอาไฟล์ผิดไปใช้ประชุมโดยไม่รู้ตัว
 *
 * เจ้าหน้าที่ทุกคนเห็นทุกใบอยู่แล้ว (ไม่มีการมอบหมายผู้ดูแล) การส่งออกจึงไม่กรองตามคน
 * แต่ยังต้องเรียก guardRole เอง — route handler ถูกยิงตรงได้โดยไม่ผ่าน layout
 */

const FILENAME_DATE = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Bangkok",
});

const CELL_DATE = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const COLUMNS = [
  "เลขที่ใบสมัคร",
  "สถานะ",
  "ชื่อร้าน",
  "ประเภทร้าน",
  "จำนวนสาขา",
  "จังหวัด",
  "อำเภอ/เขต",
  "ตำบล/แขวง",
  "รหัสไปรษณีย์",
  "ผู้ติดต่อ",
  "ตำแหน่ง",
  "เบอร์โทร",
  "อีเมล",
  "LINE ID",
  "วันที่ส่ง",
  "เอกสารครบ",
];

/**
 * ครอบทุกช่องด้วยเครื่องหมายคำพูดเสมอ ไม่ใช่เฉพาะช่องที่มีคอมมา
 * ชื่อร้านไทยมีทั้งคอมมา ขึ้นบรรทัดใหม่ และเครื่องหมายคำพูดปนมาได้หมด
 * การครอบทุกช่องทำให้ไม่ต้องเดาว่าช่องไหนอันตราย
 *
 * ช่องที่ขึ้นต้นด้วย = + - @ ถูกเติมอัญประกาศเดี่ยวนำหน้า — Excel ตีความว่าเป็นสูตร
 * ถ้าไม่ทำ ซึ่งเป็นช่องทางฝังคำสั่งผ่านข้อมูลที่ผู้สมัครพิมพ์เข้ามาเอง
 */
function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RANGE_DAYS: Record<string, number> = { "7": 7, "30": 30, "90": 90 };

export async function GET(request: NextRequest) {
  const result = await guardRole(["admin", "employee"]);
  if (!result.allowed) {
    return new Response("ไม่มีสิทธิ์เข้าถึง", { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const query: Record<string, unknown> = { status: { $ne: "Draft" } };

  const bucket = kpiBucketById(params.get("tab") ?? undefined);
  if (bucket) query.status = { $in: [...bucket.statuses] };

  const province = params.get("province");
  if (province) query["data.shop.address.province"] = province;

  const type = params.get("type");
  if (type && SHOP_TYPES.some((t) => t.value === type)) query["data.shop.type"] = type;

  const days = RANGE_DAYS[params.get("range") ?? ""];
  if (days) query.submittedAt = { $gte: new Date(Date.now() - days * 86_400_000) };

  const term = params.get("q")?.trim();
  if (term) {
    const pattern = new RegExp(escapeRegex(term), "i");
    const digits = term.replace(/\D/g, "");
    const or: Record<string, unknown>[] = [
      { applicationId: pattern },
      { "data.shop.name": pattern },
      { "data.contact.fullName": pattern },
    ];
    if (digits.length >= 3) or.push({ "data.contact.phone": new RegExp(escapeRegex(digits)) });
    query.$or = or;
  }

  const db = await getDb();
  const docs = await db
    .collection<ApplicationDoc>("applications")
    // consent ถูกตัดออก — เป็นหลักฐานการยินยอมพร้อม IP และ user agent ไม่ใช่ข้อมูลที่ควรไหลออกเป็นไฟล์
    .find(query, { projection: { consent: 0 } })
    .sort({ submittedAt: -1 })
    .limit(5000)
    .toArray();

  // ตัวกรองเอกสารครบ/ไม่ครบ ทำในหน่วยความจำด้วย documentsComplete ตัวเดียวกับที่ฟอร์มใช้
  // สร้างเงื่อนไข Mongo แยกอีกชุดคือการมีนิยาม "ครบ" สองที่ ซึ่งวันหนึ่งจะไม่ตรงกัน
  const documentsMode = params.get("documents");
  const filtered =
    documentsMode === "complete" || documentsMode === "incomplete"
      ? docs.filter(
          (doc) => documentsComplete(doc.documents ?? []) === (documentsMode === "complete"),
        )
      : docs;

  const rows = filtered.map((doc) => {
    const shop = doc.data?.shop;
    const contact = doc.data?.contact;
    return [
      doc.applicationId ?? "",
      STATUS_META[doc.status]?.label ?? doc.status,
      shop?.name ?? "",
      labelOf(SHOP_TYPES, shop?.type),
      labelOf(BRANCH_COUNTS, shop?.branchCount),
      shop?.address?.province ?? "",
      shop?.address?.district ?? "",
      shop?.address?.subDistrict ?? "",
      shop?.address?.postalCode ?? "",
      contact?.fullName ?? "",
      labelOf(CONTACT_POSITIONS, contact?.position),
      contact?.phone ?? "",
      contact?.email ?? "",
      contact?.lineId ?? "",
      doc.submittedAt ? CELL_DATE.format(doc.submittedAt) : "",
      documentsComplete(doc.documents ?? []) ? "ครบ" : "ไม่ครบ",
    ]
      .map(cell)
      .join(",");
  });

  // BOM นำหน้าไฟล์ — ถ้าไม่มี Excel บนวินโดวส์จะอ่านไฟล์เป็น ANSI แล้วภาษาไทยกลายเป็นขยะ
  const csv = `﻿${[COLUMNS.map(cell).join(","), ...rows].join("\r\n")}\r\n`;

  // ชื่อไฟล์บอกด้วยว่าเป็นชุดไหน จะได้ไม่มีไฟล์สี่ไฟล์ชื่อเหมือนกันอยู่ในโฟลเดอร์ดาวน์โหลด
  const scope = bucket ? `-${bucket.id}` : "";
  const filename = `sg-partner-applications${scope}-${FILENAME_DATE.format(new Date())}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
