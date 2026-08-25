import type { Collection } from "mongodb";
import { getDb } from "./mongo";
import type { ApplicationDoc, ApplicationStatus } from "./applications";
import { KPI_BUCKETS, type KpiBucketId } from "@/lib/application/status";
import { SHOP_TYPES } from "@/lib/application/options";

/**
 * ตัวเลขสรุปสำหรับหน้าแดชบอร์ดหลังบ้าน
 *
 * ทุกตัวเลขในไฟล์นี้มาจากข้อมูลจริงในฐานข้อมูลเท่านั้น ไม่มีค่าตัวอย่างและไม่มีการเดา
 * ที่ต้องย้ำเพราะแดชบอร์ดเป็นหน้าที่คนดูแล้วเชื่อทันทีโดยไม่ตรวจซ้ำ ตัวเลขที่ประมาณเอา
 * จะกลายเป็นข้อมูลที่ใช้ตัดสินใจจริงภายในไม่กี่วัน
 *
 * ดึงทุกอย่างด้วย aggregation ก้อนเดียวผ่าน $facet — แดชบอร์ดต้องการสถิติเจ็ดชุด
 * ถ้าแยกเป็นเจ็ดคิวรีคือเจ็ดรอบไป-กลับฐานข้อมูลต่อการโหลดหนึ่งครั้ง
 */

/** เขตเวลาที่ใช้ตัดวัน — ถ้าปล่อยให้ตัดตาม UTC ใบที่ส่งตอนหัวค่ำจะไปโผล่เป็นของวันถัดไป */
const TZ = "Asia/Bangkok";

const DAY_MS = 86_400_000;

/** ช่วงเวลาที่เลือกดูได้ — ค่าอื่นถูกปัดเป็น 7 เสมอ กัน searchParam แปลก ๆ */
export const RANGE_DAYS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_DAYS)[number];

export const RANGE_LABELS: Record<RangeDays, string> = {
  7: "7 วันล่าสุด",
  30: "30 วันล่าสุด",
  90: "90 วันล่าสุด",
};

export function parseRange(value: string | undefined): RangeDays {
  const n = Number(value);
  return (RANGE_DAYS as readonly number[]).includes(n) ? (n as RangeDays) : 7;
}

/** ทิศทางของการเปลี่ยนแปลง แยกจาก "ดีหรือแย่" เพราะบางกองยิ่งเพิ่มยิ่งแย่ */
export type TrendDirection = "up" | "down" | "flat";

export interface Trend {
  direction: TrendDirection;
  /** จำนวนที่เข้าสถานะนี้ในช่วงล่าสุด และช่วงก่อนหน้าที่ยาวเท่ากัน */
  current: number;
  previous: number;
  /**
   * เปอร์เซ็นต์เปลี่ยนแปลง — เป็น null เมื่อช่วงก่อนหน้าเป็นศูนย์
   * เพราะ "เพิ่มขึ้นจาก 0" ไม่มีเปอร์เซ็นต์ที่แปลว่าอะไรได้ ต้องพูดเป็นจำนวนใบแทน
   * ระบบนี้ปริมาณใบต่อสัปดาห์อยู่หลักหน่วยถึงหลักสิบ กรณีนี้จึงเกิดบ่อย ไม่ใช่กรณีขอบ
   */
  percent: number | null;
}

export interface KpiBucketStat {
  id: KpiBucketId;
  label: string;
  count: number;
  /** สัดส่วนของใบทั้งหมด ใช้วาดวงแหวน */
  share: number;
  trend: Trend;
}

export interface DailyPoint {
  /** yyyy-mm-dd ตามเวลาไทย */
  date: string;
  submitted: number;
  handled: number;
}

export interface TypeSlice {
  label: string;
  count: number;
  share: number;
}

export interface RecentApplication {
  applicationId: string;
  shopName: string;
  contactName: string;
  province: string;
  shopType: string;
  status: ApplicationStatus;
  submittedAt: Date | null;
  waitingDays: number;
}

