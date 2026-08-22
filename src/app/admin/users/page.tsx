import { AccessDenied } from "@/components/access-denied";
import { guardRole } from "@/lib/auth/guard";
import { listUsers } from "@/lib/db/users";
import { listAdminAudit } from "@/lib/db/audit";
import { UserRow } from "./user-row";

export const metadata = { title: "ผู้ใช้และบทบาท" };

const thaiDateTime = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminUsersPage() {
  // หน้านี้เข้มกว่า layout — layout ปล่อย employee เข้ามาได้ แต่การแก้บทบาทต้องเป็น admin เท่านั้น
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") return null;
    return <AccessDenied reason={guard.reason} role={guard.role} email={guard.email} />;
  }

  const [users, audit] = await Promise.all([listUsers(), listAdminAudit(20)]);

  return (
    <>

      <main className="mx-auto w-full  px-6 py-10 sm:px-8">
        <p className="text-caption text-ink-48">ระบบหลังบ้าน</p>
        <h1 className="mt-1 text-h3 sm:text-h2">ผู้ใช้และบทบาท</h1>

        <p className="mt-6 max-w-[64ch] text-caption text-ink-80">
          ทุกคนที่เข้าสู่ระบบด้วย Google จะถูกสร้างเป็น{" "}
          <span className="font-semibold">ลูกค้า</span> โดยอัตโนมัติ
          การยกระดับเป็นพนักงานหรือแอดมินต้องทำที่นี่ และทุกการเปลี่ยนแปลงถูกบันทึกไว้
        </p>

        <ul className="mt-8 space-y-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              isSelf={user.id === guard.staff.userId}
              user={{
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                active: user.active,
                lastLoginAt: user.lastLoginAt?.toISOString(),
              }}
            />
          ))}
        </ul>

        <p className="mt-4 text-fine text-ink-48">
          การเปลี่ยนแปลงมีผลภายใน 30 วินาที ผู้ใช้ไม่ต้องออกจากระบบแล้วเข้าใหม่ ·
          หากแอดมินทุกคนถูกล็อกออกจากระบบ ใช้{" "}
          <code className="rounded-sm bg-pearl px-1.5 py-0.5">
            node scripts/set-role.mjs &lt;email&gt; admin
          </code>{" "}
          กู้คืนได้
        </p>

        <section className="mt-10">
          <h2 className="text-body font-semibold">ประวัติการเปลี่ยนสิทธิ์</h2>
          {audit.length === 0 ? (
            <p className="mt-3 text-caption text-ink-48">ยังไม่มีการเปลี่ยนแปลง</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {audit.map((entry, index) => (
                <li
                  key={`${entry.at.toISOString()}-${index}`}
                  className="border-l-2 border-hairline pl-4"
                >
                  <p className="text-caption text-ink">
                    {entry.targetEmail ? `${entry.targetEmail}: ` : ""}
                    {entry.detail}
                  </p>
                  <p className="mt-0.5 text-fine text-ink-48">
                    {thaiDateTime.format(entry.at)} · โดย {entry.actorEmail}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
