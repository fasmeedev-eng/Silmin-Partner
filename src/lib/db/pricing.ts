import { ObjectId, type ClientSession, type Collection, type Db, type Filter } from "mongodb";
import { getDb, getMongoClient } from "./mongo";
import {
  DEFAULT_MAX_ADDON_LIMIT,
  PRODUCT_LIST_LIMIT,
  type AddonStatus,
  type CategoryRow,
  type CategoryView,
  type PartnerProductView,
  type ProductInput,
  type ProductStatus,
  type ProductView,
} from "@/lib/pricing/schema";

/**
 * ชั้นฐานข้อมูลของ "การจัดการราคาจัด" — สามคอลเลกชัน
 *
 *   categories       ประเภทสินค้า (มือถือ, แท็บเล็ต, …)
 *   products         สินค้าและราคาจัดของมัน
 *   priceAddonRules  กฎบวกเพิ่ม ผูกกับสินค้าแบบ 1:1
 *
 * **หมายเหตุเรื่องชื่อ:** คอลเลกชัน `categories` ที่นี่คือ *ประเภทสินค้า* คนละเรื่องกับ
 * `@/lib/application/categories` ซึ่งเป็นหมวด *เอกสารแนบ* ของใบสมัคร ตัวหลังไม่ใช่คอลเลกชัน
 * ในฐานข้อมูลเลย (เป็นค่าคงที่ในโค้ด) ทั้งสองจึงอยู่ร่วมกันได้ แต่เวลา import ต้องดูเส้นทางให้ดี
 *
 * **ทำไมกฎบวกเพิ่มถึงแยกคอลเลกชันแทนที่จะฝังลงในสินค้า:** เป็นข้อกำหนดของสเปกโดยตรง
 * ราคาที่ต้องจ่ายคือทุกการอ่านต้อง $lookup และทุกการเขียนต้องอยู่ใน transaction
 * ซึ่งเป็นเหตุผลที่ createProduct/updateProduct ด้านล่างยาวกว่าที่ควรจะเป็น
 */

/* ── รูปทรงเอกสารในฐานข้อมูล ─────────────────────────────────────── */

