import { AccessDenied } from "@/components/access-denied";
import { guardRole } from "@/lib/auth/guard";
import { getEmployeePermissions } from "@/lib/auth/permissions";
import { PermissionsForm } from "./permissions-form";

export const metadata = { title: "สิทธิ์พนักงาน" };

export default async function AdminPermissionsPage() {
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") return null;
    return <AccessDenied reason={guard.reason} role={guard.role} email={guard.email} />;
  }

  const permissions = await getEmployeePermissions();

  return (
    <>

      <main className="mx-auto w-full  px-6 py-10 sm:px-8">
        <p className="text-caption text-ink-48">ระบบหลังบ้าน</p>
        <h1 className="mt-1 text-h3 sm:text-h2">สิทธิ์พนักงาน</h1>

        <p className="mt-6 max-w-[64ch] text-body text-ink-80">
          กำหนดว่าบทบาท <span className="font-semibold">พนักงานร้าน</span> ทำอะไรได้บ้าง
          มีผลกับพนักงานทุกคนพร้อมกัน
        </p>

        {/* บอกให้ชัดว่าอะไรปรับไม่ได้และเพราะอะไร ไม่ให้คนหาสวิตช์ที่ไม่มีอยู่ */}
        <div className="mt-6 rounded-lg bg-parchment p-5 ring-1 ring-hairline ring-inset">
          <h2 className="text-caption font-semibold text-ink">สิ่งที่ปรับไม่ได้</h2>
          <ul className="mt-2 space-y-1.5 text-caption text-ink-80">
            <li>
              <span className="font-semibold">พนักงานเห็นใบสมัครทุกใบเสมอ</span> —
              ปิดแล้วบทบาทนี้ก็ไม่เหลือความหมาย
            </li>
            <li>
              <span className="font-semibold">พนักงานแก้บทบาทและสิทธิ์ไม่ได้</span> —
              พนักงานที่แก้สิทธิ์ตัวเองได้ ก็คือแอดมิน
            </li>
            <li>
              <span className="font-semibold">แอดมินมีสิทธิ์ทุกอย่างเสมอ</span> —
              ถ้าปรับได้ จะมีทางที่แอดมินตัดสิทธิ์ตัวเองจนแก้กลับไม่ได้
            </li>
          </ul>
        </div>

        <PermissionsForm initial={permissions} />

        <p className="mt-8 text-fine text-ink-48">
          ทุกสิทธิ์ในหน้านี้ถูกตรวจซ้ำบนเซิร์ฟเวอร์ทุกครั้งที่มีการกระทำจริง
          ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ · การเปลี่ยนแปลงถูกบันทึกไว้ในประวัติที่หน้าผู้ใช้และบทบาท
        </p>
      </main>
    </>
  );
}
