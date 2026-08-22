"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
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
        {required ? <span className="pl-1 text-accent-ink">*</span> : null}
      </label>
      {hint ? <p className="mt-1 text-fine text-ink-48">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-fine text-accent-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlBase =
  "w-full min-h-[52px] rounded-md bg-pearl px-4 text-body text-ink ring-1 ring-hairline ring-inset " +
  "placeholder:text-ink-48 focus:outline-none focus:ring-2 focus:ring-accent-ink";

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
      className={`${controlBase} ${error ? "ring-2 ring-accent-ink" : ""}`}
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
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  error?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${controlBase} ${error ? "ring-2 ring-accent-ink" : ""} ${
        value ? "" : "text-ink-48"
      }`}
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
   จะวาดเครื่องหมายถูกสีขาวบนพื้นเหลืองอ่อน ซึ่งมองไม่เห็น
   แต่ยังคงใช้ input จริงอยู่ คีย์บอร์ดและ screen reader จึงทำงานตามปกติ   */

const optionRow =
  "group flex min-h-[52px] cursor-pointer items-center gap-3 rounded-md px-4 py-2 ring-1 ring-hairline ring-inset " +
  "transition-colors hover:bg-pearl has-[:checked]:bg-pearl has-[:checked]:ring-2 has-[:checked]:ring-accent-ink " +
  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 " +
  "has-[:focus-visible]:outline-accent-focus";

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
      className="grid gap-2 sm:grid-cols-2"
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
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
            <span className="size-2 rounded-full bg-on-accent opacity-0 group-has-[:checked]:opacity-100" />
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
      className="grid gap-2 sm:grid-cols-2"
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
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-hairline bg-canvas group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
            <Check
              aria-hidden
              strokeWidth={3}
              className="size-3.5 text-on-accent opacity-0 group-has-[:checked]:opacity-100"
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
        className={`group flex cursor-pointer items-start gap-3 rounded-md p-4 ring-1 ring-inset transition-colors ${
          error ? "ring-2 ring-accent-ink" : "ring-hairline"
        } hover:bg-pearl has-[:checked]:bg-pearl has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-focus`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-hairline bg-canvas group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
          <Check
            aria-hidden
            strokeWidth={3}
            className="size-3.5 text-on-accent opacity-0 group-has-[:checked]:opacity-100"
          />
        </span>
        <span className="text-caption text-ink-80">{children}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-fine text-accent-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
