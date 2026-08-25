import { z } from "zod";
import {
  BRANCH_COUNTS,
  BRANDS,
  CALLBACK_CHANNELS,
  CALLBACK_SLOTS,
  CONTACT_POSITIONS,
  INSTALLMENT_STATUS,
  INTERESTS,
  PRICE_RANGES,
  PRODUCTS,
  SHOP_TYPES,
  type Option,
  type StepId,
} from "./options";

/** ดึงค่า value ล้วนจากลิสต์ตัวเลือกเป็น tuple ให้ z.enum ใช้ได้
 *  ป้องกันไม่ให้ request ที่ยิงตรงมาเก็บโค้ดตัวเลือกที่ฟอร์มไม่มีทางสร้างได้ */
function valuesOf(options: readonly Option[]): [string, ...string[]] {
  return options.map((o) => o.value) as [string, ...string[]];
}

/** ช่องที่ยังไม่บังคับให้เลือก — รับค่าว่างได้ แต่ถ้าเลือกแล้วต้องเป็นค่าที่มีจริงเท่านั้น */
function optionalOption(options: readonly Option[]) {
  return z.union([z.literal(""), z.enum(valuesOf(options))]);
}


/** ฟอร์มเก็บทุกช่องเป็นสตริง/อาร์เรย์เสมอ ช่องที่ยังไม่กรอกคือค่าว่าง ไม่ใช่ undefined
 *  ทำให้ controlled input ของ React ไม่สลับไปเป็น uncontrolled กลางคัน */
export interface ApplicationData {
  shop: {
    name: string;
    type: string;
    typeOther: string;
    branchCount: string;
    address: {
      line1: string;
      /** หมู่ที่ — ที่อยู่นอกเขตเทศบาลเกือบทุกแห่งมี ถ้าไม่มีช่องนี้ผู้ใช้จะพิมพ์ "123 ม.4" รวมลงเลขที่ */
      moo: string;
      soi: string;
      road: string;
      subDistrict: string;
      district: string;
      province: string;
      postalCode: string;
      /** จุดสังเกต — ไม่ใช่ส่วนหนึ่งของที่อยู่ไปรษณีย์ แต่เป็นสิ่งที่เจ้าหน้าที่ใช้หาร้านจริง ๆ
       *  และเป็นตัวกู้เมื่อหมุดคลาดเคลื่อน จึงเก็บแยกช่องและแสดงแยกบรรทัดทุกหน้า */
      landmark: string;
    };
    lat: string;
    lng: string;
  };
  contact: {
    fullName: string;
    position: string;
    positionOther: string;
    phone: string;
    lineId: string;
    email: string;
  };
  business: {
    products: string[];
    productOther: string;
    brands: string[];
    brandOther: string;
  };
  sales: {
    priceRange: string;
    installmentStatus: string;
    installmentProviders: string;
  };
  interests: {
    reasons: string[];
    reasonOther: string;
    callbackChannel: string;
    callbackSlot: string;
  };
  consent: {
    truthful: boolean;
    pdpa: boolean;
  };
}

export function emptyApplication(): ApplicationData {
  return {
    shop: {
      name: "",
      type: "",
      typeOther: "",
      branchCount: "",
      address: {
        line1: "",
        moo: "",
        soi: "",
        road: "",
        subDistrict: "",
        district: "",
        province: "",
        postalCode: "",
        landmark: "",
      },
      lat: "",
      lng: "",
    },
    contact: { fullName: "", position: "", positionOther: "", phone: "", lineId: "", email: "" },
    business: { products: [], productOther: "", brands: [], brandOther: "" },
    sales: { priceRange: "", installmentStatus: "", installmentProviders: "" },
    interests: { reasons: [], reasonOther: "", callbackChannel: "", callbackSlot: "" },
    consent: { truthful: false, pdpa: false },
  };
}

/** ใช้ตอนบันทึกร่าง — รับทุกอย่างที่รูปทรงถูก ไม่บังคับว่าต้องกรอกครบ
 *  ร่างที่กรอกครึ่งเดียวต้องบันทึกได้ ไม่งั้นผู้ใช้จะเสียงานเมื่อปิดหน้าไป */