export interface CategoryDoc {
  _id: ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDoc {
  _id: ObjectId;
  name: string;
  capacity: string;
  /** ราคาจัด = ยอดผ่อนชำระ (ราคาเต็ม − ราคาดาวน์) เก็บเป็นบาท */
  arrangedPrice: number;
  categoryId: ObjectId;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAddonRuleDoc {
  _id: ObjectId;
  /** unique — หนึ่งสินค้ามีกฎบวกเพิ่มได้ใบเดียว */
  productId: ObjectId;
  addonStatus: AddonStatus;
  /** เพดาน = จำนวนที่ร้านบวกเพิ่มจากราคาจัดได้สูงสุด เมื่อ addonStatus เป็น "over" จะเป็น 0 เสมอ
   *  เอกสารรุ่นแรกเคยมี addonAmount คู่กับเพดานด้วย ตอนนี้ถอดออกแล้ว — ดู schema.ts หัวข้อคำศัพท์
   *  เอกสารเก่าที่ยังมีคีย์นั้นค้างอยู่ไม่ทำให้อะไรพัง และจะถูก $unset ทิ้งตอนแก้ไขครั้งถัดไป */
  maxAddonLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ── คอลเลกชันและดัชนี ───────────────────────────────────────────── */

let indexesReady: Promise<void> | undefined;

/**
 * สร้างดัชนีครั้งเดียวต่อ process — createIndex เป็น idempotent อยู่แล้ว แต่ไม่ควรยิงทุก request
 *
 * ผลพลอยได้ที่จำเป็น: createIndex สร้างคอลเลกชันให้ด้วยถ้ายังไม่มี ซึ่งต้องเกิดขึ้น
 * **ก่อน** transaction แรก MongoDB รุ่นเก่ากว่า 4.4 สร้างคอลเลกชันกลาง transaction ไม่ได้
 * และถึงรุ่นใหม่จะทำได้ การให้คอลเลกชันมีอยู่ก่อนก็ตัดความเสี่ยงนี้ทิ้งไปเลย
 */
async function ensureIndexes(db: Db): Promise<void> {
  indexesReady ??= (async () => {
    const categories = db.collection<CategoryDoc>("categories");
    const products = db.collection<ProductDoc>("products");
    const rules = db.collection<PriceAddonRuleDoc>("priceAddonRules");

    await categories.createIndex({ name: 1 }, { unique: true });
    await products.createIndex({ categoryId: 1 });
    await products.createIndex({ name: 1 });
    await products.createIndex({ createdAt: -1 });
    // ดัชนี unique ตัวนี้คือสิ่งที่บังคับความสัมพันธ์ 1:1 จริง ๆ transaction รับประกันแค่ว่า
    // สองแถวถูกเขียนพร้อมกันหรือไม่ถูกเขียนเลย ไม่ได้ห้ามใครเพิ่มกฎใบที่สองทีหลัง
    await rules.createIndex({ productId: 1 }, { unique: true });
  })();
  await indexesReady;
}

async function collections(): Promise<{
  db: Db;
  categories: Collection<CategoryDoc>;
  products: Collection<ProductDoc>;
  rules: Collection<PriceAddonRuleDoc>;
}> {
  const db = await getDb();
  await ensureIndexes(db);
  return {
    db,
    categories: db.collection<CategoryDoc>("categories"),
    products: db.collection<ProductDoc>("products"),
    rules: db.collection<PriceAddonRuleDoc>("priceAddonRules"),
  };
}

/** สำเนาเล็ก ๆ ของตัวช่วยเดียวกันใน applications.ts — ค่าที่ผู้ใช้พิมพ์ต้องไม่กลายเป็นรูปแบบ regex */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ── ประเภทสินค้า ────────────────────────────────────────────────── */

function toCategoryView(doc: CategoryDoc): CategoryView {
  return {
    id: doc._id.toString(),
    name: doc.name,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: (doc.updatedAt ?? doc.createdAt).toISOString(),
  };
}

/**
 * รายการประเภททั้งหมด พร้อมจำนวนสินค้าที่ผูกอยู่กับแต่ละประเภท
 *
 * นับด้วย $lookup + $size ในคำสั่งเดียว ไม่ใช่วนนับทีละประเภท — จำนวนประเภทน้อยก็จริง
 * แต่การยิง countDocuments ทีละใบเป็นรูปแบบที่พอข้อมูลโตแล้วจะกลายเป็นปัญหาโดยไม่มีใครสังเกต
 */
export async function listCategories(options?: { activeOnly?: boolean }): Promise<CategoryRow[]> {
  const { categories } = await collections();
  const match: Filter<CategoryDoc> = options?.activeOnly ? { isActive: true } : {};

  const docs = await categories
    .aggregate<CategoryDoc & { productCount: number }>([
      { $match: match },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categoryId",
          as: "linkedProducts",
        },
      },
      { $addFields: { productCount: { $size: "$linkedProducts" } } },
      { $project: { linkedProducts: 0 } },
    ])
    .toArray();

  return docs.map((doc) => ({ ...toCategoryView(doc), productCount: doc.productCount }));
}

export async function findCategory(id: string): Promise<CategoryView | null> {
  if (!ObjectId.isValid(id)) return null;
  const { categories } = await collections();
  const doc = await categories.findOne({ _id: new ObjectId(id) });
  return doc ? toCategoryView(doc) : null;
}

export type CategoryWriteResult =
  | { ok: true; category: CategoryView }
  | { ok: false; code: "duplicate" | "not_found" };

/**
 * ค้นชื่อซ้ำแบบไม่สนตัวพิมพ์ใหญ่เล็ก — ภาษาไทยไม่มีตัวพิมพ์ แต่ชื่อประเภทมักมีคำอังกฤษปน
 * ("iPhone" กับ "iphone" ต้องนับเป็นชื่อเดียวกัน) ดัชนี unique บน name เป็นตัวกันชั้นสุดท้าย
 * เผื่อมีสองคนกดเพิ่มพร้อมกันในเสี้ยววินาทีเดียว จึงต้องดักรหัส 11000 ที่ผู้เรียกด้วย
 */
async function findDuplicateName(
  categories: Collection<CategoryDoc>,
  name: string,
  exceptId?: ObjectId,
): Promise<boolean> {
  const filter: Filter<CategoryDoc> = {
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  };
  if (exceptId) filter._id = { $ne: exceptId };
  return (await categories.countDocuments(filter, { limit: 1 })) > 0;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function createCategory(name: string): Promise<CategoryWriteResult> {
  const { categories } = await collections();

  if (await findDuplicateName(categories, name)) return { ok: false, code: "duplicate" };

  const now = new Date();
  const doc: CategoryDoc = {
    _id: new ObjectId(),
    name,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await categories.insertOne(doc);
  } catch (error) {
    if (isDuplicateKeyError(error)) return { ok: false, code: "duplicate" };
    throw error;
  }

  return { ok: true, category: toCategoryView(doc) };
}

export async function renameCategory(id: string, name: string): Promise<CategoryWriteResult> {
  if (!ObjectId.isValid(id)) return { ok: false, code: "not_found" };
  const { categories } = await collections();
  const _id = new ObjectId(id);

  if (await findDuplicateName(categories, name, _id)) return { ok: false, code: "duplicate" };

  try {
    const doc = await categories.findOneAndUpdate(
      { _id },
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return doc ? { ok: true, category: toCategoryView(doc) } : { ok: false, code: "not_found" };
  } catch (error) {
    if (isDuplicateKeyError(error)) return { ok: false, code: "duplicate" };
    throw error;
  }
}

/**
 * เปิด/ปิดการใช้งานประเภท
 *
 * ปิดแล้ว **ไม่** ไปแตะสินค้าที่ผูกอยู่ — สินค้าเดิมยังอยู่ครบและยังเปิดขายได้ตามสถานะของตัวเอง
 * สิ่งที่หายไปคือประเภทนั้นจะไม่โผล่ในดรอปดาวน์ตอนเพิ่ม/แก้สินค้าอีก
 * (ตั้งใจให้เป็นแบบนี้ การปิดประเภทแล้วสินค้าหลายสิบรายการดับตามคือผลข้างเคียงที่ไม่มีใครคาดคิด)
 */
export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<CategoryWriteResult> {
  if (!ObjectId.isValid(id)) return { ok: false, code: "not_found" };
  const { categories } = await collections();
  const doc = await categories.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { isActive, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? { ok: true, category: toCategoryView(doc) } : { ok: false, code: "not_found" };
}

/* ── สินค้า + กฎบวกเพิ่ม ─────────────────────────────────────────── */

/** รูปทรงที่ออกมาจาก aggregation ด้านล่าง — $lookup คืนอาร์เรย์เสมอแม้จะจับคู่ได้ตัวเดียว */
interface ProductJoined extends ProductDoc {
  category: CategoryDoc[];
  addon: PriceAddonRuleDoc[];
}

function toProductView(doc: ProductJoined): ProductView {
  const category = doc.category[0];
  const rule = doc.addon[0];

  return {
    id: doc._id.toString(),
    name: doc.name,
    capacity: doc.capacity,
    arrangedPrice: doc.arrangedPrice,
    status: doc.status === "inactive" ? "inactive" : "active",
    category: category
      ? {
          id: category._id.toString(),
          name: category.name,
          isActive: category.isActive !== false,
        }
      : null,
    // กฎบวกเพิ่มควรมีเสมอ (สร้างพร้อมสินค้าใน transaction เดียวกัน) แต่ถ้าข้อมูลเก่าหรือ
    // การแก้ด้วยมือทำให้หาย ต้องแสดงเป็นค่าเริ่มต้นแทนที่จะทำให้ทั้งหน้าพัง
    addon: {
      status: rule?.addonStatus === "over" ? "over" : "normal",
      maxLimit: rule?.maxAddonLimit ?? DEFAULT_MAX_ADDON_LIMIT,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: (doc.updatedAt ?? doc.createdAt).toISOString(),
  };
}

const JOIN_STAGES = [
  {
    $lookup: {
      from: "categories",
      localField: "categoryId",
      foreignField: "_id",
      as: "category",
    },
  },
  {
    $lookup: {
      from: "priceAddonRules",
      localField: "_id",
      foreignField: "productId",
      as: "addon",
    },
  },
];

export interface ProductListFilters {
  /** ค้นตามชื่อสินค้า ตามสเปก — ไม่รวมความจุหรือชื่อประเภท */
  q?: string;
  categoryId?: string;
}

export async function listProducts(filters: ProductListFilters = {}): Promise<ProductView[]> {
  const { products } = await collections();

  const match: Filter<ProductDoc> = {};
  const term = filters.q?.trim();
  if (term) match.name = { $regex: escapeRegex(term), $options: "i" };
  if (filters.categoryId && ObjectId.isValid(filters.categoryId)) {
    match.categoryId = new ObjectId(filters.categoryId);
  }

  const docs = await products
    .aggregate<ProductJoined>([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: PRODUCT_LIST_LIMIT },
      ...JOIN_STAGES,
    ])
    .toArray();

  return docs.map(toProductView);
}

/**
 * รายการสินค้าสำหรับร้านพาร์ทเนอร์ — คนละฟังก์ชันกับ listProducts ของหลังบ้านโดยตั้งใจ
 *
 * ต่างกันสองอย่างที่เป็นเรื่องความปลอดภัย ไม่ใช่เรื่องความสะดวก:
 *   1. กรอง status: "active" ตั้งแต่ในคำสั่งฐานข้อมูล เครื่องที่ปิดขายไม่หลุดออกไปเลย
 *   2. $project เอาเฉพาะเจ็ดฟิลด์ที่พาร์ทเนอร์เห็นได้ สถานะเครื่องและวันที่ไม่ถูกอ่านขึ้นมาด้วยซ้ำ
 *
 * ถ้าใช้ listProducts ร่วมกันแล้วค่อยตัดฟิลด์ทีหลัง วันหนึ่งจะมีคนเพิ่มฟิลด์ใหม่เข้า ProductView
 * แล้วมันจะไหลไปถึงหน้าพาร์ทเนอร์เองโดยไม่มีใครสังเกต — การแยกฟังก์ชันคือสิ่งที่กันเรื่องนั้น
 *
 * เรียงตามประเภทแล้วตามชื่อ ไม่ใช่ตามวันที่เพิ่มเหมือนหลังบ้าน — หน้านี้คือใบราคาที่เอาไว้เปิดหาของ
 * ไม่ใช่คิวงานที่ของใหม่ต้องอยู่บนสุด
 */
export async function listPartnerProducts(): Promise<PartnerProductView[]> {
  const { products } = await collections();

  const docs = await products
    .aggregate<{
      _id: ObjectId;
      name: string;
      capacity: string;
      arrangedPrice: number;
      categoryName: string;
      addonStatus?: AddonStatus;
      maxAddonLimit?: number;
    }>([
      { $match: { status: "active" } },
      ...JOIN_STAGES,
      {
        $addFields: {
          categoryName: { $ifNull: [{ $first: "$category.name" }, ""] },
          addonStatus: { $first: "$addon.addonStatus" },
          maxAddonLimit: { $first: "$addon.maxAddonLimit" },
        },
      },
      { $sort: { categoryName: 1, name: 1, arrangedPrice: 1 } },
      { $limit: PRODUCT_LIST_LIMIT },
      {
        $project: {
          name: 1,
          capacity: 1,
          arrangedPrice: 1,
          categoryName: 1,
          addonStatus: 1,
          maxAddonLimit: 1,
        },
      },
    ])
    .toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    capacity: doc.capacity,
    arrangedPrice: doc.arrangedPrice,
    categoryName: doc.categoryName,
    addon: {
      status: doc.addonStatus === "over" ? "over" : "normal",
      maxLimit: doc.maxAddonLimit ?? DEFAULT_MAX_ADDON_LIMIT,
    },
  }));
}

export async function findProduct(id: string): Promise<ProductView | null> {
  if (!ObjectId.isValid(id)) return null;
  const { products } = await collections();
  const docs = await products
    .aggregate<ProductJoined>([{ $match: { _id: new ObjectId(id) } }, ...JOIN_STAGES])
    .toArray();
  return docs[0] ? toProductView(docs[0]) : null;
}

export type ProductWriteResult =
  | { ok: true; product: ProductView }
  | { ok: false; code: "not_found" | "category_not_found" | "category_inactive" };

/**
 * บังคับกติกา OVER อีกชั้นก่อนแตะฐานข้อมูล
 *
 * ชั้นนี้เป็นด่านสุดท้ายที่รับประกันว่าไม่ว่าใครจะเรียกฟังก์ชันนี้จากที่ไหน แถวในตารางจะไม่มีวันเป็น
 * "OVER แต่เพดาน 2,000" ซึ่งเป็นแถวที่อ่านแล้วไม่รู้ว่าต้องเชื่ออันไหน
 * ฟอร์มซ่อนช่องเพดานตอนเลือก OVER อยู่แล้ว แต่ฟอร์มไม่ใช่ทางเดียวที่เขียนข้อมูลชุดนี้ได้
 */
function normalizeAddon(input: ProductInput): {
  addonStatus: AddonStatus;
  maxAddonLimit: number;
} {
  return {
    addonStatus: input.addonStatus,
    maxAddonLimit: input.addonStatus === "over" ? 0 : input.maxAddonLimit,
  };
}

/** ประเภทต้องมีอยู่จริงและต้องยังเปิดใช้งาน — ตรวจในนี้ ไม่ใช่แค่ในดรอปดาวน์ที่ซ่อนตัวเลือก */
async function checkCategory(
  categories: Collection<CategoryDoc>,
  categoryId: string,
  session: ClientSession,
): Promise<{ ok: true; _id: ObjectId } | { ok: false; code: "category_not_found" | "category_inactive" }> {
  if (!ObjectId.isValid(categoryId)) return { ok: false, code: "category_not_found" };
  const _id = new ObjectId(categoryId);
  const doc = await categories.findOne({ _id }, { session });
  if (!doc) return { ok: false, code: "category_not_found" };
  if (doc.isActive === false) return { ok: false, code: "category_inactive" };
  return { ok: true, _id };
}

/**
 * สร้างสินค้าพร้อมกฎบวกเพิ่มใน transaction เดียว
 *
 * ถ้าเขียนแยกกันสองคำสั่งแล้วคำสั่งที่สองล้ม จะเหลือสินค้าที่ไม่มีกฎบวกเพิ่ม ซึ่งเป็นสินค้าที่
 * ตารางแสดงได้แต่ฟอร์มแก้ไขเปิดมาแล้วข้อมูลไม่ครบ — พังแบบเงียบและหาต้นเหตุยาก
 *
 * writeConcern majority เพราะทันทีที่ตอบกลับไป หน้าเว็บจะอ่านรายการใหม่ทันที
 * ถ้ายอมรับ w:1 มีโอกาสที่การอ่านรอบถัดไปไปโดนโหนดที่ยังไม่ทันเห็นของที่เพิ่งเขียน
 */
export async function createProduct(input: ProductInput): Promise<ProductWriteResult> {
  const { categories, products, rules } = await collections();
  const client = await getMongoClient();
  const session = client.startSession();

  let created: ObjectId | undefined;
  let failure: { ok: false; code: "category_not_found" | "category_inactive" } | undefined;

  try {
    await session.withTransaction(
      async (activeSession) => {
        failure = undefined;

        const category = await checkCategory(categories, input.categoryId, activeSession);
        if (!category.ok) {
          failure = category;
          return;
        }

        const now = new Date();
        const productId = new ObjectId();
        const addon = normalizeAddon(input);

        await products.insertOne(
          {
            _id: productId,
            name: input.name,
            capacity: input.capacity,
            arrangedPrice: input.arrangedPrice,
            categoryId: category._id,
            status: "active",
            createdAt: now,
            updatedAt: now,
          },
          { session: activeSession },
        );

        await rules.insertOne(
          {
            _id: new ObjectId(),
            productId,
            ...addon,
            createdAt: now,
            updatedAt: now,
          },
          { session: activeSession },
        );

        created = productId;
      },
      { writeConcern: { w: "majority" } },
    );
  } finally {
    await session.endSession();
  }

  if (failure) return failure;
  if (!created) return { ok: false, code: "not_found" };

  const product = await findProduct(created.toString());
  return product ? { ok: true, product } : { ok: false, code: "not_found" };
}

/**
 * แก้ไขสินค้าและกฎบวกเพิ่มพร้อมกัน — transaction ด้วยเหตุผลเดียวกับตอนสร้าง
 * กฎบวกเพิ่มใช้ upsert เพราะสินค้าที่ข้อมูลเก่าหรือถูกแก้ด้วยมืออาจไม่มีกฎอยู่เลย
 * การแก้ไขครั้งนี้จึงเป็นโอกาสซ่อมความสัมพันธ์ 1:1 ให้ครบไปในตัว
 */
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ProductWriteResult> {
  if (!ObjectId.isValid(id)) return { ok: false, code: "not_found" };

  const { categories, products, rules } = await collections();
  const client = await getMongoClient();
  const session = client.startSession();
  const _id = new ObjectId(id);

  let failure:
    | { ok: false; code: "not_found" | "category_not_found" | "category_inactive" }
    | undefined;

  try {
    await session.withTransaction(
      async (activeSession) => {
        failure = undefined;

        const category = await checkCategory(categories, input.categoryId, activeSession);
        if (!category.ok) {
          failure = category;
          return;
        }

        const now = new Date();
        const addon = normalizeAddon(input);

        const updated = await products.updateOne(
          { _id },
          {
            $set: {
              name: input.name,
              capacity: input.capacity,
              arrangedPrice: input.arrangedPrice,
              categoryId: category._id,
              updatedAt: now,
            },
          },
          { session: activeSession },
        );

        if (updated.matchedCount === 0) {
          failure = { ok: false, code: "not_found" };
          return;
        }

        await rules.updateOne(
          { productId: _id },
          {
            $set: { ...addon, updatedAt: now },
            $setOnInsert: { productId: _id, createdAt: now },
            // ล้าง addonAmount ที่เอกสารรุ่นแรกเคยเก็บไว้ ทุกครั้งที่มีการแก้ไข
            // ปล่อยค้างไว้ก็ไม่พัง แต่ฟิลด์ที่ไม่มีโค้ดไหนอ่านแล้วยังนอนอยู่ในฐานข้อมูล
            // คือกับดักของคนที่มาเปิดดูข้อมูลดิบทีหลังแล้วเชื่อว่ามันมีความหมาย
            $unset: { addonAmount: "" },
          },
          { upsert: true, session: activeSession },
        );
      },
      { writeConcern: { w: "majority" } },
    );
  } finally {
    await session.endSession();
  }

  if (failure) return failure;

  const product = await findProduct(id);
  return product ? { ok: true, product } : { ok: false, code: "not_found" };
}

/** เปลี่ยนสถานะเครื่อง — แตะเฉพาะ products ไม่เกี่ยวกับกฎบวกเพิ่ม จึงไม่ต้องใช้ transaction */
export async function setProductStatus(
  id: string,
  status: ProductStatus,
): Promise<ProductWriteResult> {
  if (!ObjectId.isValid(id)) return { ok: false, code: "not_found" };
  const { products } = await collections();
  const result = await products.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) return { ok: false, code: "not_found" };

  const product = await findProduct(id);
  return product ? { ok: true, product } : { ok: false, code: "not_found" };
}
