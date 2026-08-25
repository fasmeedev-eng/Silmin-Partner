import type { ApplicationStatus } from "@/lib/db/applications";

/**
 * สถานะฝั่งฐานข้อมูลเป็นภาษาอังกฤษ (ค้นง่าย ไม่มีปัญหา encoding)
 * ส่วนที่ผู้สมัครเห็นเป็นภาษาไทยและต้องบอกด้วยว่า "แล้วต้องทำอะไรต่อ"
 * สถานะเปล่า ๆ อย่าง "Reviewing" ไม่ช่วยให้ร้านรู้ว่าควรรอหรือควรลงมือ
 */
interface StatusMeta {
  label: string;
  /** อธิบายว่าตอนนี้เกิดอะไรขึ้น และผู้สมัครต้องทำอะไรต่อ */
  detail: string;
  /** ต้องให้ผู้สมัครลงมือทำอะไรไหม ใช้ตัดสินว่าจะเน้นสีเหลืองหรือไม่ */
  needsAction: boolean;
  /** จบกระบวนการแล้ว (ทั้งทางบวกและทางลบ) */
  settled: boolean;
  /**
   * ผลลบจริง ๆ (ไม่ผ่าน) ใช้ตัดสินว่าจะเน้นสีแดง (--danger) หรือไม่
   * รวมไว้ที่นี่จุดเดียวแทนการเทียบ status === "Rejected" กระจายไปหลายไฟล์
   */
  dangerStyled: boolean;
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  Draft: {
    label: "ร่าง",
    detail: "ยังกรอกไม่เสร็จ กลับมากรอกต่อได้ทุกเมื่อ",
    needsAction: true,
    settled: false,
    dangerStyled: false,
  },
  New: {
    label: "รอดำเนินการ",
    detail: "เราได้รับใบสมัครแล้ว ทีมงานจะเริ่มตรวจสอบภายใน 1–3 วันทำการ",
    needsAction: false,
    settled: false,
    dangerStyled: false,
  },
  Reviewing: {
    label: "กำลังตรวจสอบ",
    detail: "เจ้าหน้าที่กำลังตรวจข้อมูลและเอกสารของร้านคุณ",
    needsAction: false,
    settled: false,
    dangerStyled: false,
  },
  NeedMoreInfo: {
    label: "รอข้อมูลเพิ่มเติม",
    detail: "เจ้าหน้าที่ขอข้อมูลหรือเอกสารเพิ่ม ดูรายละเอียดด้านล่างแล้วส่งเพิ่มได้เลย",
    needsAction: true,
    settled: false,
    dangerStyled: false,
  },
  Approved: {
    label: "ผ่านการอนุมัติ",
    detail: "ใบสมัครผ่านการพิจารณาแล้ว ทีมขายจะติดต่อกลับเพื่อคุยขั้นตอนถัดไป",
    needsAction: false,
    settled: false,
    dangerStyled: false,
  },
  Rejected: {
    label: "ไม่ผ่าน",
    detail: "ใบสมัครนี้ยังไม่ผ่านการพิจารณา หากมีข้อสงสัยติดต่อทีมงานได้",
    needsAction: false,
    settled: true,
    dangerStyled: true,
  },
  Onboarding: {
    label: "อยู่ระหว่างทำสัญญา",
    detail: "อยู่ในขั้นตอนทำสัญญาและเปิดระบบ ทีมงานจะแจ้งเอกสารที่ต้องใช้",
    needsAction: false,
    settled: false,
    dangerStyled: false,
  },
  ActivePartner: {
    label: "เป็นพาร์ทเนอร์แล้ว",
    detail: "เปิดใช้งานเรียบร้อย เริ่มเสนอบริการผ่อนให้ลูกค้าได้เลย",
    needsAction: false,
    settled: true,
    dangerStyled: false,
  },
};

/** สถานะนี้ควรเน้นด้วยสีแดง (--danger) ไหม — จุดเดียวที่ตัดสิน แทนการเทียบสตริงกระจายไปทั่วโค้ด */
export function isDangerStatus(status: ApplicationStatus): boolean {
  return STATUS_META[status].dangerStyled;
}

/**
 * เส้นทางที่ใบสมัครเดินผ่าน ใช้วาดแถบความคืบหน้า
 * NeedMoreInfo กับ Rejected ไม่อยู่ในเส้นนี้ เพราะเป็นการแตกออกข้าง ไม่ใช่ขั้นถัดไป
 */