export const draftSchema = z.object({
  shop: z.object({
    name: z.string().max(200).default(""),
    type: z.string().max(50).default(""),
    typeOther: z.string().max(200).default(""),
    branchCount: z.string().max(20).default(""),
    address: z.object({
      line1: z.string().max(200).default(""),
      moo: z.string().max(20).default(""),
      soi: z.string().max(120).default(""),
      road: z.string().max(200).default(""),
      subDistrict: z.string().max(120).default(""),
      district: z.string().max(120).default(""),
      province: z.string().max(120).default(""),
      postalCode: z.string().max(10).default(""),
      landmark: z.string().max(300).default(""),
    }),
    lat: z.string().max(32).default(""),
    lng: z.string().max(32).default(""),
  }),
  contact: z.object({
    fullName: z.string().max(200).default(""),
    position: z.string().max(50).default(""),
    positionOther: z.string().max(200).default(""),
    phone: z.string().max(32).default(""),
    lineId: z.string().max(120).default(""),
    email: z.string().max(200).default(""),
  }),
  business: z.object({
    products: z.array(z.string().max(50)).max(20).default([]),
    productOther: z.string().max(200).default(""),
    brands: z.array(z.string().max(50)).max(20).default([]),
    brandOther: z.string().max(200).default(""),
  }),
  sales: z.object({
    priceRange: z.string().max(30).default(""),
    installmentStatus: z.string().max(30).default(""),
    installmentProviders: z.string().max(300).default(""),
  }),
  interests: z.object({
    reasons: z.array(z.string().max(50)).max(20).default([]),
    reasonOther: z.string().max(300).default(""),
    callbackChannel: z.string().max(30).default(""),
    callbackSlot: z.string().max(30).default(""),
  }),
  consent: z.object({
    truthful: z.boolean().default(false),
    pdpa: z.boolean().default(false),
  }),
});

const thaiPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d]/g, ""))
  .refine((v) => /^0\d{8,9}$/.test(v), {
    message: "กรอกเบอร์โทรศัพท์ 9–10 หลัก ขึ้นต้นด้วย 0 เช่น 0812345678",
  });

