import { z } from "zod";

/**
 * นิยามและกติกาของ "ราคาจัด" — โมดูลข้อมูลล้วน import แค่ zod เท่านั้น
 *
 * **ห้าม import อะไรที่แตะ MongoDB หรือ Drive เข้ามาในไฟล์นี้เด็ดขาด** เพราะทั้งฟอร์มฝั่งเบราว์เซอร์
 * (`"use client"`) และเส้นทาง API ฝั่งเซิร์ฟเวอร์ใช้ไฟล์นี้ร่วมกัน ถ้ามีไดรเวอร์ฐานข้อมูลติดมาด้วย
 * client bundle จะพังด้วย `Can't resolve 'child_process'` ซึ่งชี้ไปคนละที่กับต้นเหตุจริง
 * (เกิดมาแล้วสองครั้งในโปรเจกต์นี้ — ดู CLAUDE.md หัวข้อ Pure-data modules)
 *
 * เหตุผลที่ทั้งสองฝั่งใช้ schema ชุดเดียวกัน: ฝั่งเบราว์เซอร์คือ UX ฝั่งเซิร์ฟเวอร์คือของจริง
 * ถ้าเขียนกติกาแยกกันสองชุด วันหนึ่งมันจะไม่ตรงกัน แล้วฟอร์มจะยอมให้กดบันทึกสิ่งที่ API ปฏิเสธ
 *
 * ── คำศัพท์ ──────────────────────────────────────────────────────────
 *   ราคาเต็ม   ราคาขายจริงของสินค้า                (ไม่ได้เก็บในระบบนี้)
 *   ราคาดาวน์  เงินที่ลูกค้าจ่ายล่วงหน้า           (ไม่ได้เก็บในระบบนี้)
 *   ราคาจัด    ยอดผ่อนชำระ = ราคาเต็ม − ราคาดาวน์   → arrangedPrice
 *   บวกเพิ่ม   เงินที่ร้านบวกจากราคาจัดได้ ไม่เกิน   → maxAddonLimit
 *
 * **บวกเพิ่มมีตัวเลขเดียว คือเพดาน** ไม่ใช่สองตัว
 * ตอนแรกโมเดลมีทั้ง addonAmount ("บวกเพิ่มเท่านี้") และ maxAddonLimit ("ห้ามเกินเท่านี้")
 * ซึ่งอ่านแล้วตอบไม่ได้ว่าตัวไหนคือคำตอบของคำถาม "ร้านนี้บวกได้เท่าไร" — addonAmount จึงถูกถอดออก
 * สิ่งที่ร้านพาร์ทเนอร์ต้องรู้คือ "สินค้าชิ้นนี้บวกเพิ่มจากราคาจัดได้ ไม่เกิน X บาท" ซึ่งคือเพดาน
 * ส่วน addonStatus เป็นตัวตอบว่าบวกได้หรือไม่ได้เลย
 *
 * ราคาจัดที่เก็บที่นี่คือ "ราคาตั้ง" ต่อรุ่นและความจุ ซึ่งแอดมินกำหนดไว้ล่วงหน้า คนละตัวกับ
 * financedAmount ("ยอดจัด") ในเครื่องคิดเลขที่ /partner/calculator ซึ่งคำนวณสดจากราคาขาย
 * ลบเงินดาวน์ที่หน้าร้านกรอกเอง สองอย่างนี้ยังไม่ได้ต่อกัน — ถ้าจะต่อ ต้องตัดสินใจก่อนว่า
 * ตัวไหนเป็นแหล่งความจริง แล้วค่อยแก้ที่เดียว
 */

/* ── ค่าคงที่และตัวเลือก ─────────────────────────────────────────── */

export const ADDON_STATUSES = ["normal", "over"] as const;
export type AddonStatus = (typeof ADDON_STATUSES)[number];

