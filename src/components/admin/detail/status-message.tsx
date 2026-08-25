import { MessageSquareText } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/applications";
import { isDangerStatus } from "@/lib/application/status";

/**
 * ข้อความล่าสุดที่ส่งถึงร้าน — ผู้สมัครเห็นข้อความนี้อยู่แล้วบน /me/[id]
 * แต่หน้ารายละเอียดฝั่งเจ้าหน้าที่เดิมไม่เคยแสดงเลย ทั้งที่เป็นข้อมูลจริงที่มีอยู่แล้ว
 * (เก็บใน application.statusMessage) เจ้าหน้าที่คนถัดไปที่เปิดใบนี้ควรเห็นว่าเพื่อนร่วมงาน
 * เขียนอะไรบอกร้านไปแล้ว จะได้ไม่พูดขัดแย้งกันเองเวลาโทรตามงาน
 */
export function StatusMessageCard({
  status,
  message,
}: {
  status: ApplicationStatus;
  message: string;
}) {
  return (
    <div
      className={`mt-6 rounded-card p-5 ring-1 ring-inset ${
        isDangerStatus(status) ? "bg-danger/[0.05] ring-danger/25" : "bg-gold-soft ring-gold/50"
      }`}
    >
      <p className="flex items-center gap-2 text-caption font-semibold text-ink">
        <MessageSquareText aria-hidden className="size-4 shrink-0" />
        ข้อความล่าสุดที่ส่งถึงร้าน
      </p>
      <p className="mt-2 whitespace-pre-line text-caption leading-[1.7] text-ink-80">{message}</p>
    </div>
  );
}
