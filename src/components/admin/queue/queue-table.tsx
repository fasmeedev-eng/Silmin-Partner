import Link from "next/link";
import { AlertCircle, Eye, TriangleAlert } from "lucide-react";
import type { ApplicationStatus } from "@/lib/db/applications";
import {
  STATUS_META,
  STATUS_TRACK,
  statusBarClass,
  statusChipClass,
  trackIndex,
} from "@/lib/application/status";
import { SHOP_TYPES, labelOf } from "@/lib/application/options";
import { documentsComplete, missingCategories } from "@/lib/application/categories";
import type { DocumentRef } from "@/lib/application/documents";
import { ShopAvatar } from "./shop-avatar";

/**
 * ตารางคิวใบสมัคร
 *
 * เดิมหน้านี้เป็นการ์ดหนึ่งใบต่อหนึ่งแถว เปลี่ยนมาเป็นตารางตามดีไซน์ที่ผู้ใช้กำหนด
 * สิ่งที่ต้องรักษาไว้จากของเดิมคือเนื้อหา ไม่ใช่รูปทรง: ชื่อร้านยังมาก่อนเลขที่ใบสมัคร
 * (คนจำชื่อร้านได้ ไม่มีใครจำ SG-2026-000004) อายุคิวยังเขียนเป็นคำว่ารอมากี่วัน
 * และใบที่ค้างเกินสามวันยังติดธงทอง ทั้งสามอย่างคือเหตุผลที่หน้านี้ใช้งานได้
 *
 * ไม่มีช่องติ๊กเลือกหลายแถวแบบในดีไซน์ต้นแบบ เพราะระบบยังไม่มีคำสั่งที่ทำกับหลายใบพร้อมกัน
 * และการเปลี่ยนสถานะทีละหลายใบเป็นสิ่งที่ไม่ควรมี — NeedMoreInfo กับ Rejected บังคับให้
 * ต้องมีข้อความถึงผู้สมัครรายใบ (requiresMessage) ช่องติ๊กที่กดแล้วไม่มีอะไรให้ทำ
 * แย่กว่าไม่มีช่องติ๊ก
 */

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const thaiTime = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
});

const TOTAL_STAGES = STATUS_TRACK.length;

/**
 * ชิปประเภทร้าน — "ร้านมือถือ" คือประเภทหลักของธุรกิจนี้ จึงเป็นชิปทอง ส่วนที่เหลือเป็นขอบเทา
 * เจตนาคือให้กวาดตาเจอร้านนอกกลุ่มหลักได้เร็ว ไม่ใช่ระบายสีให้ครบทุกประเภท
 * (สีที่แจกทั่วถึงกันไม่ได้บอกอะไรเลย)
 */
function typeChipClass(type: string): string {
  return type === "mobile"
    ? "bg-gold-soft text-gold-ink ring-gold/40"
    : "bg-canvas text-ink-80 ring-hairline";
}

export interface QueueRow {
  applicationId: string;
  shopName: string;
  shopType: string;
  contactName: string;
  phone: string;
  province: string;
  status: ApplicationStatus;
  submittedAt: Date | null;
  documents: DocumentRef[];
}

