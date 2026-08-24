"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleCheck } from "lucide-react";
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
        <p role="alert" className="mb-4 rounded-md bg-danger/10 p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset">
          {error}
        </p>
      ) : null}
      {done && !dirty ? (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-md bg-pearl p-4 text-caption text-ink ring-1 ring-hairline ring-inset">
          <CircleCheck aria-hidden className="size-4 shrink-0 text-accent-ink" />
          บันทึกแล้ว มีผลภายใน 30 วินาที
        </p>
      ) : null}

      <ul className="space-y-3">
        {PERMISSION_DEFS.map((def) => (
          <li key={def.id}>
            <label className="group flex cursor-pointer items-start gap-4 rounded-lg bg-canvas p-5 ring-1 ring-hairline ring-inset transition-colors hover:bg-pearl has-[:checked]:bg-pearl has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-focus">
              <input
                type="checkbox"
                checked={values[def.id]}
                onChange={(e) => setValues((v) => ({ ...v, [def.id]: e.target.checked }))}
                className="sr-only"
              />
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-hairline bg-canvas group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className="size-3.5 text-on-accent opacity-0 group-has-[:checked]:opacity-100"
                />
              </span>
              <span>
                <span className="block text-body font-semibold">{def.label}</span>
                <span className="mt-1 block max-w-[62ch] text-caption text-ink-80">
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
        className="mt-6 inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-body font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "กำลังบันทึก…" : dirty ? "บันทึกสิทธิ์" : "ยังไม่มีการเปลี่ยนแปลง"}
      </button>
    </div>
  );
}
