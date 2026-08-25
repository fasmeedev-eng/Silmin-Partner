import Link from "next/link";
import { Eye, Search, SlidersHorizontal } from "lucide-react";
import type { RecentApplication } from "@/lib/db/dashboard";
import { KPI_BUCKETS, STATUS_META, statusChipClass } from "@/lib/application/status";
import { SHOP_TYPES, labelOf } from "@/lib/application/options";

/**
 * ตารางใบสมัครล่าสุด
 *
 * เป็นตารางจริง (ไม่ใช่การ์ดต่อแถวแบบหน้าคิวงาน) เพราะตอบคนละคำถาม หน้าคิวงานคือ
 * "หยิบใบไหนมาทำ" การ์ดจึงเหมาะกว่า ส่วนที่นี่คือ "ช่วงนี้มีอะไรเข้ามาบ้าง" ซึ่งเป็นการกวาดตา
 * เทียบหลายใบพร้อมกัน คอลัมน์ที่ตรงกันช่วยเทียบได้ ส่วนการ์ดบังคับให้อ่านทีละใบ
 *
 * ตัวตารางอยู่ในกล่องที่เลื่อนแนวนอนได้เอง หน้าเว็บทั้งหน้าต้องไม่เลื่อนซ้ายขวาตาม
 */

const thaiDateTime = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const TABS = [{ id: "all", label: "ทั้งหมด" }, ...KPI_BUCKETS.map((b) => ({ id: b.id, label: b.label }))];

export function RecentTable({
  items,
  activeTab,
  tabHref,
}: {
  items: RecentApplication[];
  activeTab: string;
  tabHref: (tab: string) => string;
}) {
  return (
    <section className="rounded-card bg-canvas shadow-soft ring-1 ring-hairline/70">
      <div className="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-ink">ใบสมัครล่าสุด</h2>

          <nav aria-label="กรองตามผลการพิจารณา" className="mt-3 flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Link
                  key={tab.id}
                  href={tabHref(tab.id)}
                  aria-current={active ? "page" : undefined}
                  // แท็บที่เลือกเป็นแดงจาง ไม่ใช่แดงทึบ — แดงทึบในหน้านี้เป็นของปุ่มดำเนินการ
                  className={`inline-flex min-h-[38px] items-center rounded-full px-4 text-caption font-medium transition-colors ${
                    active
                      ? "bg-brand-soft text-brand-ink ring-1 ring-inset ring-brand/25"
                      : "text-ink-48 hover:bg-pearl hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* ค้นหาที่นี่แล้วพาไปหน้าคิวงาน ซึ่งเป็นที่เดียวที่มีตัวกรองครบและแบ่งหน้าได้
              ไม่ทำช่องค้นหาซ้ำอีกชุดบนแดชบอร์ด เพราะสองที่ที่ค้นไม่เหมือนกันคือกับดัก */}
          <form method="get" action="/admin" className="relative">
            <label htmlFor="dash-q" className="sr-only">
              ค้นหาใบสมัคร
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-48"
            />
            <input
              id="dash-q"
              name="q"
              type="search"
              placeholder="ค้นหาใบสมัคร"
              className="min-h-[44px] w-full min-w-[220px] rounded-input bg-canvas pl-11 pr-4 text-caption text-ink ring-1 ring-hairline ring-inset placeholder:text-ink-48 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink"
            />
          </form>

          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-input px-4 text-caption font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl hover:text-ink"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            ตัวกรอง
          </Link>

          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center px-2 text-caption font-semibold text-brand-ink transition-colors hover:text-brand"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-16 text-center text-caption text-ink-48">
          ไม่มีใบสมัครในกลุ่มนี้
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-y border-divider-soft bg-pearl/60">
                {[
                  "เลขที่ใบสมัคร",
                  "ประเภทร้าน",
                  "ร้านค้า",
                  "วันที่ส่ง",
                  "สถานะ",
                  "รอมาแล้ว",
                ].map((head) => (
                  <th
                    key={head}
                    scope="col"
                    className="whitespace-nowrap px-6 py-3.5 text-fine font-semibold text-ink-80"
                  >
                    {head}
                  </th>
                ))}
                <th scope="col" className="px-6 py-3.5 text-fine font-semibold text-ink-80">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const overdue = item.status === "New" && item.waitingDays >= 3;
                return (
                  <tr
                    key={item.applicationId}
                    className="border-b border-divider-soft last:border-b-0 transition-colors hover:bg-pearl/70"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-caption tabular-nums text-ink-80">
                      {item.applicationId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-caption text-ink-80">
                      {labelOf(SHOP_TYPES, item.shopType) || "ไม่ได้ระบุ"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block max-w-[22ch] truncate text-caption font-semibold text-ink">
                        {item.shopName}
                      </span>
                      {item.province ? (
                        <span className="block text-fine text-ink-48">{item.province}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-caption tabular-nums text-ink-80">
                      {item.submittedAt ? thaiDateTime.format(item.submittedAt) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex min-h-[26px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass(item.status)}`}
                      >
                        {STATUS_META[item.status].label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-caption tabular-nums text-ink-80">
                      {item.waitingDays === 0 ? "วันนี้" : `${item.waitingDays} วัน`}
                      {/* ทองไม่ใช่แดง — ใบที่ค้างนานคือเรื่องที่ต้องรีบ ไม่ใช่ความผิดพลาด
                          กฎเดียวกับธงเตือนในหน้าคิวงาน */}
                      {overdue ? (
                        <span className="ml-2 font-semibold text-gold-ink">เกิน 3 วัน</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/admin/${item.applicationId}`}
                        aria-label={`เปิดใบสมัคร ${item.applicationId} ของ ${item.shopName}`}
                        className="inline-flex size-10 items-center justify-center rounded-full text-ink-48 transition-colors hover:bg-pearl hover:text-ink"
                      >
                        <Eye aria-hidden className="size-[18px]" strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