function waitingDays(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function waitingLabel(days: number): string {
  if (days <= 0) return "เข้ามาวันนี้";
  if (days === 1) return "รอมา 1 วัน";
  return `รอมา ${days} วัน`;
}

export function QueueTable({ rows }: { rows: QueueRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-20 text-center text-body text-ink-48">
        ไม่พบใบสมัครที่ตรงกับตัวกรองนี้
      </p>
    );
  }

  return (
    // ตารางเลื่อนแนวนอนในกล่องของตัวเอง หน้าเว็บทั้งหน้าต้องไม่เลื่อนตาม
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1060px] border-collapse text-left">
        <thead>
          <tr className="border-y border-divider-soft bg-pearl/60">
            {[
              "เลขที่ใบสมัคร",
              "ข้อมูลผู้สมัคร",
              "ประเภทร้าน",
              "วันที่สมัคร",
              "สถานะ",
              "ความคืบหน้า",
              "จัดการ",
            ].map((head) => (
              <th
                key={head}
                scope="col"
                className="whitespace-nowrap px-6 py-3.5 text-fine font-semibold text-ink-80"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const days = waitingDays(row.submittedAt);
            const overdue = row.status === "New" && days >= 3;
            const complete = documentsComplete(row.documents);
            const missing = missingCategories(row.documents);
            // ทั้งห้าขั้นของ STATUS_TRACK — ใบที่ไม่ผ่านค้างอยู่ขั้นตรวจสอบ ซึ่ง trackIndex
            // จัดการให้แล้ว จึงไม่ต้องเทียบสถานะซ้ำที่นี่
            const stage = Math.max(1, trackIndex(row.status) + 1);

            return (
              <tr
                key={row.applicationId}
                className="border-b border-divider-soft transition-colors last:border-b-0 hover:bg-pearl/70"
              >
                <td className="whitespace-nowrap px-6 py-4 align-middle">
                  <span className="text-caption font-semibold tabular-nums text-ink">
                    {row.applicationId}
                  </span>
                  <span
                    className={`mt-0.5 flex items-center gap-1 text-fine ${overdue ? "font-semibold text-gold-ink" : "text-ink-48"}`}
                  >
                    {overdue ? <AlertCircle aria-hidden className="size-3.5 shrink-0" /> : null}
                    {waitingLabel(days)}
                  </span>
                </td>

                <td className="px-6 py-4 align-middle">
                  <span className="flex items-center gap-3">
                    <ShopAvatar name={row.shopName} />
                    <span className="min-w-0">
                      <span className="block max-w-[24ch] truncate text-caption font-semibold text-ink">
                        {row.shopName}
                      </span>
                      <span className="block max-w-[24ch] truncate text-fine text-ink-80">
                        {row.contactName}
                      </span>
                      <span className="block text-fine tabular-nums text-ink-48">
                        {row.phone || "—"}
                      </span>
                    </span>
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 align-middle">
                  <span
                    className={`inline-flex min-h-[30px] items-center rounded-input px-3 text-fine font-medium ring-1 ring-inset ${typeChipClass(row.shopType)}`}
                  >
                    {labelOf(SHOP_TYPES, row.shopType) || "ไม่ได้ระบุ"}
                  </span>
                  {/* เอกสารไม่ครบเป็นทอง ไม่ใช่แดง — เป็นงานที่ต้องตาม ไม่ใช่ความผิดพลาด
                      กฎเดียวกับธงใบค้างนาน และเหมือนคอลัมน์ ครบ/ไม่ครบ เดิมของหน้านี้ */}
                  {complete ? null : (
                    <span className="mt-1 flex items-center gap-1 text-fine font-medium text-gold-ink">
                      <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
                      ขาด{missing.map((c) => c.label).join(" และ ")}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-6 py-4 align-middle">
                  <span className="block text-caption tabular-nums text-ink-80">
                    {row.submittedAt ? thaiDate.format(row.submittedAt) : "—"}
                  </span>
                  <span className="block text-fine tabular-nums text-ink-48">
                    {row.submittedAt ? `${thaiTime.format(row.submittedAt)} น.` : ""}
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 align-middle">
                  <span
                    className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${statusChipClass(row.status)}`}
                  >
                    {STATUS_META[row.status].label}
                  </span>
                </td>

                <td className="px-6 py-4 align-middle">
                  <span className="block text-caption font-medium tabular-nums text-ink">
                    {stage}/{TOTAL_STAGES}
                  </span>
                  <span
                    role="img"
                    aria-label={`ขั้นที่ ${stage} จาก ${TOTAL_STAGES} — ${STATUS_TRACK[stage - 1]?.label ?? ""}`}
                    className="mt-1.5 block h-1.5 w-[120px] overflow-hidden rounded-full bg-divider-soft"
                  >
                    <span
                      aria-hidden
                      className={`block h-full rounded-full ${statusBarClass(row.status)}`}
                      style={{ width: `${(stage / TOTAL_STAGES) * 100}%` }}
                    />
                  </span>
                </td>

                <td className="whitespace-nowrap px-6 py-4 align-middle">
                  <Link
                    href={`/admin/${row.applicationId}`}
                    aria-label={`เปิดใบสมัคร ${row.applicationId} ของ ${row.shopName}`}
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
  );
}