export interface DashboardData {
  total: number;
  /** จำนวนใบแยกตามสถานะดิบทั้งเจ็ด — หน้าเรียกใช้เองได้โดยไม่ต้องยิงคิวรีซ้ำ */
  statusCounts: Record<string, number>;
  buckets: KpiBucketStat[];
  totalTrend: Trend;
  daily: DailyPoint[];
  types: TypeSlice[];
  /** จำนวนวันที่ใบเก่าสุดในกอง "รอดำเนินการ" รออยู่ — null เมื่อไม่มีใบค้าง */
  oldestWaitingDays: number | null;
  /** ใบที่รอข้อมูลจากผู้สมัครนานเกินหนึ่งสัปดาห์ — ถึงเวลาที่ต้องตามแล้ว */
  stalledNeedInfo: number;
  activePartners: number;
  generatedAt: Date;
}

interface FacetRow {
  _id: string | null;
  count: number;
}

interface AnchorRow {
  _id: ApplicationStatus;
  count: number;
}

async function applications(): Promise<Collection<ApplicationDoc>> {
  const db = await getDb();
  return db.collection<ApplicationDoc>("applications");
}

function makeTrend(current: number, previous: number): Trend {
  const direction: TrendDirection =
    current === previous ? "flat" : current > previous ? "up" : "down";
  const percent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { direction, current, previous, percent };
}

/** เติมวันที่ไม่มีข้อมูลให้เป็นศูนย์ — กราฟที่ข้ามวันเปล่าจะบีบแกนเวลาให้ผิดรูป */
function fillDays(
  days: number,
  submitted: Map<string, number>,
  handled: Map<string, number>,
): DailyPoint[] {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = formatter.format(new Date(Date.now() - i * DAY_MS));
    points.push({
      date,
      submitted: submitted.get(date) ?? 0,
      handled: handled.get(date) ?? 0,
    });
  }
  return points;
}

