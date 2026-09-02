"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RotateCcw, TriangleAlert } from "lucide-react";
import { formatDMY, type CategoryRow } from "@/lib/pricing/schema";
import { CategoryFormModal } from "./category-form-modal";

/**
 * ตารางประเภทสินค้า พร้อมปุ่มเพิ่ม โมดัลแก้ไข และหน้ายืนยันก่อนปิดใช้งาน
 *
 * เกาะ client ทั้งก้อนอยู่ที่นี่ ส่วน page.tsx เป็น server component ที่ดึงข้อมูลรอบแรก
 * แล้วส่งลงมาเป็น prop — หน้าเว็บจึงมีข้อมูลตั้งแต่ HTML ชุดแรก ไม่ต้องเห็นตารางว่าง ๆ ก่อนแล้วค่อยเด้ง
 *
 * หลังบันทึกทุกครั้งเรียก refresh() ดึงรายการใหม่ทั้งชุด แทนที่จะเอาแถวที่ API ส่งกลับมายัดเข้า state
 * เพราะแถวในตารางมี productCount ซึ่งเป็นค่าที่คำนวณจากตารางอื่น การเดาเองมีโอกาสคลาดเคลื่อน
 */
export function CategoryTable({ initialRows }: { initialRows: CategoryRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow>();

  const [pendingOff, setPendingOff] = useState<CategoryRow>();
  const [toggling, setToggling] = useState(false);
  const confirmRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const response = await fetch("/api/admin/categories", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        categories?: CategoryRow[];
        message?: string;
      };
      if (!response.ok || !payload.categories) {
        setLoadError(payload.message ?? "โหลดรายการไม่สำเร็จ");
        return;
      }
      setRows(payload.categories);
    } catch {
      setLoadError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  // เปิด/ปิดหน้ายืนยันตาม state และแจ้ง parent เมื่อผู้ใช้กด Esc หรือคลิกฉากหลัง
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

  const setActive = async (row: CategoryRow, isActive: boolean) => {
    setActionError(undefined);
    setToggling(true);
    try {
      const response = await fetch(`/api/admin/categories/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        setActionError(payload.message ?? "เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }
      confirmRef.current?.close();
      await refresh();
    } catch {
      setActionError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-caption text-ink-48">
          ทั้งหมด <span className="font-semibold tabular-nums text-ink">{rows.length}</span> ประเภท
          {loading ? <span className="pl-2 text-ink-48">กำลังโหลด…</span> : null}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="inline-flex min-h-[52px] items-center gap-2 whitespace-nowrap rounded-btn bg-brand px-6 text-body font-semibold text-on-brand shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lift motion-reduce:hover:translate-y-0"
        >
          <Plus aria-hidden className="size-[18px]" strokeWidth={2.5} />
          เพิ่มประเภทสินค้า
        </button>
      </div>

      {loadError ? (
        <p
          role="alert"
          className="mt-5 flex flex-wrap items-center gap-3 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {loadError}
          <button
            type="button"
            onClick={refresh}
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
          className="mt-5 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {actionError}
        </p>
      ) : null}

      <section className="mt-5 overflow-hidden rounded-card bg-canvas shadow-soft ring-1 ring-hairline/70">
        {rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-body text-ink-48">ยังไม่มีประเภทสินค้า</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-caption text-ink-48">
              ต้องมีอย่างน้อยหนึ่งประเภทก่อน จึงจะเพิ่มสินค้าราคาจัดได้
            </p>
          </div>
        ) : (
          // ตารางเลื่อนแนวนอนในกล่องของตัวเอง หน้าเว็บทั้งหน้าต้องไม่เลื่อนตาม
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-divider-soft bg-pearl/60">
                  {["ลำดับ", "ชื่อประเภท", "สถานะ", "วันที่เพิ่ม", "จัดการ"].map((head) => (
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
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-divider-soft transition-colors last:border-b-0 hover:bg-pearl/70"
                  >
                    <td className="whitespace-nowrap px-6 py-4 align-middle text-caption tabular-nums text-ink-48">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <span className="block text-body font-semibold text-ink">{row.name}</span>
                      <span className="block text-fine tabular-nums text-ink-48">
                        สินค้า {row.productCount} รายการ
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 align-middle">
                      {/* ดำ = เรื่องนี้เรียบร้อยแล้ว / เทา = ปิดอยู่ ไม่มีอะไรต้องทำ
                          ตามกติกาชิปใน DESIGN.md — แดงของแบรนด์ห้ามอยู่บนชิป เพราะชิปไม่ใช่ของที่กดได้ */}
                      <span
                        className={`inline-flex min-h-[28px] items-center rounded-full px-3 text-fine font-semibold ${
                          row.isActive
                            ? "bg-nav text-white"
                            : "bg-pearl text-ink-48 ring-1 ring-hairline ring-inset"
                        }`}
                      >
                        {row.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 align-middle text-caption tabular-nums text-ink-80">
                      {formatDMY(row.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 align-middle">
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
                        {/* เปิดใช้งานทำได้ทันที ปิดต้องยืนยันก่อน — ทิศทางที่มีผลข้างเคียงคือทิศทางที่ต้องหยุดถาม */}
                        <button
                          type="button"
                          disabled={toggling}
                          onClick={() =>
                            row.isActive ? setPendingOff(row) : setActive(row, true)
                          }
                          className="inline-flex min-h-[44px] items-center rounded-btn px-4 text-caption font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl hover:text-ink disabled:opacity-50"
                        >
                          {row.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
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

      <CategoryFormModal
        open={formOpen}
        category={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void refresh();
        }}
      />

      {/* ยืนยันก่อนปิดใช้งาน — ทวนผลลัพธ์ให้ครบว่าอะไรเปลี่ยนและอะไรไม่เปลี่ยน
          ปุ่มยืนยันเป็นสีดำ ไม่ใช่แดง ตามกติกาหลังบ้าน: แดงสงวนไว้ให้ทางที่ย้อนกลับไม่ได้
          การปิดประเภทกดเปิดคืนได้ทันที จึงไม่ใช่การกระทำระดับนั้น */}
      <dialog
        ref={confirmRef}
        aria-labelledby="category-confirm-title"
        className="login-dialog m-auto w-[min(92vw,30rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
      >
        <div className="p-7 sm:p-8">
          <h2 id="category-confirm-title" className="text-h3 font-bold">
            ปิดการใช้งานประเภทนี้?
          </h2>
          <p className="mt-4 text-body text-ink-80">
            <span className="font-semibold">{pendingOff?.name}</span> จะไม่ปรากฏในตัวเลือกประเภท
            ตอนเพิ่มหรือแก้ไขสินค้าอีก
          </p>
          <p className="mt-5 rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
            สินค้า{" "}
            <span className="font-semibold tabular-nums">{pendingOff?.productCount ?? 0}</span>{" "}
            รายการที่อยู่ในประเภทนี้ยังอยู่ครบและยังใช้งานได้ตามสถานะเครื่องของตัวเอง
            การปิดประเภทไม่ได้ปิดสินค้า
          </p>
          <p className="mt-4 text-fine text-ink-48">กดเปิดใช้งานคืนได้ทุกเมื่อ</p>

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
              onClick={() => pendingOff && setActive(pendingOff, false)}
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
