import { AccessDenied } from "@/components/access-denied";
import { CategoryTable } from "@/components/admin/pricing/category-table";
import { guardRole } from "@/lib/auth/guard";
import { listCategories } from "@/lib/db/pricing";

export const metadata = { title: "จัดการประเภทสินค้า" };

/**
 * หน้าจัดการประเภทสินค้า
 *
 * เข้มกว่า layout ของ /admin ซึ่งปล่อย employee เข้ามาได้ — ราคาจัดผูกกับเงินโดยตรง
 * จึงอยู่ชั้นเดียวกับ /admin/users และ /admin/permissions คือ admin ล้วน
 * (เส้นทาง API ตรวจซ้ำเองอีกชั้นผ่าน requireAdmin เพราะ server action หรือ fetch
 * ถูกเรียกตรงได้โดยไม่ต้องเปิดหน้านี้ก่อน — ด่านที่หน้าเว็บไม่เคยพอ)
 */
export default async function PricingCategoriesPage() {
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") return null;
    return <AccessDenied reason={guard.reason} role={guard.role} email={guard.email} />;
  }

  const categories = await listCategories();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8 lg:py-12">
      <p className="text-caption text-ink-48">การจัดการราคาจัด</p>
      <h1 className="mt-1 text-h3 font-bold leading-[1.32] sm:text-h2">จัดการประเภทสินค้า</h1>

      <p className="mt-5 max-w-[66ch] text-lead text-ink-80">
        ประเภทสินค้าคือกลุ่มที่ใช้จัดหมวดสินค้าราคาจัด เช่น มือถือ แท็บเล็ต อุปกรณ์เสริม
        เฉพาะประเภทที่<span className="font-semibold text-ink">เปิดใช้งาน</span>
        เท่านั้นที่เลือกได้ตอนเพิ่มสินค้า
      </p>

      <CategoryTable initialRows={categories} />
    </main>
  );
}
