import type { ApplicationStatus } from "@/lib/db/applications";

/**
 * เส้นทางการเปลี่ยนสถานะที่อนุญาต
 *
 * ล็อกไว้ตามนี้เพราะถ้าปล่อยให้เลือกอิสระ จะมีใบที่กระโดดจาก "รับข้อมูลแล้ว"
 * ไป "เป็นพาร์ทเนอร์" ได้เลยโดยไม่เคยผ่านการตรวจสอบ แล้วไล่หาสาเหตุย้อนหลังไม่ได้
 *
 * "ไม่ผ่าน" ต่อได้จากเกือบทุกสถานะ เพราะบริษัทยกเลิกความร่วมมือได้ทุกจังหวะ
 * ส่วน "เป็นพาร์ทเนอร์" เป็นปลายทาง ไม่มีทางออก — การถอดพาร์ทเนอร์เป็นคนละกระบวนการ
 */
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  Draft: [],
  New: ["Reviewing", "NeedMoreInfo", "Rejected"],
  Reviewing: ["NeedMoreInfo", "Approved", "Rejected"],
  NeedMoreInfo: ["Reviewing", "Rejected"],
  Approved: ["Onboarding", "Rejected"],
  Onboarding: ["ActivePartner", "Rejected"],
  ActivePartner: [],
  Rejected: [],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * สองสถานะนี้ต้องมีข้อความถึงผู้สมัครเสมอ
 * เพราะทั้งคู่ไร้ประโยชน์ถ้าร้านไม่รู้ว่าต้องแก้อะไรหรือไม่ผ่านเพราะอะไร
 */
export function requiresMessage(to: ApplicationStatus): boolean {
  return to === "NeedMoreInfo" || to === "Rejected";
}
