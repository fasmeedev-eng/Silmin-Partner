"use client";

import type { ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import type { Option } from "@/lib/application/options";

/* ── โครงร่างของช่องกรอกหนึ่งช่อง ────────────────────────────────
   label / คำอธิบาย / ข้อความ error ต้องผูกกับ input ด้วย id เสมอ
   เพื่อให้ screen reader อ่านออกและการแตะที่ label โฟกัสเข้าช่อง          */

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-caption font-semibold text-ink">
        {label}
        {required ? <span className="pl-1 text-brand">*</span> : null}
      </label>
      {hint ? <p className="mt-1 text-fine text-ink-48">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-fine text-danger-ink"
        >
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2.25} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * วงโฟกัสเป็นสี "หมึก" (เกือบดำ) ไม่ใช่แดงของแบรนด์ — จงใจ
 *
 * แบรนด์แดง #EF2027 กับ danger #DC2626 เป็นสีที่ตาแยกกันแทบไม่ออก ถ้าใช้แดงเป็นวงโฟกัสด้วย
 * ช่องที่กำลังพิมพ์อยู่กับช่องที่กรอกผิดจะหน้าตาเหมือนกันเป๊ะ ซึ่งเป็นการทำลายสัญญาณที่สำคัญที่สุด
 * ของฟอร์ม ในฟอร์มนี้ "แดง = ผิด" เท่านั้น ส่วนแบรนด์แดงไปอยู่ที่ปุ่ม แถบความคืบหน้า
 * ดอกจันช่องบังคับ และตัวเลือกที่ถูกเลือก ซึ่งไม่มีทางสับสนกับ error ได้
 *
 * focus-visible:outline-none กันเส้นโฟกัสของเบราว์เซอร์มาซ้อนกับ ring ที่วาดเอง (เห็นเป็นเส้นคู่)
 */
/** ส่งออกไว้ให้ช่องกรอกที่ต้องเขียนเอง (เช่น select ที่ค่ากับป้ายไม่ใช่ตัวเดียวกัน)
 *  ใช้คลาสชุดเดียวกันได้ แทนที่จะคัดลอกไปแล้ววันหนึ่งวงโฟกัสของสองที่ไม่เหมือนกัน */
export const controlBase =
  "w-full min-h-[52px] rounded-input bg-canvas px-4 text-body text-ink ring-1 ring-hairline ring-inset " +
  "placeholder:text-ink-48 transition-shadow focus:outline-none focus-visible:outline-none " +
  "focus:ring-2 focus:ring-ink";

export const controlError = "ring-2 ring-danger bg-danger/[0.04]";

export function TextInput({
  id,
  value,
  onChange,
  error,
  ...rest
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${controlBase} ${error ? controlError : ""}`}
      {...rest}
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  error?: string;
  /** ใช้กับตัวเลือกที่ต้องรอเลือกช่องก่อนหน้าก่อน เช่น อำเภอรอจังหวัด ตำบลรออำเภอ */
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${controlBase} ${error ? controlError : ""} ${
        value ? "" : "text-ink-48"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/* ── ตัวเลือกแบบกด ────────────────────────────────────────────────
   ซ่อน input จริงไว้ (sr-only) แล้ววาดกล่องเอง เพราะ accent-color ของเบราว์เซอร์
   จะวาดเครื่องหมายถูกด้วยสีที่เราคุมไม่ได้ แต่ยังคงใช้ input จริงอยู่
   คีย์บอร์ดและ screen reader จึงทำงานตามปกติ

   กรอบของตัวที่เลือกเป็นสีหมึก ไม่ใช่แดง ด้วยเหตุผลเดียวกับวงโฟกัสข้างบน — ช่องที่กรอกผิดก็เป็น
   กรอบแดง + พื้นแดงจางเหมือนกัน ถ้าตัวเลือกที่เลือกไว้ใช้แดงด้วย ทั้งสองอย่างจะหน้าตาเหมือนกันเป๊ะ
   แดงในกลุ่มนี้เหลืออยู่ที่จุด/เครื่องหมายถูกข้างในเท่านั้น ซึ่งเป็นรูปทรงคนละแบบกับกรอบ ไม่สับสนกัน */

const optionRow =
  "group flex min-h-[56px] cursor-pointer items-center gap-3 rounded-input px-4 py-2.5 ring-1 ring-hairline ring-inset " +
  "transition-all hover:bg-pearl has-[:checked]:bg-pearl has-[:checked]:ring-2 has-[:checked]:ring-ink " +
  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 " +
  "has-[:focus-visible]:outline-ink";

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  error,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  error?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-describedby={error ? `${name}-error` : undefined}
      className="grid gap-2.5 sm:grid-cols-2"
    >
      {options.map((option) => (
        <label key={option.value} className={optionRow}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas transition-colors group-has-[:checked]:border-brand group-has-[:checked]:bg-brand">
            <span className="size-2 rounded-full bg-on-brand opacity-0 group-has-[:checked]:opacity-100" />
          </span>
          <span className="text-body">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function CheckboxGroup({
  name,
  values,
  onChange,
  options,
  error,
}: {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: readonly Option[];
  error?: string;
}) {
  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  return (
    <div
      aria-describedby={error ? `${name}-error` : undefined}
      className="grid gap-2.5 sm:grid-cols-2"
    >
      {options.map((option) => (
        <label key={option.value} className={optionRow}>
          <input
            type="checkbox"
            name={name}
            value={option.value}
            checked={values.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="sr-only"
          />
          <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-hairline bg-canvas transition-colors group-has-[:checked]:border-brand group-has-[:checked]:bg-brand">
            <Check
              aria-hidden
              strokeWidth={3}
              className="size-3.5 text-on-brand opacity-0 group-has-[:checked]:opacity-100"
            />
          </span>
          <span className="text-body">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/** เช็กบ็อกซ์เดี่ยวสำหรับข้อความยินยอม — ต้องไม่ติ๊กมาให้ล่วงหน้าเสมอ */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className={`group flex cursor-pointer items-start gap-3 rounded-input p-5 ring-1 ring-inset transition-all ${
          error ? "bg-danger/[0.04] ring-2 ring-danger" : "ring-hairline"
        } hover:bg-pearl has-[:checked]:bg-pearl has-[:checked]:ring-2 has-[:checked]:ring-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-hairline bg-canvas transition-colors group-has-[:checked]:border-brand group-has-[:checked]:bg-brand">
          <Check
            aria-hidden
            strokeWidth={3}
            className="size-3.5 text-on-brand opacity-0 group-has-[:checked]:opacity-100"
          />
        </span>
        <span className="text-caption leading-[1.7] text-ink-80">{children}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-fine text-danger-ink">
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2.25} />
          {error}
        </p>
      ) : null}
    </div>
  );
}