export const PRODUCT_STATUSES = ["active", "inactive"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ADDON_STATUS_LABELS: Record<AddonStatus, string> = {
  normal: "ปกติ",
  over: "OVER",
};

/** ใช้กับ RadioGroup ในฟอร์ม — รูปทรงเดียวกับ Option ใน @/lib/application/options */
export const ADDON_STATUS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "normal", label: "ปกติ" },
  { value: "over", label: "OVER" },
];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "ปกติ",
  inactive: "ปิดใช้งาน",
};

/** เพดานบวกเพิ่มเริ่มต้นต่อสินค้าหนึ่งรายการ แอดมินปรับรายตัวได้ในฟอร์ม */
export const DEFAULT_MAX_ADDON_LIMIT = 2000;

/**
 * ขอบเขตความสมเหตุสมผลของตัวเลข ไม่ใช่กฎธุรกิจ — มีไว้กันค่าที่พิมพ์พลาดจนกลายเป็นคนละหน่วย
 * ไม่ใช่ตัวกำหนดว่าธุรกิจตั้งราคาได้เท่าไร
 */
export const MAX_ADDON_CEILING = 100_000;
export const MAX_ARRANGED_PRICE = 10_000_000;

/**
 * จำนวนสินค้าสูงสุดที่ดึงมาต่อหนึ่งครั้ง — กันตารางระเบิดเมื่อรายการโตขึ้นเรื่อย ๆ
 * ตารางบอกผู้ใช้เองเมื่อชนเพดานนี้ ให้ใช้ช่องค้นหาแทนการเลื่อนหา แทนที่จะตัดข้อมูลทิ้งเงียบ ๆ
 */
export const PRODUCT_LIST_LIMIT = 500;

export const MAX_CATEGORY_NAME_LENGTH = 60;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_CAPACITY_LENGTH = 40;

/* ── รูปทรงข้อมูลที่ส่งออกไปหน้าเว็บ ──────────────────────────────
   วันที่เป็นสตริง ISO ไม่ใช่ Date เพราะข้อมูลชุดนี้เดินทางสองทาง: เรนเดอร์ครั้งแรกส่งลงมาจาก
   server component เป็น prop ส่วนตอนค้นหาและกรองถูกดึงใหม่ผ่าน fetch เป็น JSON
   ถ้าใช้ Date ทางแรกจะได้ Date ทางที่สองจะได้สตริง แล้ว component ต้องเดาว่ากำลังถืออะไรอยู่ */

