import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductPriceTable } from "@/components/partner/product-price-table";
import { guardPartnerAccess } from "@/lib/auth/guard";
import { listPartnerProducts } from "@/lib/db/pricing";

export const metadata = { title: "สินค้าราคาจัด" };

/**
 * ใบราคาจัดสำหรับร้านพาร์ทเนอร์ — อ่านอย่างเดียว
 *
 * **หน้านี้เรียก guardPartnerAccess ซ้ำเองก่อนแตะฐานข้อมูล ไม่พึ่ง layout อย่างเดียว**
 * และนี่ไม่ใช่การกันไว้ก่อนแบบเผื่อเหลือเผื่อขาด — เป็นช่องโหว่จริงที่วัดได้:
 * Next.js รัน page component ต่อแม้ layout จะตัดสินใจไม่เรนเดอร์ children เพราะ children
 * ถูกสร้างเป็น element ส่งเข้าไปตั้งแต่ต้น ผลคือคิวรีทำงาน แล้วข้อมูลติดไปกับ RSC payload
 * ให้คนที่เห็นหน้า "เปิดให้เฉพาะพาร์ทเนอร์" เปิดดูได้จาก view-source
 * (ทดสอบแล้วด้วยบัญชีที่ใบสมัครยังเป็น New — ชื่อสินค้าโผล่ใน HTML จริง ๆ ก่อนแก้ตรงนี้)
 *
 * กฎเดียวกับ /admin: ด่านที่ layout กันแค่ "ใครเปิดหน้านี้ได้" ไม่ได้กันว่าข้อมูลอะไรถูกอ่านขึ้นมา
 * ทุกคิวรีต้องมีด่านของตัวเอง
 *
 * ส่วนขอบเขตของข้อมูลเป็นหน้าที่ของ listPartnerProducts ซึ่งกรองเครื่องที่ปิดขายทิ้ง
 * และคืนมาเฉพาะเจ็ดฟิลด์ที่พาร์ทเนอร์เห็นได้
 */
export default async function PartnerProductsPage() {
  const guard = await guardPartnerAccess();
  // ไม่ต้องเรนเดอร์ข้อความปฏิเสธเอง — layout เป็นคนแสดงให้แล้ว ที่นี่แค่ต้องไม่ยิงคิวรี
  if (!guard.allowed) return null;

  const [session, products] = await Promise.all([auth(), listPartnerProducts()]);

  return (
    <>
      {/* แถบเดียวกับหน้าเครื่องคำนวณผ่อน — isActivePartner เป็น true เสมอ เพราะผ่านด่าน
          guardPartnerAccess มาแล้ว จึงไม่ต้องคำนวณซ้ำเหมือนหน้าแรก */}
      <SiteHeader
        signedIn
        email={session?.user?.email}
        role={session?.user?.role}
        isActivePartner
        sectionNav
      />

      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-12 lg:px-8 lg:py-16">
          <h1 className="text-h2 font-bold leading-[1.32]">
            สินค้า<span className="text-brand">ราคาจัด</span>
          </h1>
          <p className="mt-4 max-w-[60ch] text-lead text-ink-80">
            ราคาจัดคือ<span className="font-semibold text-ink">ยอดผ่อนชำระ</span> (ราคาเต็ม −
            ราคาดาวน์) ไม่ใช่ราคาขายเต็ม
          </p>

          {/* กติกาสำคัญที่สุดของหน้านี้ ต้องอยู่เหนือตาราง ไม่ใช่เชิงอรรถท้ายหน้า —
              คนที่อ่านผิดจะเสนอราคาผิดให้ลูกค้า ซึ่งแก้ทีหลังยากกว่าอ่านตอนนี้มาก */}
          <p className="mt-6 max-w-[70ch] rounded-input bg-gold-soft p-4 text-caption leading-[1.7] text-ink-80 ring-1 ring-gold/40 ring-inset">
            ช่อง <span className="font-semibold text-ink">สามารถบวกเพิ่มได้</span> คือ
            <span className="font-semibold text-ink">เพดาน</span> ไม่ใช่จำนวนที่ต้องบวก
            ร้านบวกจากราคาจัดได้ไม่เกินจำนวนนั้น ส่วนรายการที่ขึ้นว่า{" "}
            <span className="font-semibold text-ink">บวกเพิ่มไม่ได้</span> ห้ามบวกเพิ่มจากราคาจัดเลย
          </p>

          <div className="mt-8">
            <ProductPriceTable rows={products} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
