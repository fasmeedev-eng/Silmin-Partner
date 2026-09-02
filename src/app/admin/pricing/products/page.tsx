import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { ProductTable } from "@/components/admin/pricing/product-table";
import { guardRole } from "@/lib/auth/guard";
import { listCategories, listProducts } from "@/lib/db/pricing";

export const metadata = { title: "จัดการสินค้าราคาจัด" };

/**
 * หน้าจัดการสินค้าราคาจัด
 *
 * ดึงข้อมูลรอบแรกฝั่งเซิร์ฟเวอร์แล้วส่งลงไปเป็น prop ตารางจึงมีข้อมูลตั้งแต่ HTML ชุดแรก
 * การค้นหาและการกรองหลังจากนั้นเป็นหน้าที่ของ client component ซึ่งยิงไปที่ /api/admin/products
 *
 * admin เท่านั้น ด้วยเหตุผลเดียวกับหน้าประเภทสินค้า
 */
export default async function PricingProductsPage() {
  const guard = await guardRole(["admin"]);
  if (!guard.allowed) {
    if (guard.reason === "unauthenticated") return null;
    return <AccessDenied reason={guard.reason} role={guard.role} email={guard.email} />;
  }

  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const activeCategories = categories.filter((category) => category.isActive);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8 lg:py-12">
      <p className="text-caption text-ink-48">การจัดการราคาจัด</p>
      <h1 className="mt-1 text-h3 font-bold leading-[1.32] sm:text-h2">จัดการสินค้าราคาจัด</h1>

      <p className="mt-5 max-w-[66ch] text-lead text-ink-80">
        ราคาจัดคือ<span className="font-semibold text-ink">ยอดผ่อนชำระ</span> (ราคาเต็ม −
        ราคาดาวน์) ไม่ใช่ราคาขายเต็ม ส่วนบวกเพิ่มคือเงินที่อนุญาตให้บวกจากราคาจัดได้
      </p>

      {/* ทางตันที่บอกทางออก — ไม่มีประเภทที่เปิดใช้งาน = เพิ่มสินค้าไม่ได้เลย ปุ่มเพิ่มจะถูกปิดไว้
          ถ้าไม่บอกว่าต้องไปทำอะไรก่อน คนใช้จะคิดว่าหน้านี้พัง */}
      {activeCategories.length === 0 ? (
        <p className="mt-6 rounded-input bg-gold-soft p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-gold/40 ring-inset">
          ยังไม่มีประเภทสินค้าที่เปิดใช้งาน จึงเพิ่มสินค้าใหม่ไม่ได้ —{" "}
          <Link
            href="/admin/pricing/categories"
            className="font-semibold text-ink underline underline-offset-4 hover:text-brand-ink"
          >
            ไปเพิ่มประเภทสินค้าก่อน
          </Link>
        </p>
      ) : null}

      <ProductTable
        initialRows={products}
        categories={categories}
        activeCategories={activeCategories}
      />
    </main>
  );
}