/** ตรวจเข้มรายขั้น — เรียกทั้งตอนกด "ถัดไป" (UX) และตอน submit บนเซิร์ฟเวอร์ (ของจริง) */
export const stepSchemas = {
  shop: z.object({
    shop: z
      .object({
        name: z.string().trim().min(1, "กรอกชื่อร้านค้า"),
        type: optionalOption(SHOP_TYPES),
        typeOther: z.string(),
        branchCount: optionalOption(BRANCH_COUNTS),
        address: z.object({
          line1: z.string().trim().min(1, "กรอกเลขที่"),
          moo: z.string(),
          soi: z.string(),
          road: z.string(),
          subDistrict: z.string().trim().min(1, "กรอกตำบลหรือแขวง"),
          district: z.string().trim().min(1, "กรอกอำเภอหรือเขต"),
          province: z.string().trim().min(1, "เลือกจังหวัด"),
          postalCode: z
            .string()
            .trim()
            .regex(/^\d{5}$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก"),
          landmark: z.string(),
        }),
        lat: z.string(),
        lng: z.string(),
      })
      .refine((s) => s.type !== "other" || s.typeOther.trim().length > 0, {
        message: "ระบุประเภทร้าน",
        path: ["typeOther"],
      }),
  }),

  contact: z.object({
    contact: z
      .object({
        fullName: z.string().trim().min(1, "กรอกชื่อและนามสกุล"),
        position: optionalOption(CONTACT_POSITIONS),
        positionOther: z.string(),
        phone: thaiPhone,
        lineId: z.string(),
        email: z.union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง")]),
      })
      .refine((c) => c.position !== "other" || c.positionOther.trim().length > 0, {
        message: "ระบุตำแหน่ง",
        path: ["positionOther"],
      }),
  }),

  business: z.object({
    business: z
      .object({
        products: z.array(z.enum(valuesOf(PRODUCTS))).min(1, "เลือกอย่างน้อย 1 รายการ"),
        productOther: z.string(),
        brands: z.array(z.enum(valuesOf(BRANDS))),
        brandOther: z.string(),
      })
      .refine((b) => !b.products.includes("other") || b.productOther.trim().length > 0, {
        message: "ระบุสินค้าอื่น ๆ",
        path: ["productOther"],
      })
      .refine((b) => !b.brands.includes("other") || b.brandOther.trim().length > 0, {
        message: "ระบุแบรนด์อื่น ๆ",
        path: ["brandOther"],
      }),
  }),

  sales: z.object({
    sales: z
      .object({
        priceRange: optionalOption(PRICE_RANGES),
        installmentStatus: optionalOption(INSTALLMENT_STATUS),
        installmentProviders: z.string(),
      })
      .refine(
        (s) => s.installmentStatus !== "yes" || s.installmentProviders.trim().length > 0,
        { message: "ระบุชื่อผู้ให้บริการที่ใช้อยู่", path: ["installmentProviders"] },
      ),
  }),

  // ขั้นเอกสารยังไม่บังคับ เพราะที่เก็บไฟล์ยังไม่ถูกต่อ
  documents: z.object({}),

  interests: z.object({
    interests: z
      .object({
        reasons: z.array(z.enum(valuesOf(INTERESTS))),
        reasonOther: z.string(),
        callbackChannel: z.enum(valuesOf(CALLBACK_CHANNELS), "เลือกช่องทางที่สะดวกให้ติดต่อกลับ"),
        callbackSlot: z.enum(valuesOf(CALLBACK_SLOTS), "เลือกช่วงเวลาที่สะดวก"),
      })
      .refine((i) => !i.reasons.includes("other") || i.reasonOther.trim().length > 0, {
        message: "ระบุความสนใจอื่น ๆ",
        path: ["reasonOther"],
      }),
  }),

  review: z.object({
    consent: z.object({
      truthful: z.literal(true, "ต้องยืนยันว่าข้อมูลเป็นความจริง"),
      pdpa: z.literal(true, "ต้องยินยอมให้เก็บและใช้ข้อมูลจึงจะส่งใบสมัครได้"),
    }),
  }),
} satisfies Record<StepId, z.ZodTypeAny>;

/** ค่าที่ต้องผ่านทั้งหมดก่อนบันทึกลงฐานข้อมูลจริง — เซิร์ฟเวอร์ตรวจซ้ำเสมอ
 *  การตรวจฝั่ง client เป็นแค่ UX ผู้ใช้ที่ยิง request ตรงข้ามหน้าเว็บได้ต้องไม่ผ่าน */
export function validateForSubmit(data: unknown) {
  const parsedDraft = draftSchema.safeParse(data);
  if (!parsedDraft.success) return parsedDraft;

  const value = parsedDraft.data;
  const issues: z.core.$ZodIssue[] = [];
  for (const step of ["shop", "contact", "business", "sales", "interests", "review"] as const) {
    const result = stepSchemas[step].safeParse(value);
    if (!result.success) issues.push(...result.error.issues);
  }
  if (issues.length) {
    return { success: false as const, error: new z.ZodError(issues) };
  }

  // เก็บเบอร์เป็นตัวเลขล้วน ผู้ใช้พิมพ์ "081-234-5678" หรือ "081 234 5678" ก็ได้
  // แต่ฐานข้อมูลต้องเก็บรูปแบบเดียว ไม่งั้นค้นหาและกันซ้ำในหลังบ้านจะพลาด
  const normalized: ApplicationData = {
    ...value,
    contact: { ...value.contact, phone: value.contact.phone.replace(/\D/g, "") },
  };
  return { success: true as const, data: normalized };
}

/** ตรวจขั้นเดียว คืนค่า error เป็น map ของ path -> ข้อความ ให้ฟอร์มเอาไปแสดงใต้ช่อง */
export function validateStep(
  step: StepId,
  data: ApplicationData,
): Record<string, string> {
  const result = stepSchemas[step].safeParse(data);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}

export const OPTION_SETS = {
  SHOP_TYPES,
  BRANCH_COUNTS,
  CONTACT_POSITIONS,
  PRODUCTS,
  BRANDS,
  PRICE_RANGES,
  INSTALLMENT_STATUS,
  INTERESTS,
  CALLBACK_CHANNELS,
  CALLBACK_SLOTS,
};
