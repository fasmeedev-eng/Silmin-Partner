import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { PublicNotification } from "@/lib/db/notifications";
import { ROLE_LABELS, type Role } from "@/lib/auth/roles";

/**
 * แถบบนของหลังบ้าน — อยู่ใน layout จึงขึ้นทุกหน้าใต้ /admin
 *
 * เป็น server component ล้วน เมนูบัญชีใช้ <details> ไม่ใช่ state ฝั่ง client
 * เหตุผลเดียวกับปุ่มออกจากระบบ: server action สร้างในคอมโพเนนต์ฝั่ง client ไม่ได้
 * และเมนูที่เปิด-ปิดอย่างเดียวไม่คุ้มกับการลาก JS ไปให้เบราว์เซอร์
 *
 * "ข้อมูล ณ เวลา" ไม่ใช่ของประดับ หน้าหลังบ้านถูกเปิดค้างทั้งวัน ตัวเลขบนจอจึงเป็นของเก่า
 * ได้ตลอด เวลาที่เรนเดอร์คือสิ่งเดียวที่บอกว่าของที่เห็นเก่าแค่ไหน
 */
export function AdminTopbar({
  role,
  email,
  name,
  signOutButton,
  notifications,
}: {
  role: Role;
  email: string;
  name: string;
  signOutButton: React.ReactNode;
  notifications: { items: PublicNotification[]; unread: number };
}) {
  const now = new Date();
  const clock = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(now);
  const today = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(now);

  return (
    <div className="sticky top-0 z-40 border-b border-hairline/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-6 lg:px-8">
        <div className="ml-auto hidden items-center gap-4 text-fine text-ink-48 md:flex">
          <span className="inline-flex items-center gap-2">
            {/* จุดสถานะเป็นทอง ไม่ใช่เขียว — ระบบนี้มีสี่สี (ขาว/ดำ/ทอง/แดง) ตาม DESIGN.md
                และทองคือสีของ "ข้อมูลสำคัญ" อยู่แล้ว การเพิ่มเขียวเข้ามาเพื่อจุดเดียวไม่คุ้ม */}
            <span aria-hidden className="size-2 rounded-full bg-gold" />
            ระบบออนไลน์
          </span>
          <span aria-hidden className="h-4 w-px bg-hairline" />
          <span>
            ข้อมูล ณ <span className="font-medium text-ink-80 tabular-nums">{clock} น.</span>
          </span>
          <span aria-hidden className="h-4 w-px bg-hairline" />
          <span>
            วันนี้ <span className="font-medium text-ink-80">{today}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-4">


          <NotificationBell
            initialItems={notifications.items}
            initialUnread={notifications.unread}
            tone="light"
          />

          <details className="group relative">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 rounded-full pr-1 [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold text-on-brand"
              >
                {(name || email).charAt(0).toUpperCase()}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 text-ink-48 transition-transform group-open:rotate-180"
              />
              <span className="sr-only">เมนูบัญชี {name || email}</span>
            </summary>

            <div className="nav-panel-in absolute right-0 top-[calc(100%+10px)] z-50 w-[min(90vw,17rem)] overflow-hidden rounded-card bg-canvas p-5 shadow-lift ring-1 ring-hairline">
              <p className="truncate text-caption font-semibold text-ink">{name || email}</p>
              <p className="mt-0.5 truncate text-fine text-ink-48">{email}</p>
              <p className="mt-2 inline-flex rounded-full bg-pearl px-2.5 py-0.5 text-fine text-ink-80 ring-1 ring-inset ring-hairline">
                {ROLE_LABELS[role]}
              </p>
              <div className="mt-4 border-t border-divider-soft pt-4">{signOutButton}</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
