"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { controlBase } from "@/components/ui/form-fields";
import { formatBaht, type PartnerProductView } from "@/lib/pricing/schema";

/**
 * ตารางราคาจัดสำหรับร้านพาร์ทเนอร์ — อ่านอย่างเดียว หกคอลัมน์ตามที่ผู้ใช้กำหนด
 *
 * ไม่มีคอลัมน์สถานะบวกเพิ่ม สถานะเครื่อง วันที่ และจัดการ ที่หลังบ้านมี และไม่ใช่เพราะซ่อนไว้ —
 * ข้อมูลพวกนั้นไม่ได้ถูกส่งมาถึงคอมโพเนนต์นี้เลย (ดู PartnerProductView) จึงวาดออกมาไม่ได้
 * แม้จะเผลอเขียนโค้ดวาด คอมไพเลอร์จะเป็นคนบอกก่อน
 *
 * ค้นหาและกรองทำในหน่วยความจำ ไม่ยิง API เพิ่ม — ต่างจากหน้าหลังบ้านโดยตั้งใจ ที่นั่นยิง API
 * เพราะรายการโตได้เรื่อย ๆ และมีสิทธิ์เป็นตัวคุมอยู่แล้ว ส่วนที่นี่การเปิดเส้นทาง API ใหม่
 * ให้ฝั่งพาร์ทเนอร์คือการเพิ่มพื้นที่ที่ต้องคอยกันสิทธิ์ ทั้งที่รายการทั้งชุดถูกส่งมากับหน้าอยู่แล้ว
 */
export function ProductPriceTable({ rows }: { rows: PartnerProductView[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  // ประเภทมาจากรายการจริงที่ส่งมา ไม่ได้ดึงตารางประเภททั้งหมด — ประเภทที่ยังไม่มีสินค้าเปิดขาย
  // ไม่ควรอยู่ในตัวกรอง เพราะเลือกแล้วจะได้ตารางว่างเสมอ ซึ่งอ่านเหมือนระบบพัง
  const categories = useMemo(
    () => [...new Set(rows.map((row) => row.categoryName).filter(Boolean))].sort(),
    [rows],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (category && row.categoryName !== category) return false;
      if (!term) return true;
      // ค้นชื่อกับความจุ — หน้าร้านมักพิมพ์ "16 pro 256" รวดเดียว
      return `${row.name} ${row.capacity}`.toLowerCase().includes(term);
    });
  }, [rows, query, category]);

  const filtering = Boolean(query.trim() || category);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-[280px]">
          <label
            htmlFor="partner-product-search"
            className="block text-caption font-semibold text-ink"
          >
            ค้นหาสินค้า
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-48"
            />
            <input
              id="partner-product-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="เช่น iPhone 16 หรือ 256GB"
              className={`${controlBase} pl-11`}
            />
          </div>
        </div>

        {categories.length > 1 ? (
          <div className="w-full sm:w-[240px]">
            <label
              htmlFor="partner-product-category"
              className="block text-caption font-semibold text-ink"
            >
              ประเภทสินค้า
            </label>
            <select
              id="partner-product-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${controlBase} mt-2 ${category ? "" : "text-ink-48"}`}
            >
              <option value="">ทุกประเภท</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-caption text-ink-48" aria-live="polite">
        พบ <span className="font-semibold tabular-nums text-ink">{visible.length}</span> รายการ
      </p>

      <section className="mt-4 overflow-hidden rounded-card bg-canvas shadow-soft ring-1 ring-hairline/70">
        {visible.length === 0 ? (
          <div className="px-6 py-20 text-center">
            {/* "ยังไม่มีของ" กับ "หาไม่เจอ" แก้คนละวิธี จึงต้องไม่ใช้ข้อความเดียวกัน */}
            <p className="text-body text-ink-48">
              {filtering ? "ไม่พบสินค้าที่ตรงกับที่ค้นหา" : "ยังไม่มีสินค้าราคาจัดในระบบ"}
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-caption text-ink-48">
              {filtering
                ? "ลองแก้คำค้นหรือเปลี่ยนประเภทสินค้าที่กรองอยู่"
                : "เมื่อทีมงานเพิ่มรายการแล้ว ราคาจะขึ้นที่หน้านี้ทันที"}
            </p>
          </div>
        ) : (
          // ตารางเลื่อนแนวนอนในกล่องของตัวเอง หน้าเว็บทั้งหน้าต้องไม่เลื่อนตาม
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-left">
              <thead>
                <tr className="border-b border-divider-soft bg-pearl/60">
                  {[
                    "ลำดับ",
                    "ชื่อสินค้า",
                    "ประเภท",
                    "ความจุ",
                    "ราคาจัด",
                    "สามารถบวกเพิ่มได้",
                  ].map((head) => (
                    <th
                      key={head}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3.5 text-fine font-semibold text-ink-80"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-divider-soft transition-colors last:border-b-0 hover:bg-pearl/70"
                  >
                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption tabular-nums text-ink-48">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span className="block text-caption font-semibold text-ink">{row.name}</span>
                    </td>

                    <td className="px-4 py-4 align-middle text-caption text-ink-80">
                      {row.categoryName || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption text-ink-80">
                      {row.capacity}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption font-semibold tabular-nums text-ink">
                      {formatBaht(row.arrangedPrice)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      {row.addon.status === "over" ? (
                        <span className="text-caption text-ink-48">บวกเพิ่มไม่ได้</span>
                      ) : (
                        <span className="text-caption text-ink-80">
                          ไม่เกิน{" "}
                          <span className="font-semibold tabular-nums text-ink">
                            {formatBaht(row.addon.maxLimit)}
                          </span>{" "}
                          <span className="text-fine text-ink-48">บาท</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
