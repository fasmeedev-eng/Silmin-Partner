import { Clock, Mail, MessageCircle, Phone, User } from "lucide-react";
import { CALLBACK_CHANNELS, CALLBACK_SLOTS, CONTACT_POSITIONS, labelOf } from "@/lib/application/options";

/**
 * ข้อมูลติดต่อร้าน — ฝังอยู่ในครึ่งซ้ายของ ApplicationOverviewCard (พื้นดำเดียวกับแถบความคืบหน้า)
 * ไม่มี wrapper การ์ดของตัวเองอีกต่อไป งานจริงของเจ้าหน้าที่คือ "โทรหาร้าน" ไม่ใช่ "อ่านข้อมูล"
 * จึงยังอยู่ตำแหน่งเด่นซ้ายบนสุดเหมือนเดิม ข้อมูลเป็นชุดเดียวกับของเดิมทั้งหมด ไม่มีฟิลด์ใหม่
 */
export function ContactCard({
  fullName,
  position,
  positionOther,
  phone,
  lineId,
  email,
  callbackChannel,
  callbackSlot,
}: {
  fullName: string;
  position: string;
  positionOther: string;
  phone: string;
  lineId: string;
  email: string;
  callbackChannel: string;
  callbackSlot: string;
}) {
  const roleLabel = position === "other" ? positionOther : labelOf(CONTACT_POSITIONS, position);

  return (
    <div>
      <h2 className="text-caption font-semibold text-on-dark-muted">ติดต่อร้านนี้</h2>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-gold"
        >
          <User className="size-6 text-gold" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold">{fullName || "ไม่ได้ระบุชื่อผู้ติดต่อ"}</p>
          <p className="mt-0.5 text-fine text-on-dark-muted">
            {roleLabel || "ผู้ติดต่อหลัก"}
          </p>

          <a
            href={`tel:${phone}`}
            className="mt-2.5 inline-flex min-h-[48px] items-center gap-2.5 rounded-btn bg-brand px-6 text-body font-semibold tabular-nums text-on-brand transition-colors hover:bg-brand-hover"
          >
            <Phone aria-hidden className="size-4" />
            {phone || "ไม่มีเบอร์โทร"}
          </a>

          {callbackChannel || callbackSlot ? (
            <p className="mt-3 inline-flex flex-wrap items-center gap-2 text-caption text-white/85">
              <Clock aria-hidden className="size-4 shrink-0 text-gold" />
              วันและเวลาที่ให้ติดต่อทาง{" "}
              <span className="font-semibold">{labelOf(CALLBACK_CHANNELS, callbackChannel)}</span>{" "}
              ช่วง <span className="font-semibold">{labelOf(CALLBACK_SLOTS, callbackSlot)}</span>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-caption text-on-dark-muted">
            {lineId ? (
              <span className="inline-flex items-center gap-2">
                <MessageCircle aria-hidden className="size-4" />
                LINE: {lineId}
              </span>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-white"
              >
                <Mail aria-hidden className="size-4" />
                {email}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
