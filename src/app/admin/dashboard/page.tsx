import Link from "next/link";
import { ClipboardList, Download, Inbox, TriangleAlert } from "lucide-react";
import { guardRole } from "@/lib/auth/guard";
import { countUnread, listNotifications } from "@/lib/db/notifications";
import {
  RANGE_LABELS,
  listRecentApplications,
  loadDashboard,
  parseRange,
  type RangeDays,
} from "@/lib/db/dashboard";
import { kpiBucketById, type KpiBucketId } from "@/lib/application/status";
import { RangePicker } from "@/components/admin/dashboard/range-picker";
import { RecentNotifications } from "@/components/admin/dashboard/recent-notifications";
import { RecentTable } from "@/components/admin/dashboard/recent-table";
import { TrendChart } from "@/components/admin/dashboard/trend-chart";
import { TypeDonut } from "@/components/admin/dashboard/type-donut";
import { BucketStatCard, TotalStatCard } from "@/components/admin/dashboard/stat-card";
import type { TrendPolarity } from "@/components/admin/trend-line";

export const metadata = { title: "แดชบอร์ด" };

const RECENT_LIMIT = 8;

/**
 * สีวงแหวนและทิศทางที่ "ดี" ของแต่ละกอง เก็บไว้ที่นี่ไม่ใช่ใน KPI_BUCKETS
 * เพราะ KPI_BUCKETS เป็นไฟล์ข้อมูลล้วนที่ฝั่งเซิร์ฟเวอร์ใช้กรองคิวรีด้วย การยัดคลาส
 * กับชื่อโทเคน CSS ลงไปจะทำให้ไฟล์นั้นผูกกับการแสดงผลโดยไม่จำเป็น (กฎเดียวกับ BUCKET_ICONS)
 *
 * ไม่มีสีเขียวในระบบ กองที่ผลลัพธ์ดีจึงใช้ดำ ไม่ใช่เขียว
 */
