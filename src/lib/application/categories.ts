/**
 * หมวดเอกสารและโฟลเดอร์ปลายทางบน Drive
 *
 * แยกไฟล์นี้ออกมาโดยเจตนา — เป็นข้อมูลล้วน ไม่ import อะไรเลย
 * ขั้นเอกสารเป็น client component และต้องใช้ค่าเหล่านี้ ถ้าปล่อยให้อยู่รวมกับ
 * โค้ดที่คุย MongoDB/Drive ตัวไดรเวอร์จะถูกลากเข้า bundle ของเบราว์เซอร์แล้ว build พัง
 * ("Module not found: Can't resolve 'child_process'" ซึ่งไม่ได้บอกสาเหตุที่แท้จริงเลย)
 */
export const DOCUMENT_CATEGORIES = [
  {
    id: "storefront",
    label: "รูปหน้าร้าน",
    folder: "1_รูปหน้าร้าน",
    hint: "ถ่ายให้เห็นป้ายชื่อร้านชัด ถ้ามีหลายสาขาให้ใช้สาขาหลัก",
    maxFiles: 5,
    required: true,
  },
  {
    id: "shop_docs",
    label: "เอกสารร้านค้า",
    folder: "2_เอกสารร้านค้า",
    hint: "เช่น ทะเบียนพาณิชย์ ถ้ามี",
    // ไม่บังคับ — FAQ บอกไว้ว่าร้านที่ยังไม่จดทะเบียนพาณิชย์ก็สมัครได้
    maxFiles: 5,
    required: false,
  },
  {
    id: "owner_docs",
    label: "เอกสารเจ้าของร้าน",
    folder: "3_เอกสารเจ้าของร้าน",
    hint: "บัตรประชาชนของเจ้าของร้าน ถ่ายรูปหรือสแกนก็ได้",
    maxFiles: 5,
    required: true,
  },
  {
    id: "other",
    label: "เอกสารอื่น ๆ",
    folder: "4_เอกสารอื่นๆ",
    hint: "เอกสารอื่นที่คิดว่าเป็นประโยชน์ต่อการพิจารณา",
    maxFiles: 5,
    required: false,
  },
] as const;

export type DocumentCategoryId = (typeof DOCUMENT_CATEGORIES)[number]["id"];

export function categoryById(id: string) {
  return DOCUMENT_CATEGORIES.find((c) => c.id === id);
}

export const REQUIRED_CATEGORIES = DOCUMENT_CATEGORIES.filter((c) => c.required);

/**
 * นิยามเดียวของคำว่า "เอกสารครบ" — ใช้ทั้งตอนผู้สมัครกดส่ง และตอนหลังบ้านแสดงคอลัมน์ครบ/ไม่ครบ
 *
 * ถ้าปล่อยให้สองที่นิยามเองแยกกัน วันหนึ่งหลังบ้านจะขึ้นว่า "ไม่ครบ"
 * ทั้งที่ระบบเพิ่งยอมให้ส่งใบนั้นเข้ามา แล้วไม่มีใครรู้ว่าฝั่งไหนผิด
 */
export function missingCategories(
  documents: readonly { category: string }[],
): { id: DocumentCategoryId; label: string }[] {
  return REQUIRED_CATEGORIES.filter(
    (category) => !documents.some((d) => d.category === category.id),
  ).map((category) => ({ id: category.id, label: category.label }));
}

export function documentsComplete(documents: readonly { category: string }[]): boolean {
  return missingCategories(documents).length === 0;
}

export const ROOT_FOLDER_NAME = "silmin_partner";
export const PENDING_FOLDER = "_pending";
