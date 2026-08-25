"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, CircleCheck } from "lucide-react";
import { PERMISSION_DEFS, type EmployeePermissions } from "@/lib/auth/permission-defs";
import { savePermissionsAction } from "./actions";

export function PermissionsForm({ initial }: { initial: EmployeePermissions }) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeePermissions>(initial);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const dirty = PERMISSION_DEFS.some((def) => values[def.id] !== initial[def.id]);

  const save = () => {
    setError(undefined);
    setDone(false);
    start(async () => {
      const result = await savePermissionsAction(values);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  return (
    <div className="mt-8">
      {error ? (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
          {error}
        </p>
      ) : null}
      {done && !dirty ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2.5 rounded-input bg-pearl p-4 text-caption font-medium text-ink ring-1 ring-hairline ring-inset"
        >
          <CircleCheck aria-hidden className="size-[18px] shrink-0 text-brand" />
          บันทึกแล้ว มีผลภายใน 30 วินาที
        </p>
      ) : null}

      {/* ติ๊กถูกเป็นแดง แต่กรอบของตัวที่เปิดอยู่เป็นดำ — กฎเดียวกับฟอร์มสมัคร
          แดงในกรอบต้องแปลว่า "ผิด" อย่างเดียว ไม่ใช่ "เลือกอยู่" */}
      <ul className="space-y-3">
        {PERMISSION_DEFS.map((def) => (
          <li key={def.id}>
            <label className="group flex cursor-pointer items-start gap-4 rounded-card bg-canvas p-5 shadow-soft ring-1 ring-hairline/70 transition-all has-[:checked]:ring-2 has-[:checked]:ring-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink sm:p-6">
              <input
                type="checkbox"
                checked={values[def.id]}
                onChange={(e) => setValues((v) => ({ ...v, [def.id]: e.target.checked }))}
                className="sr-only"
              />
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-hairline bg-canvas transition-colors group-has-[:checked]:border-brand group-has-[:checked]:bg-brand">
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className="size-3.5 text-on-brand opacity-0 group-has-[:checked]:opacity-100"
                />
              </span>
              <span>
                <span className="block text-body font-semibold">{def.label}</span>
                <span className="mt-1.5 block max-w-[62ch] text-caption leading-[1.7] text-ink-80">
                  {def.description}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={save}
        disabled={pending || !dirty}
        className="mt-7 inline-flex min-h-[56px] items-center rounded-btn bg-nav px-8 text-body font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50 motion-reduce:hover:translate-y-0"
      >
        {pending ? "กำลังบันทึก…" : dirty ? "บันทึกสิทธิ์" : "ยังไม่มีการเปลี่ยนแปลง"}
      </button>
    </div>
  );
}
