"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  controlBase,
  controlError,
  Field,
  RadioGroup,
  TextInput,
} from "@/components/ui/form-fields";
import {
  ADDON_STATUS_OPTIONS,
  DEFAULT_MAX_ADDON_LIMIT,
  fieldErrors,
  formatBaht,
  MAX_CAPACITY_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  productInputSchema,
  type AddonStatus,
  type CategoryView,
  type ProductView,
} from "@/lib/pricing/schema";

/**
 * โมดัลเพิ่ม/แก้ไขสินค้าราคาจัด
 *
 * ทุกช่องเก็บเป็นสตริงเสมอ ช่องที่ยังไม่กรอกคือค่าว่าง ไม่ใช่ undefined — กติกาเดียวกับฟอร์มใบสมัคร
 * ที่ทำให้ controlled input ของ React ไม่สลับไปเป็น uncontrolled กลางคัน แล้ว schema
 * เป็นคนแปลงเป็นตัวเลขให้ตอนตรวจ
 *
 * **บวกเพิ่มมีช่องเดียว คือเพดาน** เดิมมีสองช่อง (จำนวนเงินบวกเพิ่ม + เพดาน) แล้วถอด
 * "จำนวนเงินบวกเพิ่ม" ออกตามที่ผู้ใช้ระบุ เพราะสิ่งที่ร้านพาร์ทเนอร์ต้องรู้คือ
 * "สินค้าชิ้นนี้บวกเพิ่มจากราคาจัดได้ ไม่เกินเท่าไร" ซึ่งเป็นคำถามที่เพดานตอบอยู่แล้ว
 * สองช่องทำให้ตอบไม่ได้ว่าตัวไหนคือคำตอบ — ดูหัวข้อคำศัพท์ใน @/lib/pricing/schema
 */