export async function loadDashboard(rangeDays: RangeDays): Promise<DashboardData> {
  const col = await applications();
  const now = new Date();
  const rangeFrom = new Date(now.getTime() - rangeDays * DAY_MS);
  // หน้าต่างเปรียบเทียบยึดที่ 7 วันเสมอ ไม่ผูกกับช่วงที่เลือกดูกราฟ
  // เพราะ "จากสัปดาห์ก่อน" เป็นประโยคที่คนอ่านเข้าใจตรงกัน ส่วน "จาก 90 วันก่อน" ไม่ใช่
  const weekFrom = new Date(now.getTime() - 7 * DAY_MS);
  const weekPrevFrom = new Date(now.getTime() - 14 * DAY_MS);
  const staleFrom = new Date(now.getTime() - 7 * DAY_MS);

  const notDraft = { status: { $ne: "Draft" as const } };

  const dayGroup = (field: string) => [
    { $group: { _id: { $dateToString: { date: `$${field}`, format: "%Y-%m-%d", timezone: TZ } }, count: { $sum: 1 } } },
  ];

  const [facet] = await col
    .aggregate<{
      byStatus: FacetRow[];
      byType: FacetRow[];
      submittedDaily: FacetRow[];
      handledDaily: FacetRow[];
      anchorWeek: AnchorRow[];
      anchorPrevWeek: AnchorRow[];
      oldestWaiting: { submittedAt?: Date }[];
      stalled: { count: number }[];
    }>([
      { $match: notDraft },
      {
        // จุดอ้างอิงเวลาของใบหนึ่งใบ = ครั้งล่าสุดที่สถานะขยับ ถ้ายังไม่เคยขยับก็คือวันที่ส่ง
        // ใช้ตัดสินว่าใบนี้ "เข้ามาอยู่ในสถานะปัจจุบัน" เมื่อไหร่ ซึ่งเป็นสิ่งที่แนวโน้มควรวัด
        $addFields: { anchorAt: { $ifNull: ["$statusChangedAt", "$submittedAt"] } },
      },
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          byType: [{ $group: { _id: "$data.shop.type", count: { $sum: 1 } } }],
          submittedDaily: [
            { $match: { submittedAt: { $gte: rangeFrom } } },
            ...dayGroup("submittedAt"),
          ],
          handledDaily: [
            { $match: { statusChangedAt: { $gte: rangeFrom } } },
            ...dayGroup("statusChangedAt"),
          ],
          anchorWeek: [
            { $match: { anchorAt: { $gte: weekFrom } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          anchorPrevWeek: [
            { $match: { anchorAt: { $gte: weekPrevFrom, $lt: weekFrom } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          oldestWaiting: [
            { $match: { status: { $in: ["New", "Reviewing"] } } },
            { $sort: { submittedAt: 1 } },
            { $limit: 1 },
            { $project: { submittedAt: 1 } },
          ],
          stalled: [
            { $match: { status: "NeedMoreInfo", anchorAt: { $lt: staleFrom } } },
            { $count: "count" },
          ],
        },
      },
    ])
    .toArray();

  const counts = new Map<string, number>(facet.byStatus.map((r) => [r._id ?? "", r.count]));
  const total = facet.byStatus.reduce((sum, r) => sum + r.count, 0);

  const weekBy = new Map<string, number>(facet.anchorWeek.map((r) => [r._id, r.count]));
  const prevBy = new Map<string, number>(facet.anchorPrevWeek.map((r) => [r._id, r.count]));
  const sumOver = (map: Map<string, number>, statuses: readonly ApplicationStatus[]) =>
    statuses.reduce((sum, s) => sum + (map.get(s) ?? 0), 0);

  const buckets: KpiBucketStat[] = KPI_BUCKETS.map((bucket) => {
    const count = sumOver(counts, bucket.statuses);
    return {
      id: bucket.id,
      label: bucket.label,
      count,
      share: total > 0 ? count / total : 0,
      trend: makeTrend(sumOver(weekBy, bucket.statuses), sumOver(prevBy, bucket.statuses)),
    };
  });

  const weekTotal = [...weekBy.values()].reduce((a, b) => a + b, 0);
  const prevTotal = [...prevBy.values()].reduce((a, b) => a + b, 0);

  const daily = fillDays(
    rangeDays,
    new Map(facet.submittedDaily.map((r) => [r._id ?? "", r.count])),
    new Map(facet.handledDaily.map((r) => [r._id ?? "", r.count])),
  );

  const types = buildTypeSlices(facet.byType, total);

  const oldest = facet.oldestWaiting[0]?.submittedAt;
  const oldestWaitingDays = oldest
    ? Math.floor((now.getTime() - new Date(oldest).getTime()) / DAY_MS)
    : null;

  return {
    total,
    statusCounts: Object.fromEntries(counts),
    buckets,
    totalTrend: makeTrend(weekTotal, prevTotal),
    daily,
    types,
    oldestWaitingDays,
    stalledNeedInfo: facet.stalled[0]?.count ?? 0,
    activePartners: counts.get("ActivePartner") ?? 0,
    generatedAt: now,
  };
}

/**
 * แบ่งตามประเภทร้าน โดยยึดลำดับจาก SHOP_TYPES ไม่ใช่ลำดับที่ฐานข้อมูลคืนมา
 * สีของแต่ละชิ้นผูกกับลำดับ ถ้าลำดับสลับไปมาตามจำนวน สีของ "ร้านมือถือ"
 * จะเปลี่ยนทุกครั้งที่ตัวเลขขยับ แล้วคนอ่านต้องอ่านคำอธิบายใหม่ทุกรอบ
 */
function buildTypeSlices(rows: FacetRow[], total: number): TypeSlice[] {
  const byValue = new Map<string, number>(rows.map((r) => [r._id ?? "", r.count]));
  const slices: TypeSlice[] = SHOP_TYPES.map(({ value, label }) => {
    const count = byValue.get(value) ?? 0;
    byValue.delete(value);
    return { label, count, share: total > 0 ? count / total : 0 };
  });

  // ใบเก่าที่ยังไม่ได้เลือกประเภท (ช่องนี้ไม่บังคับ) รวมเป็นก้อนเดียว ไม่ทิ้งหาย
  // ไม่งั้นผลรวมของวงกลมจะไม่เท่ากับตัวเลขตรงกลาง แล้วทั้งการ์ดดูเชื่อไม่ได้
  const rest = [...byValue.values()].reduce((a, b) => a + b, 0);
  if (rest > 0) {
    slices.push({ label: "ไม่ได้ระบุ", count: rest, share: total > 0 ? rest / total : 0 });
  }
  return slices.filter((slice) => slice.count > 0);
}


/** ใบล่าสุดสำหรับตารางท้ายหน้า — คนละคิวรีกับคิวงาน เพราะที่นี่เอาแค่ "ล่าสุด" ไม่มีตัวกรองซับซ้อน */
export async function listRecentApplications(
  statuses: readonly ApplicationStatus[] | undefined,
  limit: number,
): Promise<RecentApplication[]> {
  const col = await applications();
  const query = statuses?.length
    ? { status: { $in: [...statuses] } }
    : { status: { $ne: "Draft" as const } };

  const docs = await col
    .find(query, {
      projection: {
        applicationId: 1,
        status: 1,
        submittedAt: 1,
        "data.shop.name": 1,
        "data.shop.type": 1,
        "data.shop.address.province": 1,
        "data.contact.fullName": 1,
      },
    })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .toArray();

  const now = Date.now();
  return docs.map((doc) => ({
    applicationId: doc.applicationId ?? "",
    shopName: doc.data?.shop?.name || "ไม่ได้ระบุชื่อร้าน",
    contactName: doc.data?.contact?.fullName || "—",
    province: doc.data?.shop?.address?.province || "",
    shopType: doc.data?.shop?.type || "",
    status: doc.status,
    submittedAt: doc.submittedAt ?? null,
    waitingDays: doc.submittedAt
      ? Math.floor((now - doc.submittedAt.getTime()) / DAY_MS)
      : 0,
  }));
}

/**
 * ตัวเลขสรุปห้าใบบนหัวคิวใบสมัคร
 *
 * แยกจาก loadDashboard เพราะหน้าคิวไม่ต้องการกราฟรายวันหรือการแบ่งตามประเภทร้าน
 * การเรียก loadDashboard มาใช้แค่สองในเจ็ด facet คือการจ่ายค่ารวมข้อมูลทิ้งทุกครั้งที่โหลดหน้า
 *
 * หน้าต่างเทียบเป็น 30 วัน ไม่ใช่ 7 วันเหมือนแดชบอร์ด — คิวงานเป็นหน้าที่เปิดทุกวัน
 * ความต่างรายสัปดาห์จึงเป็นสัญญาณรบกวน ส่วน "จากเดือนก่อน" บอกทิศทางที่ใช้ตัดสินใจได้จริง
 */
export async function loadQueueSummary(): Promise<{
  total: number;
  statusCounts: Record<string, number>;
  buckets: KpiBucketStat[];
  totalTrend: Trend;
}> {
  const col = await applications();
  const now = Date.now();
  const monthFrom = new Date(now - 30 * DAY_MS);
  const monthPrevFrom = new Date(now - 60 * DAY_MS);

  const [facet] = await col
    .aggregate<{
      byStatus: FacetRow[];
      anchorMonth: AnchorRow[];
      anchorPrevMonth: AnchorRow[];
    }>([
      { $match: { status: { $ne: "Draft" } } },
      { $addFields: { anchorAt: { $ifNull: ["$statusChangedAt", "$submittedAt"] } } },
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          anchorMonth: [
            { $match: { anchorAt: { $gte: monthFrom } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          anchorPrevMonth: [
            { $match: { anchorAt: { $gte: monthPrevFrom, $lt: monthFrom } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
        },
      },
    ])
    .toArray();

  const counts = new Map<string, number>(facet.byStatus.map((r) => [r._id ?? "", r.count]));
  const total = facet.byStatus.reduce((sum, r) => sum + r.count, 0);
  const monthBy = new Map<string, number>(facet.anchorMonth.map((r) => [r._id, r.count]));
  const prevBy = new Map<string, number>(facet.anchorPrevMonth.map((r) => [r._id, r.count]));

  const sumOver = (map: Map<string, number>, statuses: readonly ApplicationStatus[]) =>
    statuses.reduce((sum, s) => sum + (map.get(s) ?? 0), 0);

  return {
    total,
    statusCounts: Object.fromEntries(counts),
    buckets: KPI_BUCKETS.map((bucket) => {
      const count = sumOver(counts, bucket.statuses);
      return {
        id: bucket.id,
        label: bucket.label,
        count,
        share: total > 0 ? count / total : 0,
        trend: makeTrend(sumOver(monthBy, bucket.statuses), sumOver(prevBy, bucket.statuses)),
      };
    }),
    totalTrend: makeTrend(
      [...monthBy.values()].reduce((a, b) => a + b, 0),
      [...prevBy.values()].reduce((a, b) => a + b, 0),
    ),
  };
}

/** ใบที่รอตรวจนานที่สุดและยังไม่มีใครแตะ — ปลายทางของปุ่ม "ตรวจใบถัดไป" บนหัวคิว */
export async function findOldestPending(): Promise<string | null> {
  const col = await applications();
  const doc = await col.findOne(
    { status: "New" },
    { projection: { applicationId: 1 }, sort: { submittedAt: 1 } },
  );
  return doc?.applicationId ?? null;
}