export interface CategoryView {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * แถวในตารางประเภทสินค้า = ประเภท + จำนวนสินค้าที่ผูกอยู่
 *
 * นับมาให้ตั้งแต่ต้นทางเพราะหน้ายืนยันก่อนปิดใช้งานต้องบอกได้ว่ากระทบกี่รายการ
 * "ปิดแล้วจะเกิดอะไรขึ้น" ที่ไม่มีตัวเลขประกอบ ไม่ได้ช่วยให้ตัดสินใจได้จริง
 */
export interface CategoryRow extends CategoryView {
  productCount: number;
}

export interface ProductView {
  id: string;
  name: string;
  capacity: string;
  arrangedPrice: number;
  status: ProductStatus;
  /** เป็น null ได้เมื่อประเภทที่ผูกไว้หายไปจากฐานข้อมูล ระบบไม่ลบประเภททิ้ง (ปิดใช้งานอย่างเดียว)
   *  แต่ตารางต้องเรนเดอร์ได้โดยไม่พังถ้ามีคนไปลบด้วยมือ */
  category: { id: string; name: string; isActive: boolean } | null;
  /** maxLimit คือเพดาน = จำนวนที่บวกเพิ่มได้สูงสุด เมื่อ status เป็น "over" จะเป็น 0 เสมอ */
  addon: { status: AddonStatus; maxLimit: number };
  createdAt: string;
  updatedAt: string;
}

/**
 * มุมมองของร้านพาร์ทเนอร์ — เจ็ดคอลัมน์ที่พาร์ทเนอร์เห็นได้เท่านั้น
 *
 * **เป็นชนิดข้อมูลแยก ไม่ใช่ ProductView ที่ซ่อนคอลัมน์ตอนเรนเดอร์** — การซ่อนด้วย UI ไม่ใช่
 * การควบคุมการเข้าถึง (กฎเดียวกับหลังบ้านใน CLAUDE.md) ถ้าส่ง ProductView เต็มลงไปแล้วไม่วาด
 * บางคอลัมน์ สถานะเครื่องและวันที่จะยังติดไปกับ HTML ให้เปิดดูได้จาก view-source
 * ชนิดนี้จึงไม่มีฟิลด์พวกนั้นตั้งแต่ต้นทาง คอมไพเลอร์เป็นคนกันให้ว่าจะไม่มีใครเผลอส่งไป
 *
 * ไม่มี status เพราะ listPartnerProducts กรองเอาเฉพาะเครื่องที่เปิดขายอยู่มาแล้ว —
 * คอลัมน์ที่มีค่าเดียวทั้งตารางไม่ได้บอกอะไร และการโชว์เครื่องที่ปิดอยู่โดยไม่มีคอลัมน์บอกสถานะ
 * คือการให้ร้านเสนอราคาของที่ขายไม่ได้
 */
export interface PartnerProductView {
  id: string;
  name: string;
  capacity: string;
  arrangedPrice: number;
  /** ชื่อประเภทล้วน ๆ ไม่ใช่ทั้งก้อน — พาร์ทเนอร์ไม่ต้องรู้ id หรือสถานะเปิด/ปิดของประเภท */
  categoryName: string;
  addon: { status: AddonStatus; maxLimit: number };
}

/* ── ตัวช่วยแปลงค่าจากฟอร์ม ──────────────────────────────────────── */

/**
 * ช่อง input ส่งค่ามาเป็นสตริงเสมอ แม้จะเป็น type="number"
 * ค่าว่างต้องกลายเป็น undefined ไม่ใช่ 0 — ไม่งั้น "ยังไม่ได้กรอก" จะถูกบันทึกเป็นศูนย์เงียบ ๆ
 * แล้วคนกรอกจะไม่มีทางรู้ว่าตัวเองลืม
 */
function toNumberOrUndefined(value: unknown): unknown {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;
  const cleaned = value.trim().replace(/,/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
}

function numberRules(label: string, max: number) {
  return z
    .number({ error: `กรอก${label}เป็นตัวเลข` })
    .refine((n) => Number.isFinite(n), { error: `กรอก${label}เป็นตัวเลข` })
    .min(0, { error: `${label}ต้องไม่ติดลบ` })
    .max(max, { error: `${label}ต้องไม่เกิน ${max.toLocaleString("en-US")} บาท` });
}

function numeric(label: string, max: number) {
  return z.preprocess(toNumberOrUndefined, numberRules(label, max));
}

/** เหมือน numeric แต่ปล่อยว่างได้แล้วถือเป็นค่าเริ่มต้น ใช้กับช่องที่ 0 คือคำตอบที่ถูกจริง ๆ */
function numericWithFallback(label: string, max: number, fallback: number) {
  return z.preprocess(
    (value) => toNumberOrUndefined(value) ?? fallback,
    numberRules(label, max),
  );
}

function requiredText(label: string, max: number) {
  return z
    .string({ error: `กรอก${label}` })
    .trim()
    .min(1, { error: `กรอก${label}` })
    .max(max, { error: `${label}ยาวเกิน ${max} ตัวอักษร` });
}

/* ── กติกา ───────────────────────────────────────────────────────── */

export const categoryInputSchema = z.object({
  name: requiredText("ชื่อประเภทสินค้า", MAX_CATEGORY_NAME_LENGTH),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const categoryActiveSchema = z.object({
  isActive: z.boolean({ error: "ค่าสถานะไม่ถูกต้อง" }),
});

/**
 * ฟอร์มสินค้า — ตรวจช่องของ Product และของ PriceAddonRule พร้อมกันในชุดเดียว
 *
 * รวมเป็นชุดเดียวเพราะกติกาข้อสำคัญที่สุดคร่อมสองตาราง: addonStatus อยู่ในกฎบวกเพิ่ม
 * แต่ตัวมันเป็นคนตัดสินว่าเพดานมีความหมายหรือไม่ ถ้าแยก schema กัน กติกานี้จะไม่มีที่อยู่
 */
export const productInputSchema = z
  .object({
    categoryId: z
      .string({ error: "เลือกประเภทสินค้า" })
      .trim()
      .min(1, { error: "เลือกประเภทสินค้า" }),
    name: requiredText("ชื่อสินค้า", MAX_PRODUCT_NAME_LENGTH),
    capacity: requiredText("ความจุ", MAX_CAPACITY_LENGTH),
    arrangedPrice: numeric("ราคาจัด", MAX_ARRANGED_PRICE),
    addonStatus: z.enum(ADDON_STATUSES, { error: "เลือกสถานะบวกเพิ่ม" }),
    maxAddonLimit: numericWithFallback(
      "เพดานบวกเพิ่ม",
      MAX_ADDON_CEILING,
      DEFAULT_MAX_ADDON_LIMIT,
    ),
  })
  .superRefine((value, ctx) => {
    // OVER = บวกเพิ่มไม่ได้เลย เพดานจึงไม่มีความหมาย ไม่ต้องตรวจ
    // (ชั้นฐานข้อมูลบังคับให้เก็บเป็น 0 เพื่อไม่ให้แถวในตารางอ่านแล้วขัดกันเอง)
    if (value.addonStatus === "over") return;

    // เพดาน 0 กับสถานะ "ปกติ" แปลว่า "บวกได้ แต่บวกได้ 0 บาท" ซึ่งคือ OVER พูดด้วยคำอ้อม
    // ปล่อยไว้จะมีสองวิธีบันทึกเรื่องเดียวกัน แล้วรายงานที่นับ OVER จะนับไม่ครบ
    if (value.maxAddonLimit <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAddonLimit"],
        message: "ถ้าสินค้านี้บวกเพิ่มไม่ได้เลย ให้เลือกสถานะ OVER แทนการใส่เพดาน 0",
      });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export const productStatusSchema = z.object({
  status: z.enum(PRODUCT_STATUSES, { error: "สถานะเครื่องไม่ถูกต้อง" }),
});

/**
 * แปลง ZodError เป็นแผนที่ ช่อง → ข้อความ ให้ฟอร์มวางข้อความไว้ใต้ช่องที่ผิดจริง
 * ข้อความรวมก้อนเดียวบนหัวฟอร์มไม่ได้บอกว่าต้องไปแก้ตรงไหน
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    map[key] ??= issue.message;
  }
  return map;
}

/** ข้อความแรกที่เจอ ใช้เป็น message ของ HTTP 400 เมื่อผู้เรียกไม่ใช่ฟอร์มของเราเอง */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}

/* ── การแสดงผล ───────────────────────────────────────────────────── */

const bahtFormat = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

/** 15000 → "15,000" ตามที่สเปกกำหนด */
export function formatBaht(value: number): string {
  return bahtFormat.format(value);
}

/**
 * DD/MM/YYYY ตามสเปก — ใช้ en-GB เพราะ th-TH ให้ปีพุทธศักราช (2569) ซึ่งไม่ตรงกับตัวอย่างในสเปก
 * ตรึงโซนเวลาเป็น Asia/Bangkok เหมือนที่อื่นในหลังบ้าน ไม่งั้นของที่บันทึกหลังหนึ่งทุ่ม
 * จะแสดงเป็นวันถัดไปบนเครื่องที่ตั้งเวลาเป็น UTC
 */
const dmyFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

export function formatDMY(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dmyFormat.format(date);
}
