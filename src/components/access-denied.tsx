import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { Role } from "@/lib/auth/roles";

/**
 * หน้าปฏิเสธการเข้าถึง
 *
 * บอกตรง ๆ ว่าเข้าไม่ได้เพราะบทบาทไม่ถึง แทนที่จะเด้งกลับหน้าแรกเงียบ ๆ
 * เพราะคนที่มาถึงหน้านี้ส่วนใหญ่คือเจ้าหน้าที่ที่เผลอล็อกอินผิดบัญชี
 * ถ้าเด้งเฉย ๆ เขาจะไม่รู้ว่าเกิดอะไรขึ้นและลองซ้ำไปเรื่อย ๆ
 */
export function AccessDenied({
  reason,
  role,
  email,
}: {
  reason: "forbidden" | "inactive";
  role: Role;
  email: string;
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[520px] flex-col justify-center px-6 py-16">
      <ShieldAlert aria-hidden className="size-8 text-ink-48" strokeWidth={1.5} />

      <h1 className="mt-6 text-h3">
        {reason === "inactive" ? "บัญชีนี้ถูกปิดใช้งาน" : "บัญชีนี้ไม่มีสิทธิ์เข้าถึง"}
      </h1>

      <p className="mt-4 text-body text-ink-80">
        {reason === "inactive"
          ? "บัญชีของคุณถูกปิดใช้งาน จึงเข้าใช้ระบบหลังบ้านไม่ได้ กรุณาติดต่อผู้ดูแลระบบ"
          : "หน้านี้เปิดให้เฉพาะเจ้าหน้าที่ หากคุณเป็นเจ้าหน้าที่ อาจกำลังล็อกอินอยู่ด้วยบัญชีผิด"}
      </p>

      <dl className="mt-6 rounded-md bg-pearl p-4 text-caption ring-1 ring-hairline ring-inset">
        <div className="flex gap-3">
          <dt className="w-24 text-ink-48">บัญชีปัจจุบัน</dt>
          <dd className="flex-1 break-all">{email || "—"}</dd>
        </div>
        <div className="mt-2 flex gap-3">
          <dt className="w-24 text-ink-48">บทบาท</dt>
          <dd className="flex-1">{ROLE_LABELS[role]}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/me"
          className="inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
        >
          ไปหน้าใบสมัครของฉัน
        </Link>
        <Link
          href="/api/auth/signout"
          className="inline-flex min-h-[52px] items-center rounded-full bg-pearl px-7 text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
        >
          ออกจากระบบเพื่อเปลี่ยนบัญชี
        </Link>
      </div>
    </main>
  );
}
