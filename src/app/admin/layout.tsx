import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { AccessDenied } from "@/components/access-denied";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { guardRole } from "@/lib/auth/guard";
import { countUnread, listNotifications } from "@/lib/db/notifications";
import { countByStatus } from "@/lib/db/applications";

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

  const [items, unread, statusCounts] = await Promise.all([
    listNotifications(staff.userId),
    countUnread(staff.userId),
    countByStatus(),
  ]);
  const notifications = { items, unread };

  // สร้าง server action ที่นี่แล้วส่งลงไปเป็น prop เพราะทั้งแถบข้างและแถบบนเป็น client-facing
  // สองชุดเพราะพื้นหลังคนละสี ปุ่มขาวจาง ๆ บนพื้นขาวจะมองไม่เห็นเลย
  const signOutForm = (className: string) => (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className={className}>
        <LogOut aria-hidden className="size-4" />
        ออกจากระบบ
      </button>
    </form>
  );

  const signOutDark = signOutForm(
    "inline-flex min-h-[44px] w-full items-center gap-2 rounded-btn px-3.5 text-caption font-medium text-white/70 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/[0.08] hover:text-white",
  );
  const signOutLight = signOutForm(
    "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn px-3.5 text-caption font-medium text-ink-80 ring-1 ring-inset ring-hairline transition-colors hover:bg-pearl hover:text-ink",
  );

  return (
    <div className="surface-tint min-h-svh">
      <AdminSidebar
        role={staff.role}
        email={staff.email}
        name={staff.name}
        signOutButton={signOutDark}
        pendingCount={statusCounts.New ?? 0}
      />
      <div className="lg:pl-64">
        <AdminTopbar
          role={staff.role}
          email={staff.email}
          name={staff.name}
          signOutButton={signOutLight}
          notifications={notifications}
        />
        {children}
      </div>
    </div>
  );
}
