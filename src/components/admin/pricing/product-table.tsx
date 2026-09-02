"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { controlBase } from "@/components/ui/form-fields";
import {
  ADDON_STATUS_LABELS,
  formatBaht,
  formatDMY,
  PRODUCT_LIST_LIMIT,
  PRODUCT_STATUS_LABELS,
  type CategoryView,
  type ProductView,
} from "@/lib/pricing/schema";
import { ProductFormModal } from "./product-form-modal";

const SEARCH_DEBOUNCE_MS = 300;

const HEADINGS = [
  "ลำดับ",
  "ชื่อสินค้า",
  "ประเภท",
  "ความจุ",
  "ราคาจัด",
  "สามารถบวกเพิ่มได้",
  "สถานะบวกเพิ่ม",
  "สถานะเครื่อง",
  "วันที่",
  "จัดการ",
];

/**
 * ตารางสินค้าราคาจัด พร้อมค้นหา กรองตามประเภท และโมดัลเพิ่ม/แก้ไข
 *
 * การค้นและกรองยิงไปที่ /api/admin/products ทุกครั้ง ไม่ใช่กรองอาร์เรย์ในหน่วยความจำ —
 * รายการสินค้าโตได้เรื่อย ๆ และหน้านี้ดึงมาแค่ PRODUCT_LIST_LIMIT รายการต่อครั้ง
 * ถ้ากรองในเบราว์เซอร์ ผลลัพธ์จะเป็นการค้นในกองที่ถูกตัดมาแล้ว ซึ่งดูเหมือนใช้ได้จนกระทั่งวันที่สินค้าเกิน 500
 */