export function ProductFormModal({
  open,
  product,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** มีค่า = โหมดแก้ไข ไม่มีค่า = โหมดเพิ่มใหม่ */
  product?: ProductView;
  /** เฉพาะประเภทที่เปิดใช้งาน — ที่มาของกฎ "เลือกได้เฉพาะประเภทที่ isActive" ฝั่งหน้าเว็บ */
  categories: CategoryView[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [arrangedPrice, setArrangedPrice] = useState("");
  const [addonStatus, setAddonStatus] = useState<AddonStatus>("normal");
  const [maxAddonLimit, setMaxAddonLimit] = useState(String(DEFAULT_MAX_ADDON_LIMIT));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(product);

  /**
   * ประเภทที่สินค้าใบนี้ผูกอยู่อาจถูกปิดใช้งานไปแล้วหลังจากที่มันถูกสร้าง ซึ่งแปลว่ามันจะไม่อยู่ใน
   * รายการ categories ที่ส่งเข้ามา ถ้าปล่อยไว้ <select> จะเด้งกลับไปเป็นค่าว่างเงียบ ๆ แล้วคนแก้
   * จะเผลอบันทึกทับด้วยประเภทอื่นโดยไม่รู้ตัว จึงเติมตัวเลือกของเดิมกลับเข้าไปพร้อมป้ายกำกับ
   */
  const currentCategory = product?.category;
  const missingCurrent =
    currentCategory && !categories.some((c) => c.id === currentCategory.id)
      ? currentCategory
      : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setCategoryId(product?.category?.id ?? "");
      setName(product?.name ?? "");
      setCapacity(product?.capacity ?? "");
      setArrangedPrice(product ? String(product.arrangedPrice) : "");
      setAddonStatus(product?.addon.status ?? "normal");
      // ใช้ || ไม่ใช่ ?? โดยตั้งใจ — สินค้าที่เป็น OVER เก็บเพดานเป็น 0 ในฐานข้อมูล
      // ถ้าคนแก้สลับกลับมาเป็น "ปกติ" ต้องเจอค่าเริ่มต้น 2,000 ไม่ใช่ 0 ที่ระบบจะปฏิเสธทันที
      setMaxAddonLimit(String(product?.addon.maxLimit || DEFAULT_MAX_ADDON_LIMIT));
      setErrors({});
      setFormError(undefined);
      setSaving(false);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, product]);

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

    // ส่งเพดานที่พิมพ์ไว้ไปตามจริงแม้ตอนเลือก OVER — ชั้นฐานข้อมูลเป็นคนบังคับให้เป็น 0
    // ที่เดียว ถ้าให้ฟอร์มแปลงเองด้วยจะกลายเป็นกติกาเดียวกันสองที่ ซึ่งวันหนึ่งจะไม่ตรงกัน
    const payload = {
      categoryId,
      name,
      capacity,
      arrangedPrice,
      addonStatus,
      maxAddonLimit,
    };

    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const response = await fetch(
        isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        // ประเภทถูกปิดใช้งานระหว่างที่โมดัลเปิดค้าง — เป็นความผิดของช่อง "ประเภทสินค้า" ไม่ใช่ของทั้งฟอร์ม
        if (response.status === 409) {
          setErrors({ categoryId: body.message ?? "ประเภทสินค้านี้ถูกปิดใช้งานแล้ว" });
        } else {
          setFormError(body.message ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
        }
        return;
      }

      onSaved();
    } catch {
      setFormError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const limitNumber = Number(maxAddonLimit) || DEFAULT_MAX_ADDON_LIMIT;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="product-form-title"
      className="login-dialog m-auto max-h-[92vh] w-[min(94vw,38rem)] overflow-y-auto rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
    >
      <form onSubmit={submit} className="p-7 sm:p-8">
        <h2 id="product-form-title" className="text-h3 font-bold">
          {isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
        </h2>
        <p className="mt-2 text-caption text-ink-48">
          ราคาจัดคือยอดผ่อนชำระ (ราคาเต็ม − ราคาดาวน์) ไม่ใช่ราคาขายเต็ม
        </p>

        <div className="mt-6 space-y-5">
          <Field id="product-category" label="ประเภทสินค้า" required error={errors.categoryId}>
            <select
              id="product-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-invalid={errors.categoryId ? true : undefined}
              aria-describedby={errors.categoryId ? "product-category-error" : undefined}
              className={`${controlBase} ${errors.categoryId ? controlError : ""} ${
                categoryId ? "" : "text-ink-48"
              }`}
            >
              <option value="">เลือกประเภทสินค้า</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              {missingCurrent ? (
                <option value={missingCurrent.id}>{missingCurrent.name} (ปิดใช้งานแล้ว)</option>
              ) : null}
            </select>
          </Field>

          {missingCurrent ? (
            <p className="rounded-input bg-gold-soft p-4 text-fine leading-[1.7] text-ink-80 ring-1 ring-gold/40 ring-inset">
              ประเภท <span className="font-semibold">{missingCurrent.name}</span> ถูกปิดใช้งานไปแล้ว
              ถ้ากดบันทึกโดยไม่เปลี่ยนประเภท ระบบจะไม่ยอมให้ผ่าน — เลือกประเภทอื่น
              หรือไปเปิดใช้งานประเภทเดิมคืนก่อน
            </p>
          ) : null}

          <Field id="product-name" label="ชื่อสินค้า" required error={errors.name}>
            <TextInput
              id="product-name"
              value={name}
              onChange={setName}
              error={errors.name}
              placeholder="เช่น iPhone 16 Pro"
              maxLength={MAX_PRODUCT_NAME_LENGTH}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="product-capacity" label="ความจุ" required error={errors.capacity}>
              <TextInput
                id="product-capacity"
                value={capacity}
                onChange={setCapacity}
                error={errors.capacity}
                placeholder="เช่น 128GB"
                maxLength={MAX_CAPACITY_LENGTH}
              />
            </Field>

            <Field
              id="product-price"
              label="ราคาจัด (บาท)"
              required
              error={errors.arrangedPrice}
            >
              <TextInput
                id="product-price"
                value={arrangedPrice}
                onChange={setArrangedPrice}
                error={errors.arrangedPrice}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="15000"
                className="tabular-nums"
              />
            </Field>
          </div>

          <Field id="product-addon-status" label="สถานะบวกเพิ่ม" required error={errors.addonStatus}>
            <RadioGroup
              name="addonStatus"
              value={addonStatus}
              onChange={(value) => setAddonStatus(value as AddonStatus)}
              options={ADDON_STATUS_OPTIONS}
              error={errors.addonStatus}
            />
          </Field>

          {/* ซ่อนเพดานเมื่อเลือก OVER — OVER แปลว่าบวกเพิ่มไม่ได้เลย เพดานจึงไม่มีความหมาย
              และระบบบันทึกเป็น 0 ให้อยู่แล้ว ช่องที่กรอกไปก็ไม่มีผลไม่ควรอยู่ให้เห็น */}
          {addonStatus === "over" ? (
            <p className="rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
              สถานะ <span className="font-semibold">OVER</span> คือ
              สินค้านี้บวกเพิ่มจากราคาจัดไม่ได้เลย ตารางจะแสดงว่า
              <span className="font-semibold">บวกเพิ่มไม่ได้</span> ให้ร้านพาร์ทเนอร์เห็น
            </p>
          ) : (
            <Field
              id="product-addon-limit"
              label="เพดานบวกเพิ่ม (บาท)"
              required
              hint="ร้านพาร์ทเนอร์บวกจากราคาจัดได้ไม่เกินจำนวนนี้ ค่าเริ่มต้น 2,000 ปรับเฉพาะสินค้ารายการนี้"
              error={errors.maxAddonLimit}
            >
              <TextInput
                id="product-addon-limit"
                value={maxAddonLimit}
                onChange={setMaxAddonLimit}
                error={errors.maxAddonLimit}
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                className="tabular-nums"
              />
            </Field>
          )}

          {/* ทวนให้เห็นเป็นประโยคเดียวกับที่ร้านจะได้อ่านในตาราง — ตัวเลขในช่องกรอกบอกแค่ว่า
              "พิมพ์อะไรลงไป" ไม่ได้บอกว่าคนอ่านปลายทางจะเข้าใจว่าอย่างไร */}
          {addonStatus === "normal" && limitNumber > 0 ? (
            <p className="rounded-input bg-gold-soft p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-gold/40 ring-inset">
              ร้านพาร์ทเนอร์จะเห็นว่า: บวกเพิ่มจากราคาจัดได้{" "}
              <span className="font-semibold text-ink">ไม่เกิน {formatBaht(limitNumber)} บาท</span>
            </p>
          ) : null}
        </div>

        {formError ? (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
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
            {saving ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
