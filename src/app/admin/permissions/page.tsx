import { Lock } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { guardRole } from "@/lib/auth/guard";
import { getEmployeePermissions } from "@/lib/auth/permissions";
import { PermissionsForm } from "./permissions-form";

export const metadata = { title: "สิทธิ์พนักงาน" };

/** กฎที่ฝังอยู่ในโค้ด ไม่ใช่ค่าที่เก็บในฐานข้อมูล — แยกออกมาเพื่อให้เหตุผลอยู่ติดกับกฎเสมอ */
const LOCKED_RULES = [
  {
    rule: "พนักงานเห็นใบสมัครทุกใบเสมอ",
    why: "ปิดแล้วบทบาทนี้ก็ไม่เหลือความหมาย",
  },
  {
    rule: "พนักงานแก้บทบาทและสิทธิ์ไม่ได้",
    why: "พนักงานที่แก้สิทธิ์ตัวเองได้ ก็คือแอดมิน",
  },
  {
    rule: "แอดมินมีสิทธิ์ทุกอย่างเสมอ",
    why: "ถ้าปรับได้ จะมีทางที่แอดมินตัดสิทธิ์ตัวเองจนแก้กลับไม่ได้",
  },
];

export default async function AdminPermissionsPage() {
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") return null;
    return <AccessDenied reason={guard.reason} role={guard.role} email={guard.email} />;
  }

  const permissions = await getEmployeePermissions();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8 lg:py-12">
      <p className="text-caption text-ink-48">ระบบหลังบ้าน</p>
      <h1 className="mt-1 text-h3 font-bold leading-[1.32] sm:text-h2">สิทธิ์พนักงาน</h1>

      <p className="mt-5 max-w-[66ch] text-lead text-ink-80">
        กำหนดว่าบทบาท <span className="font-semibold text-ink">พนักงานร้าน</span> ทำอะไรได้บ้าง
        มีผลกับพนักงานทุกคนพร้อมกัน
      </p>

      {/* บอกให้ชัดว่าอะไรปรับไม่ได้และเพราะอะไร ไม่ให้คนหาสวิตช์ที่ไม่มีอยู่
          พื้นดำเพราะเป็น "กฎที่ตายตัว" — ต่างระนาบจากสวิตช์ขาวด้านล่างที่กดเปลี่ยนได้จริง
          ถ้าสองอย่างนี้หน้าตาเหมือนกัน แอดมินจะไล่หาสวิตช์ของสามข้อนี้อยู่นาน */}
      <section className="mt-8 rounded-card bg-nav p-6 text-white shadow-soft sm:p-7">
        <h2 className="flex items-center gap-2.5 text-body font-semibold">
          <Lock aria-hidden className="size-[18px] text-gold" strokeWidth={2} />
          สิ่งที่ปรับไม่ได้
        </h2>
        <ul className="mt-4 space-y-3">
          {LOCKED_RULES.map(({ rule, why }) => (
            <li key={rule} className="flex items-start gap-3 text-caption leading-[1.7]">
              <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" />
              <span>
                <span className="font-semibold text-white">{rule}</span>
                <span className="text-white/55"> — {why}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <PermissionsForm initial={permissions} />

      <p className="mt-8 max-w-[70ch] rounded-input bg-pearl p-4 text-fine leading-[1.8] text-ink-48 ring-1 ring-hairline ring-inset">
        ทุกสิทธิ์ในหน้านี้ถูกตรวจซ้ำบนเซิร์ฟเวอร์ทุกครั้งที่มีการกระทำจริง
        ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ · การเปลี่ยนแปลงถูกบันทึกไว้ในประวัติที่หน้าผู้ใช้และบทบาท
      </p>
    </main>
  );
}