export const STATUS_TRACK: { status: ApplicationStatus; label: string }[] = [
  { status: "New", label: "รับข้อมูลแล้ว" },
  { status: "Reviewing", label: "กำลังตรวจสอบ" },
  { status: "Approved", label: "อนุมัติ" },
  { status: "Onboarding", label: "ทำสัญญา" },
  { status: "ActivePartner", label: "เป็นพาร์ทเนอร์" },
];

export function trackIndex(status: ApplicationStatus): number {
  // ระหว่างรอข้อมูลเพิ่ม ใบสมัครยังอยู่ในช่วงตรวจสอบ จึงค้างไว้ที่ขั้นนั้น
  if (status === "NeedMoreInfo") return 1;
  if (status === "Rejected") return 1;
  return STATUS_TRACK.findIndex((s) => s.status === status);
}

/**
 * ผู้สมัครแก้ไขใบสมัครของตัวเองได้เฉพาะสถานะ New (รับข้อมูลแล้ว) เท่านั้น
 *
 * เหตุผลคือเมื่อเจ้าหน้าที่เริ่มตรวจสอบแล้ว สิ่งที่กำลังตรวจต้องหยุดนิ่ง
 * ถ้าข้อมูลเปลี่ยนระหว่างตรวจ สิ่งที่อนุมัติกับสิ่งที่อยู่ในระบบจะไม่ตรงกัน
 */
export const EDITABLE_STATUSES: ApplicationStatus[] = ["New"];

