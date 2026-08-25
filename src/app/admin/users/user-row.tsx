"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, TriangleAlert, User, UserCog, type LucideIcon } from "lucide-react";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/auth/roles";
import { changeRoleAction, toggleActiveAction } from "./actions";

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
});

/** อธิบายว่าแต่ละบทบาททำอะไรได้ ในหน้ายืนยัน — ชื่อบทบาทเปล่า ๆ ไม่พอให้ตัดสินใจ */
const ROLE_EFFECT: Record<Role, string> = {
  customer: "เห็นเฉพาะใบสมัครของตัวเอง เข้าระบบหลังบ้านไม่ได้",
  employee: "เข้าหลังบ้านได้ ดูใบสมัครทุกใบ ทำได้ตามสิทธิ์ที่ตั้งไว้ในหน้าสิทธิ์พนักงาน",
  admin: "ทำได้ทุกอย่าง รวมถึงแก้บทบาทและสิทธิ์ของคนอื่น",
};

/** ไอคอนต่อบทบาท ช่วยกวาดหาแอดมิน/พนักงานในลิสต์ยาว ๆ ได้โดยไม่ต้องอ่านทุกแถว */
const ROLE_ICONS: Record<Role, LucideIcon> = {
  customer: User,
  employee: UserCog,
  admin: ShieldCheck,
};

export function UserRow({
  user,
  isSelf,
}: {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
    lastLoginAt?: string;
  };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [nextRole, setNextRole] = useState<Role>();
  const [pending, start] = useTransition();
  const confirmRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = confirmRef.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    const onClose = () => setNextRole(undefined);
    dialog.addEventListener("click", onClick);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  const RoleIcon = ROLE_ICONS[user.role];

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(undefined);
    start(async () => {
      const result = await fn();
      confirmRef.current?.close();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <li className="rounded-card bg-canvas p-5 shadow-soft ring-1 ring-hairline/70 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-pearl text-ink-48"
            >
              <RoleIcon className="size-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold">{user.name || "—"}</p>
              <p className="break-all text-caption text-ink-48">{user.email}</p>
              {/* ชิปแทนตัวหนังสือ — แถวนี้คือแถวเดียวที่ปุ่มทั้งสองถูกปิดไว้ ต้องเห็นเหตุผลก่อนจะงงว่าทำไมกดไม่ได้ */}
              {isSelf ? (
                <span className="mt-1.5 inline-flex min-h-[24px] items-center rounded-full bg-gold px-2.5 text-fine font-semibold text-[#0a0a0a]">
                  นี่คือบัญชีของคุณ
                </span>
              ) : null}
            </div>
          </div>
          <p className="text-fine text-ink-48">
            เข้าระบบล่าสุด {user.lastLoginAt ? thaiDate.format(new Date(user.lastLoginAt)) : "—"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor={`role-${user.id}`}
              className="block text-caption font-semibold text-ink"
            >
              บทบาท
            </label>
            <select
              id={`role-${user.id}`}
              value={user.role}
              disabled={isSelf || pending}
              title={isSelf ? "เปลี่ยนบทบาทของตัวเองไม่ได้ ให้แอดมินคนอื่นเปลี่ยนให้" : undefined}
              onChange={(e) => {
                setNextRole(e.target.value as Role);
                confirmRef.current?.showModal();
              }}
              className="mt-2 min-h-[52px] rounded-input bg-canvas px-4 text-body text-ink ring-1 ring-hairline ring-inset focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-ink disabled:opacity-50"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-caption font-semibold text-ink">สถานะบัญชี</p>
            <button
              type="button"
              disabled={isSelf || pending}
              onClick={() => run(() => toggleActiveAction({ userId: user.id, active: !user.active }))}
              title={isSelf ? "ปิดบัญชีของตัวเองไม่ได้" : undefined}
              className={`mt-2 inline-flex min-h-[52px] items-center rounded-btn px-6 text-body font-medium transition-colors disabled:opacity-50 ${
                user.active
                  ? "bg-pearl text-ink ring-1 ring-hairline ring-inset hover:bg-danger/10 hover:text-danger-ink hover:ring-danger/25 focus-visible:outline-danger-focus"
                  : "bg-nav text-white"
              }`}
            >
              {user.active ? "ใช้งานอยู่ — กดเพื่อปิด" : "ปิดอยู่ — กดเพื่อเปิด"}
            </button>
          </div>
        </div>

        <p className="mt-3 max-w-[60ch] text-fine text-ink-48">{ROLE_EFFECT[user.role]}</p>

        {error ? (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-input bg-danger/[0.06] p-4 text-caption text-danger-ink ring-1 ring-danger/25 ring-inset"
          >
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </li>

      {/* ยืนยันก่อนเปลี่ยนบทบาท เพราะเป็นการกดที่ให้หรือถอนสิทธิ์เข้าถึงข้อมูลส่วนบุคคล */}
      <dialog
        ref={confirmRef}
        aria-labelledby={`confirm-role-${user.id}`}
        className="login-dialog m-auto w-[min(92vw,28rem)] rounded-card bg-canvas p-0 text-ink shadow-lift backdrop:bg-black/60"
      >
        <div className="p-8">
          <h2 id={`confirm-role-${user.id}`} className="text-h3 font-bold">
            ยืนยันการเปลี่ยนบทบาท
          </h2>
          <p className="mt-4 text-body text-ink-80">
            <span className="font-semibold">{user.name || user.email}</span> จะเปลี่ยนจาก{" "}
            <span className="font-semibold">{ROLE_LABELS[user.role]}</span> เป็น{" "}
            <span className="font-semibold">{nextRole ? ROLE_LABELS[nextRole] : "—"}</span>
          </p>
          {nextRole ? (
            <p className="mt-5 rounded-input bg-pearl p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-hairline ring-inset">
              {ROLE_EFFECT[nextRole]}
            </p>
          ) : null}
          <p className="mt-4 text-fine text-ink-48">
            มีผลภายใน 30 วินาที และถูกบันทึกไว้ในประวัติว่าคุณเป็นคนเปลี่ยน
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
              disabled={pending || !nextRole}
              onClick={() =>
                nextRole && run(() => changeRoleAction({ userId: user.id, role: nextRole }))
              }
              className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-nav px-6 text-body font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "กำลังบันทึก…" : "ยืนยันเปลี่ยนบทบาท"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