const BUCKET_STYLE: Record<KpiBucketId, { ring: string; polarity: TrendPolarity }> = {
  pending: { ring: "var(--gold)", polarity: "neutral" },
  approved: { ring: "var(--nav)", polarity: "more-is-good" },
  rejected: { ring: "var(--danger)", polarity: "less-is-good" },
  needinfo: { ring: "var(--gold-deep)", polarity: "less-is-good" },
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const result = await guardRole(["admin", "employee"]);
  if (!result.allowed) return null;
  const { staff } = result;

  const params = await searchParams;
  const range = parseRange(params.range);
  const tab = kpiBucketById(params.tab)?.id ?? "all";
  const tabStatuses = kpiBucketById(tab)?.statuses;

  const [data, recent, notificationItems, unread] = await Promise.all([
    loadDashboard(range),
    listRecentApplications(tabStatuses, RECENT_LIMIT),
    listNotifications(staff.userId, 4),
    countUnread(staff.userId),
  ]);

  const href = (next: { range?: RangeDays; tab?: string }) => {
    const search = new URLSearchParams();
    const nextRange = next.range ?? range;
    const nextTab = next.tab ?? tab;
    if (nextRange !== 7) search.set("range", String(nextRange));
    if (nextTab !== "all") search.set("tab", nextTab);
    const query = search.toString();
    return query ? `/admin/dashboard?${query}` : "/admin/dashboard";
  };

  const todoCount = data.statusCounts.New ?? 0;

  // แถบเตือนขึ้นเฉพาะตอนที่มีเรื่องต้องทำจริง วันที่ไม่มีอะไรค้างหน้านี้ต้องสะอาด
  // ถ้าแถบนี้อยู่ตลอดเวลา มันจะกลายเป็นสิ่งที่ตาข้ามไปภายในสัปดาห์เดียว
  const alerts: string[] = [];
  if (data.oldestWaitingDays !== null && data.oldestWaitingDays >= 3) {
    alerts.push(`มีใบที่รอตรวจมาแล้ว ${data.oldestWaitingDays} วัน`);
  }
  if (data.stalledNeedInfo > 0) {
    alerts.push(`${data.stalledNeedInfo} ใบรอข้อมูลจากผู้สมัครเกิน 7 วัน`);
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-caption text-ink-48">สวัสดี {staff.name || staff.email}</p>
          <h1 className="mt-1.5 text-h3 font-bold leading-[1.28] sm:text-h2">ภาพรวมระบบ</h1>
          <p className="mt-2 text-body text-ink-80">
            ติดตามภาพรวมการทำงานของระบบและข้อมูลสำคัญ
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {/* ปุ่มนี้ดาวน์โหลด CSV จริงจาก /admin/export ไม่ใช่ปุ่มประดับ */}
          <a
            href="/admin/export"
            download
            className="inline-flex min-h-[48px] items-center gap-2 rounded-input bg-canvas px-4 text-caption font-medium text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
          >
            <Download aria-hidden className="size-4 shrink-0 text-ink-48" />
            ดาวน์โหลดรายงาน
          </a>

          <RangePicker active={range} hrefFor={(r) => href({ range: r })} />

          {/* แดงทึบใบเดียวบนหน้า และเป็นงานจริงของวันนี้ ไม่ใช่ปุ่ม "สร้างใหม่" แบบต้นแบบ
              เจ้าหน้าที่ไม่ได้เป็นคนสร้างใบสมัคร ร้านเป็นคนส่งเข้ามาเอง */}
          <Link
            href="/admin?tab=pending"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-btn bg-brand px-5 text-caption font-semibold text-on-brand shadow-soft transition-colors hover:bg-brand-hover"
          >
            <Inbox aria-hidden className="size-4 shrink-0" />
            {todoCount > 0 ? `ตรวจใบที่รออยู่ (${todoCount})` : "ไปที่คิวใบสมัคร"}
          </Link>
        </div>
      </div>

      <section aria-label="ตัวเลขสรุป" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TotalStatCard
          total={data.total}
          trend={data.totalTrend}
          caption="ไม่รวมร่างที่ยังไม่ได้ส่ง"
          icon={ClipboardList}
        />

        {/* กดการ์ดแล้วตารางล่างกรองเป็นกองนั้นทันที — ตารางนั้นแบ่งด้วยนิยามเดียวกันเป๊ะ
            ต่างจากการลิงก์ไปหน้าคิวงาน ซึ่งแบ่งกองด้วยคำถามคนละแบบแล้วตัวเลขจะไม่ตรงกัน */}
        {data.buckets.map((bucket) => {
          const style = BUCKET_STYLE[bucket.id];
          return (
            <BucketStatCard
              key={bucket.id}
              label={bucket.label}
              count={bucket.count}
              share={bucket.share}
              trend={bucket.trend}
              polarity={style.polarity}
              ringColor={style.ring}
              href={`${href({ tab: bucket.id })}#recent`}
            />
          );
        })}
      </section>

      {alerts.length > 0 ? (
        <p
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-input bg-gold-soft px-5 py-3.5 text-caption text-ink-80 ring-1 ring-inset ring-gold/45"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-ink" />
          <span>{alerts.join(" · ")}</span>
        </p>
      ) : null}

      {/* min-w-0 บนการ์ดทั้งสามใบเป็นข้อบังคับ ไม่ใช่ของแถม — ลูกของ grid มี min-width:auto
          เป็นค่าเริ่มต้น มันจึงไม่ยอมแคบกว่าเนื้อหาข้างใน แล้วกล่อง overflow-x-auto ของกราฟ
          จะดันทั้งหน้าให้เลื่อนซ้ายขวาแทนที่จะเลื่อนอยู่ในกล่องตัวเอง (วัดได้ 197px บนจอ 390)

          สามคอลัมน์เริ่มที่ 2xl ไม่ใช่ xl — แถบข้างกิน 256px ไปแล้ว ที่ความกว้าง 1280–1440
          (โน้ตบุ๊กส่วนใหญ่) การ์ดกราฟจะเหลือ ~390px แล้วป้ายแกนย่อจนอ่านไม่ออก
          ช่วงนั้นจึงให้กราฟกินเต็มแถว แล้ววางโดนัทกับการแจ้งเตือนคู่กันข้างล่าง */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-[1.25fr_0.9fr_0.95fr]">
        <section className="min-w-0 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70 lg:col-span-2 2xl:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-body font-semibold text-ink">งานเข้าและงานที่ทำไป</h2>
            <span className="inline-flex min-h-[32px] items-center rounded-full bg-pearl px-3.5 text-fine font-medium text-ink-80 ring-1 ring-inset ring-hairline">
              {RANGE_LABELS[range]}
            </span>
          </div>
          <TrendChart points={data.daily} />
        </section>

        <section className="min-w-0 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
          <h2 className="text-body font-semibold text-ink">แบ่งตามประเภทร้าน</h2>
          <TypeDonut slices={data.types} total={data.total} />
        </section>

        <section className="min-w-0 rounded-card bg-canvas p-6 shadow-soft ring-1 ring-hairline/70">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body font-semibold text-ink">
              การแจ้งเตือนล่าสุด
              {unread > 0 ? (
                <span className="ml-2 inline-flex min-w-[22px] justify-center rounded-full bg-brand px-1.5 text-fine font-semibold text-on-brand">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </h2>
            <Link
              href="/admin"
              className="shrink-0 text-caption font-semibold text-brand-ink transition-colors hover:text-brand"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <RecentNotifications items={notificationItems} />
        </section>
      </div>

      <div id="recent" className="mt-4 scroll-mt-24">
        <RecentTable items={recent} activeTab={tab} tabHref={(t) => href({ tab: t })} />
      </div>
    </main>
  );
}
