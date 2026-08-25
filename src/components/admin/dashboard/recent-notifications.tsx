import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";
import type { PublicNotification } from "@/lib/db/notifications";
import { timeAgo } from "@/lib/notifications/time-ago";

/**
 * การแจ้งเตือนล่าสุดของเจ้าหน้าที่คนที่กำลังเปิดหน้านี้ — คนละคนเห็นคนละรายการ
 * เพราะสถานะ "อ่านแล้ว" เก็บเป็นรายบุคคล (ดู lib/db/notifications.ts)
 *
 * ซ้ำกับกระดิ่งบนแถบบนโดยตั้งใจ กระดิ่งต้องกดถึงจะเห็น ส่วนแดชบอร์ดคือหน้าที่เปิดค้างไว้
 * ของที่ต้องเห็นโดยไม่ต้องกดควรอยู่บนหน้า ไม่ใช่ซ่อนอยู่หลังปุ่ม
 */
export function RecentNotifications({ items }: { items: PublicNotification[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-input bg-pearl px-5 py-12 text-center text-caption leading-[1.7] text-ink-48">
        ยังไม่มีการแจ้งเตือน
        <br />
        เมื่อมีใบสมัครใหม่หรือสถานะเปลี่ยน จะขึ้นที่นี่
      </p>
    );
  }

  return (
    <ul className="mt-5 space-y-1">
      {items.map((item) => {
        const Icon = item.type === "application_submitted" ? FileText : RefreshCw;
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="-mx-2 flex items-start gap-3 rounded-input px-2 py-3 transition-colors hover:bg-pearl"
            >
              <span
                aria-hidden
                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${
                  item.read ? "bg-pearl text-ink-48 ring-1 ring-inset ring-hairline" : "bg-brand text-on-brand"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-caption ${item.read ? "font-medium text-ink-80" : "font-semibold text-ink"}`}
                >
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-fine text-ink-48">{item.body}</span>
              </span>

              <span className="flex shrink-0 items-center gap-2 pt-1">
                <span className="whitespace-nowrap text-fine text-ink-48">
                  {timeAgo(item.createdAt)}
                </span>
                {/* จุดแดง = ยังไม่อ่าน กฎเดียวกับในกระดิ่ง ไม่ใช่สีบอกความรุนแรง */}
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${item.read ? "bg-transparent" : "bg-brand"}`}
                />
                {item.read ? null : <span className="sr-only">ยังไม่อ่าน</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
