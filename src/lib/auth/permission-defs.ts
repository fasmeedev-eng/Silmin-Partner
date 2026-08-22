/**
 * นิยามสิทธิ์ของบทบาท employee — ข้อมูลล้วน ไม่ import อะไรเลย
 * เหตุผลเดียวกับ roles.ts: หน้าตั้งค่าสิทธิ์เป็น client component และต้องใช้ค่าเหล่านี้
 *
 * มีเฉพาะสิทธิ์ที่ **บังคับใช้จริงบนเซิร์ฟเวอร์แล้ว** เท่านั้น
 * สวิตช์ที่ยังไม่มีผลอะไร อันตรายกว่าไม่มีสวิตช์นั้นเลย เพราะคนตั้งค่าจะเชื่อว่าปิดแล้ว
 */
export const PERMISSION_DEFS = [
  {
    id: "viewDocuments",
    label: "เปิดดูเอกสารแนบ",
    description:
      "รูปหน้าร้าน บัตรประชาชน และเอกสารอื่นของผู้สมัคร ปิดได้โดยไม่กระทบงานอื่น เพราะเป็นข้อมูลส่วนบุคคล",
    default: true,
  },
  {
    id: "changeStatus",
    label: "เปลี่ยนสถานะใบสมัคร",
    description:
      "รวมถึงการเขียนข้อความถึงผู้สมัคร เพราะสองสถานะบังคับให้ต้องมีข้อความอยู่แล้ว จึงแยกจากกันไม่ได้",
    default: true,
  },
  {
    id: "internalNotes",
    label: "เขียนโน้ตภายใน",
    description: "บันทึกที่เจ้าหน้าที่เห็นกันเอง ผู้สมัครไม่เห็น",
    default: true,
  },
] as const;

export type PermissionId = (typeof PERMISSION_DEFS)[number]["id"];
export type EmployeePermissions = Record<PermissionId, boolean>;

export const DEFAULT_PERMISSIONS: EmployeePermissions = Object.fromEntries(
  PERMISSION_DEFS.map((p) => [p.id, p.default]),
) as EmployeePermissions;
