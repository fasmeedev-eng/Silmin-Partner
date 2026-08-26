import { ContactCard } from "./contact-card";
import { ProgressTracker } from "./progress-tracker";
import type { ApplicationStatus } from "@/lib/db/applications";

/**
 * การ์ดดำบนสุดของหน้ารายละเอียด — รวมข้อมูลติดต่อร้าน (ซ้าย) กับความคืบหน้าใบสมัคร (ขวา)
 * ไว้ในการ์ดเดียวกัน แบ่งด้วยเส้นคั่นแนวตั้งที่ lg ขึ้นไป (จอแคบวางซ้อนกันแทน)
 *
 * เดิมสองอย่างนี้เป็นการ์ดแยกกันคนละสี (ดำ/ขาว) เรียงต่อกันแนวตั้ง — รวมเป็นการ์ดเดียวเพราะ
 * ทั้งคู่ตอบคำถามเดียวกันคือ "ใบนี้อยู่จุดไหนตอนนี้" (จะติดต่อใคร + ไปถึงไหนแล้ว) วางคู่กัน
 * อ่านครั้งเดียวจบโดยไม่ต้องเลื่อนสายตาข้ามการ์ดสีต่าง ๆ กัน
 */
export function ApplicationOverviewCard({
  fullName,
  position,
  positionOther,
  phone,
  lineId,
  email,
  callbackChannel,
  callbackSlot,
  status,
  anchorAt,
}: {
  fullName: string;
  position: string;
  positionOther: string;
  phone: string;
  lineId: string;
  email: string;
  callbackChannel: string;
  callbackSlot: string;
  status: ApplicationStatus;
  anchorAt: Date | undefined;
}) {
  return (
    <section className="mt-6 rounded-card bg-nav p-6 text-white shadow-soft sm:p-7">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-stretch lg:gap-0 lg:divide-x lg:divide-white/10">
        <div className="lg:flex-1 lg:pr-8">
          <ContactCard
            fullName={fullName}
            position={position}
            positionOther={positionOther}
            phone={phone}
            lineId={lineId}
            email={email}
            callbackChannel={callbackChannel}
            callbackSlot={callbackSlot}
          />
        </div>
        <div className="lg:w-[420px] lg:shrink-0 lg:pl-8">
          <ProgressTracker status={status} anchorAt={anchorAt} />
        </div>
      </div>
    </section>
  );
}