export function isEditable(status: ApplicationStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

/** ข้อความอธิบายว่าทำไมแก้ไม่ได้ ผู้ใช้ต้องรู้ว่าต้องทำอย่างไรแทน ไม่ใช่แค่เจอปุ่มหาย */
export function editBlockedReason(status: ApplicationStatus): string {
  if (status === "Reviewing") {
    return "เจ้าหน้าที่กำลังตรวจสอบใบสมัครนี้อยู่ จึงแก้ไขเองไม่ได้ หากต้องการแก้ไขกรุณาติดต่อทีมงาน";
  }
  if (status === "NeedMoreInfo") {
    return "ใบสมัครนี้อยู่ระหว่างรอข้อมูลเพิ่มเติม กรุณาติดต่อทีมงานที่ดูแลใบสมัครของคุณ";
  }
  if (status === "Rejected") {
    return "ใบสมัครนี้สิ้นสุดการพิจารณาแล้ว จึงแก้ไขไม่ได้";
  }
  return "ใบสมัครนี้ผ่านขั้นตรวจสอบไปแล้ว จึงแก้ไขเองไม่ได้ หากข้อมูลคลาดเคลื่อนกรุณาติดต่อทีมงาน";
}

/**
 * ชิปแสดงสถานะ — เหลืองใช้เฉพาะตอนที่ "ถึงตาผู้สมัคร" เท่านั้น
 * แดง (--danger) ใช้เฉพาะ Rejected เพราะเป็นผลลบจริง ๆ ต่างจากสถานะ settled อื่นที่เป็นกลาง/บวก
 */
export function statusChipClass(status: ApplicationStatus): string {
  const meta = STATUS_META[status];
  // เหลืองคือ "ลูกบอลอยู่ที่คุณ" ตามการแบ่งบทบาทสีของหน้าแรก (เหลือง = ข้อมูลสำคัญ/ไฮไลต์)
  // ตัวอักษรบนเหลืองต้องเป็นสีเข้ม — ขาวบน #FFD84D ได้คอนทราสต์แค่ ~1.5:1
  if (meta.needsAction) return "bg-gold text-[#0a0a0a]";
  if (meta.dangerStyled) return "bg-danger/10 text-danger-ink ring-1 ring-danger/25 ring-inset";
  // ดำคือ "จบแล้ว/ผ่านแล้ว" — ไม่ใช้แดง เพราะชิปไม่ใช่สิ่งที่กดได้ แดงสงวนไว้ให้ปุ่มกับ error
  if (status === "ActivePartner" || status === "Approved") return "bg-nav text-white";
  return "bg-pearl text-ink-80 ring-1 ring-hairline ring-inset";
}

/**
 * สี่กองที่ใช้ทั้งหน้าคิวงานและแดชบอร์ด
 *
 * แบ่งครบทั้งเจ็ดสถานะโดยไม่ซ้ำและไม่ขาด ซึ่งเป็นข้อบังคับ ไม่ใช่ความเรียบร้อย:
 * การ์ดสรุปแสดงสัดส่วนของแต่ละกองเทียบยอดรวม ถ้ารวมกันไม่ได้ 100% ทั้งแถบก็เชื่อไม่ได้
 *
 * เคยมีชุดที่สอง (WORK_BUCKETS — รอคุณตรวจ / กำลังดำเนินการ / จบแล้ว) ใช้เฉพาะหน้าคิวงาน
 * ถอดออกแล้วเพราะสองหน้าที่แสดงข้อมูลชุดเดียวกันแต่จัดกองคนละแบบ ทำให้ตัวเลขบนสองหน้า
 * ขัดกันเองในสายตาคนอ่าน ทั้งที่ทั้งคู่ถูก — กดการ์ดจากแดชบอร์ดแล้วเจอยอดไม่ตรงคือกับดักนั้น
 *
 * ลำดับคือ ยังเปิดอยู่สองกอง (pending, needinfo) แล้วค่อยผลลัพธ์สองกอง (approved, rejected)
 */
export const KPI_BUCKETS = [
  {
    id: "pending",
    label: "รอตรวจสอบ",
    hint: "ยังไม่มีใครตรวจ หรือกำลังตรวจอยู่",
    statuses: ["New", "Reviewing"] as ApplicationStatus[],
  },
  {
    id: "needinfo",
    label: "รอข้อมูลเพิ่มเติม",
    hint: "ลูกบอลอยู่ที่ผู้สมัคร",
    statuses: ["NeedMoreInfo"] as ApplicationStatus[],
  },
  {
    id: "approved",
    label: "อนุมัติแล้ว",
    hint: "อนุมัติแล้ว ทำสัญญา หรือเปิดใช้งานแล้ว",
    statuses: ["Approved", "Onboarding", "ActivePartner"] as ApplicationStatus[],
  },
  {
    id: "rejected",
    label: "ไม่อนุมัติ",
    hint: "สิ้นสุดการพิจารณาแล้ว",
    statuses: ["Rejected"] as ApplicationStatus[],
  },
] as const;

export type KpiBucketId = (typeof KPI_BUCKETS)[number]["id"];

export function kpiBucketById(id: string | undefined) {
  return KPI_BUCKETS.find((b) => b.id === id);
}

/**
 * สีของแถบความคืบหน้าในตารางคิวงาน
 *
 * ใช้ความหมายชุดเดียวกับ statusChipClass เป๊ะ ๆ (ทอง = ถึงตาผู้สมัคร, ดำ = จบและผ่าน,
 * แดง danger = ไม่ผ่าน, เทา = กำลังเดินอยู่) เพราะชิปกับแถบอยู่ติดกันในแถวเดียวกัน
 * ถ้าสองอย่างนี้ใช้คนละระบบสี คนอ่านจะคิดว่ามันบอกคนละเรื่อง
 *
 * แดงแบรนด์ไม่โผล่ที่นี่ด้วยเหตุผลเดียวกับที่ไม่โผล่บนชิป — แถบไม่ใช่สิ่งที่กดได้
 */
export function statusBarClass(status: ApplicationStatus): string {
  const meta = STATUS_META[status];
  if (meta.dangerStyled) return "bg-danger";
  if (meta.needsAction) return "bg-gold";
  if (status === "ActivePartner" || status === "Approved") return "bg-nav";
  return "bg-ink-48";
}

/**
 * สีตัวอักษร/ไอคอนที่ใช้วางทับพื้น statusBarClass(status) ของสถานะเดียวกัน
 *
 * แยกออกมาเพราะพื้นหลังมีสี่แบบที่คอนทราสต์ต่างกันมาก (ทอง ~1.5:1 กับขาว, ดำ/แดง ~15+:1)
 * ใช้ที่แถบความคืบหน้าและ badge ขั้นตอนปัจจุบันในหน้ารายละเอียดใบสมัคร ซึ่งทั้งสองจุด
 * ต้องตัดสินใจสีตัวอักษรแบบเดียวกันกับพื้นหลังแบบเดียวกัน แยกฟังก์ชันไว้ที่นี่ที่เดียว
 * กันสองจุดตัดสินไม่ตรงกัน
 */
export function statusOnBarClass(status: ApplicationStatus): string {
  const meta = STATUS_META[status];
  if (meta.needsAction) return "text-[#0a0a0a]";
  return "text-white";
}
