"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Field, TextInput } from "@/components/ui/form-fields";
import {
  categoryInputSchema,
  fieldErrors,
  MAX_CATEGORY_NAME_LENGTH,
  type CategoryView,
} from "@/lib/pricing/schema";

/**
 * โมดัลเพิ่ม/แก้ชื่อประเภทสินค้า
 *
 * ใช้ <dialog> + showModal() แบบเดียวกับหน้ายืนยันใน /admin/users — ได้ backdrop, การกด Esc
 * และกับดักโฟกัสมาจากเบราว์เซอร์ ไม่ต้องเขียนเอง (คลาส login-dialog คือแอนิเมชันเปิดที่ globals.css)
 *
 * ตรวจฝั่งเบราว์เซอร์ด้วย schema ตัวเดียวกับที่ API ใช้ เพื่อให้ผู้ใช้เห็นข้อความเดียวกัน
 * ไม่ว่าจะถูกจับได้ที่ฝั่งไหน ฝั่งเซิร์ฟเวอร์ยังตรวจซ้ำเสมอ — ตรงนี้เป็นแค่ UX
 */
export function CategoryFormModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** มีค่า = โหมดแก้ไข ไม่มีค่า = โหมดเพิ่มใหม่ */
  category?: CategoryView;
  onClose: () => void;
  onSaved: (category: CategoryView) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(category);

  // เปิด/ปิดตัวจริงของ <dialog> ตาม prop และล้างค่าที่ค้างจากรอบก่อนทุกครั้งที่เปิดใหม่
  // ไม่งั้นข้อความ error ของประเภทที่เพิ่งแก้จะติดมาโผล่ในโมดัล "เพิ่มใหม่" ที่กดถัดไป
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setName(category?.name ?? "");
      setErrors({});
      setFormError(undefined);
      setSaving(false);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, category]);

  // Esc และการคลิกฉากหลังปิด <dialog> เองโดยไม่ผ่าน onClose — ต้องบอก parent ให้รู้ ไม่งั้น
  // state ฝั่ง parent จะยังคิดว่าโมดัลเปิดอยู่ แล้วกดปุ่มเดิมอีกทีจะไม่มีอะไรเกิดขึ้น
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onDialogClose = () => onClose();
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    dialog.addEventListener("close", onDialogClose);
    dialog.addEventListener("click", onBackdropClick);
    return () => {
      dialog.removeEventListener("close", onDialogClose);
      dialog.removeEventListener("click", onBackdropClick);
    };
  }, [onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    const parsed = categoryInputSchema.safeParse({ name });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const response = await fetch(
        isEdit ? `/api/admin/categories/${category!.id}` : "/api/admin/categories",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        category?: CategoryView;
        message?: string;
      };

      if (!response.ok || !payload.category) {
        // ชื่อซ้ำ (409) เป็นความผิดของช่องกรอก ไม่ใช่ของทั้งฟอร์ม จึงวางไว้ใต้ช่องนั้น
        if (response.status === 409) {
          setErrors({ name: payload.message ?? "มีประเภทสินค้าชื่อนี้อยู่แล้ว" });
        } else {
          setFormError(payload.message ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
        }
        return;
      }

      onSaved(payload.category);
    } catch {
      setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="category-form-title"
      className="login-dialog m-auto w-[min(92vw,30rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
    >
      <form onSubmit={submit} className="p-7 sm:p-8">
        <h2 id="category-form-title" className="text-h3 font-bold">
          {isEdit ? "แก้ไขประเภทสินค้า" : "เพิ่มประเภทสินค้า"}
        </h2>
        <p className="mt-2 text-caption text-ink-48">
          {isEdit
            ? "การเปลี่ยนชื่อมีผลกับสินค้าทุกรายการที่อยู่ในประเภทนี้ทันที"
            : "ประเภทที่เพิ่มใหม่จะเปิดใช้งานทันที และเลือกได้ในฟอร์มเพิ่มสินค้า"}
        </p>

        <div className="mt-6">
          <Field id="category-name" label="ชื่อประเภทสินค้า" required error={errors.name}>
            <TextInput
              id="category-name"
              value={name}
              onChange={setName}
              error={errors.name}
              placeholder="เช่น มือถือ, แท็บเล็ต, อุปกรณ์เสริม"
              maxLength={MAX_CATEGORY_NAME_LENGTH}
              autoFocus
            />
          </Field>
        </div>

        {formError ? (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
          >
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {formError}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex min-h-[52px] items-center justify-center rounded-btn px-6 text-body font-medium text-ink-80 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-brand px-7 text-body font-semibold text-on-brand shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-lift disabled:pointer-events-none disabled:opacity-60 motion-reduce:hover:translate-y-0"
          >
            {saving ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มประเภทสินค้า"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
