import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { AccessDenied } from "@/components/access-denied";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { guardRole } from "@/lib/auth/guard";

/**
 * ด่านเดียวที่กัน /admin ทั้งหมด — ทุกหน้าใต้ /admin ผ่านที่นี่เสมอ
 *
 * ห้ามพึ่ง middleware เพียงอย่างเดียว มันตรวจได้แค่ว่ามี session ไม่รู้จักบทบาท
 * และห้ามถือว่า layout นี้พอสำหรับข้อมูล — หน้าที่เข้มกว่า (users, permissions)
 * เรียก guardRole(["admin"]) ซ้ำเองอีกชั้น และทุก action ตรวจสิทธิ์ของตัวเองด้วย
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await guardRole(["admin", "employee"]);

  if (!result.allowed) {
    if (result.reason === "unauthenticated") redirect("/login?callbackUrl=/admin");
    return <AccessDenied reason={result.reason} role={result.role} email={result.email} />;
  }

  const { staff } = result;

  // สร้าง server action ที่นี่แล้วส่งลงไปเป็น prop เพราะ AdminSidebar เป็น client component
  const signOutButton = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex min-h-[44px] w-full items-center rounded-md px-3 text-caption text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        ออกจากระบบ
      </button>
    </form>
  );

  return (
    <div className="min-h-svh bg-canvas">
      <AdminSidebar
        role={staff.role}
        email={staff.email}
        name={staff.name}
        signOutButton={signOutButton}
      />
      <div className="lg:pl-60">{children}</div>
    </div>
  );
}