export function ProductTable({
  initialRows,
  categories,
  activeCategories,
}: {
  initialRows: ProductView[];
  /** ทุกประเภท ใช้กับดรอปดาวน์ตัวกรอง — ต้องหาสินค้าในประเภทที่ปิดไปแล้วได้ด้วย */
  categories: CategoryView[];
  /** เฉพาะประเภทที่เปิดใช้งาน ใช้กับดรอปดาวน์ในฟอร์ม */
  activeCategories: CategoryView[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductView>();

  const [pendingOff, setPendingOff] = useState<ProductView>();
  const [toggling, setToggling] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(undefined);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (categoryFilter) params.set("categoryId", categoryFilter);

        const response = await fetch(`/api/admin/products?${params}`, {
          cache: "no-store",
          signal,
        });
        const payload = (await response.json().catch(() => ({}))) as {
          products?: ProductView[];
          message?: string;
        };
        if (!response.ok || !payload.products) {
          setLoadError(payload.message ?? "โหลดรายการไม่สำเร็จ");
          return;
        }
        setRows(payload.products);
      } catch (error) {
        // การยกเลิกคำขอเก่าตอนผู้ใช้พิมพ์ตัวถัดไปไม่ใช่ข้อผิดพลาด ต้องไม่ขึ้นแถบแดง
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, categoryFilter],
  );

  /**
   * หน่วง 300ms ก่อนยิงคำค้น และยกเลิกคำขอรอบก่อนทุกครั้งที่พิมพ์ตัวใหม่
   *
   * การยกเลิกสำคัญพอ ๆ กับการหน่วง: ถ้าปล่อยให้คำขอเก่าวิ่งต่อ คำตอบของ "iPh" อาจกลับมาหลัง
   * คำตอบของ "iPhone" แล้วตารางจะแสดงผลของคำที่ผู้ใช้พิมพ์ไปแล้วสองตัวก่อนหน้า
   *
   * ข้ามรอบแรกทิ้ง เพราะข้อมูลชุดแรกถูกเรนเดอร์มาจากเซิร์ฟเวอร์แล้ว การยิงซ้ำทันทีที่หน้าโหลด
   * คือคำขอที่ไม่ได้เปลี่ยนอะไรเลย
   */
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  useEffect(() => {
    const dialog = confirmRef.current;
    if (!dialog) return;

    if (pendingOff && !dialog.open) dialog.showModal();
    if (!pendingOff && dialog.open) dialog.close();

    const onClose = () => setPendingOff(undefined);
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("click", onBackdropClick);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("click", onBackdropClick);
    };
  }, [pendingOff]);

  const setStatus = async (row: ProductView, status: "active" | "inactive") => {
    setActionError(undefined);
    setToggling(true);
    try {
      const response = await fetch(`/api/admin/products/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        setActionError(payload.message ?? "เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }
      confirmRef.current?.close();
      await load();
    } catch {
      setActionError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setToggling(false);
    }
  };

  const filtering = Boolean(query.trim() || categoryFilter);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[280px]">
            <label htmlFor="product-search" className="block text-caption font-semibold text-ink">
              ค้นหาสินค้า
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-48"
              />
              <input
                id="product-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ชื่อสินค้า เช่น iPhone"
                className={`${controlBase} pl-11`}
              />
            </div>
          </div>

          <div className="w-full sm:w-[220px]">
            <label htmlFor="product-filter" className="block text-caption font-semibold text-ink">
              ประเภทสินค้า
            </label>
            <select
              id="product-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={`${controlBase} mt-2 ${categoryFilter ? "" : "text-ink-48"}`}
            >
              <option value="">ทุกประเภท</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (ปิดใช้งาน)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={activeCategories.length === 0}
          title={
            activeCategories.length === 0
              ? "ต้องมีประเภทสินค้าที่เปิดใช้งานอย่างน้อยหนึ่งประเภทก่อน"
              : undefined
          }
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="inline-flex min-h-[52px] items-center gap-2 whitespace-nowrap rounded-btn bg-brand px-6 text-body font-semibold text-on-brand shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lift disabled:pointer-events-none disabled:opacity-50 motion-reduce:hover:translate-y-0"
        >
          <Plus aria-hidden className="size-[18px]" strokeWidth={2.5} />
          เพิ่มสินค้า
        </button>
      </div>

      <p className="mt-4 text-caption text-ink-48" aria-live="polite">
        {loading ? (
          "กำลังโหลด…"
        ) : (
          <>
            พบ <span className="font-semibold tabular-nums text-ink">{rows.length}</span> รายการ
            {rows.length === PRODUCT_LIST_LIMIT ? (
              <span className="pl-2 font-medium text-gold-ink">
                แสดงได้สูงสุด {PRODUCT_LIST_LIMIT} รายการ ใช้ช่องค้นหาเพื่อจำกัดผลลัพธ์
              </span>
            ) : null}
          </>
        )}
      </p>

      {loadError ? (
        <p
          role="alert"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {loadError}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-btn px-3 font-semibold ring-1 ring-danger/30 ring-inset transition-colors hover:bg-danger/10"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            ลองใหม่
          </button>
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {actionError}
        </p>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-card bg-canvas shadow-soft ring-1 ring-hairline/70">
        {rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            {/* สองสถานการณ์นี้แก้คนละวิธี — "ยังไม่มีของ" กับ "หาไม่เจอ" ต้องไม่ใช้ข้อความเดียวกัน */}
            <p className="text-body text-ink-48">
              {filtering ? "ไม่พบสินค้าที่ตรงกับที่ค้นหา" : "ยังไม่มีสินค้าราคาจัด"}
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-caption text-ink-48">
              {filtering
                ? "ลองแก้คำค้นหรือเปลี่ยนประเภทสินค้าที่กรองอยู่"
                : "กดปุ่มเพิ่มสินค้าเพื่อตั้งราคาจัดของรุ่นแรก"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1080 เป็นค่าที่วัดมา ไม่ใช่เดา: ความกว้างภายในของการ์ดที่ max-w-[1180px] คือ 1116px
                และสิบคอลัมน์นี้กางเต็มที่พอดี 1116 พอดี ถ้าตั้งพื้นสูงกว่านั้น (เคยเป็น 1140)
                จอกว้างจะขึ้นแถบเลื่อนแนวนอนทั้งที่ตารางไม่ได้ล้นเลย — พื้นต้องต่ำกว่า 1116 เสมอ
                กติกาเดียวกับ min-w ของกราฟบนแดชบอร์ด ถ้าเพิ่มคอลัมน์ต้องวัดใหม่ ไม่ใช่กะเอา */}
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-divider-soft bg-pearl/60">
                  {HEADINGS.map((head) => (
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
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-divider-soft transition-colors last:border-b-0 hover:bg-pearl/70"
                  >
                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption tabular-nums text-ink-48">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span className="block max-w-[26ch] truncate text-caption font-semibold text-ink">
                        {row.name}
                      </span>
                    </td>

                    {/* คอลัมน์นี้ตัดคำได้ ไม่ใช่ nowrap — เป็นวาล์วระบายความกว้างของทั้งตาราง
                        ชื่อประเภทที่แอดมินตั้งเองยาวได้ไม่จำกัด ("iPhone มือ1 เครื่องไทย") ถ้าห้ามตัดคำ
                        ตารางจะดันเกินการ์ดแล้วคอลัมน์ "จัดการ" ที่อยู่ขวาสุดหลุดขอบไป
                        ซึ่งเป็นคอลัมน์ที่มีปุ่มให้กด — คอลัมน์ที่ควรหลุดน้อยที่สุดในตาราง */}
                    <td className="px-4 py-4 align-middle">
                      <span className="text-caption text-ink-80">{row.category?.name ?? "—"}</span>
                      {row.category && !row.category.isActive ? (
                        <span className="block text-fine font-medium text-gold-ink">
                          ประเภทปิดใช้งาน
                        </span>
                      ) : null}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption text-ink-80">
                      {row.capacity}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption font-semibold tabular-nums text-ink">
                      {formatBaht(row.arrangedPrice)}
                    </td>

                    {/* คำตอบของ "สินค้าชิ้นนี้บวกเพิ่มได้เท่าไร" คือเพดาน และต้องอ่านออกว่าเป็น
                        ขีดจำกัด ไม่ใช่จำนวนที่ต้องบวก จึงขึ้นต้นด้วยคำว่า "ไม่เกิน" ทุกแถว
                        แถว OVER ตอบว่า "บวกเพิ่มไม่ได้" แทนเลข 0 — ใต้หัวคอลัมน์ที่ขึ้นต้นว่า "สามารถ…"
                        เลข 0 อ่านได้สองแง่ (ยังไม่ได้ตั้งค่า หรือ ห้ามบวก) ส่วนประโยคนี้อ่านได้แง่เดียว */}
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

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      {/* OVER เป็นชิปทอง เพราะเป็นข้อยกเว้นที่ต้องกวาดตาเจอเร็ว ส่วน "ปกติ" เป็นชิปเทา
                          กติกาเดียวกับชิปประเภทร้านในคิวใบสมัคร — สีที่แจกทั่วถึงกันไม่ได้บอกอะไรเลย */}
                      <span
                        className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${
                          row.addon.status === "over"
                            ? "bg-gold text-[#0a0a0a]"
                            : "bg-pearl text-ink-80 ring-1 ring-hairline ring-inset"
                        }`}
                      >
                        {ADDON_STATUS_LABELS[row.addon.status]}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      <span
                        className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${
                          row.status === "active"
                            ? "bg-nav text-white"
                            : "bg-pearl text-ink-48 ring-1 ring-hairline ring-inset"
                        }`}
                      >
                        {PRODUCT_STATUS_LABELS[row.status]}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle text-caption tabular-nums text-ink-80">
                      {formatDMY(row.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 align-middle">
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                          className="inline-flex min-h-[44px] items-center rounded-btn px-4 text-caption font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl hover:text-ink"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          disabled={toggling}
                          onClick={() =>
                            row.status === "active" ? setPendingOff(row) : setStatus(row, "active")
                          }
                          className="inline-flex min-h-[44px] items-center rounded-btn px-4 text-caption font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl hover:text-ink disabled:opacity-50"
                        >
                          {row.status === "active" ? "ปิด" : "เปิด"}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ProductFormModal
        open={formOpen}
        product={editing}
        categories={activeCategories}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void load();
        }}
      />

      <dialog
        ref={confirmRef}
        aria-labelledby="product-confirm-title"
        className="login-dialog m-auto w-[min(92vw,30rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
      >
        <div className="p-7 sm:p-8">
          <h2 id="product-confirm-title" className="text-h3 font-bold">
            ปิดการใช้งานสินค้านี้?
          </h2>
          <p className="mt-4 text-body text-ink-80">
            <span className="font-semibold">{pendingOff?.name}</span>{" "}
            {pendingOff?.capacity ? `(${pendingOff.capacity})` : ""} จะถูกตั้งสถานะเครื่องเป็น
            ปิดใช้งาน
          </p>
          <p className="mt-5 rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
            ราคาจัด{" "}
            <span className="font-semibold tabular-nums">
              {formatBaht(pendingOff?.arrangedPrice ?? 0)}
            </span>{" "}
            บาท และกฎบวกเพิ่มยังถูกเก็บไว้ครบ ไม่ได้ถูกลบ กดเปิดใช้งานคืนได้ทุกเมื่อ
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => confirmRef.current?.close()}
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn px-6 text-body font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={toggling || !pendingOff}
              onClick={() => pendingOff && setStatus(pendingOff, "inactive")}
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-nav px-6 text-body font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {toggling ? "กำลังบันทึก…" : "ยืนยันปิดการใช้งาน"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
