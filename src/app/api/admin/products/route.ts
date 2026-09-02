import { NextResponse } from "next/server";
import { handle, jsonError, readJsonBody, requireAdmin } from "@/lib/pricing/api";
import { firstErrorMessage, productInputSchema } from "@/lib/pricing/schema";
import { createProduct, listProducts } from "@/lib/db/pricing";

/**
 * สินค้าราคาจัด — รายการทั้งหมด และการเพิ่มใหม่
 *
 * GET  /api/admin/products?q=&categoryId=   ค้นตามชื่อ และกรองตามประเภท
 * POST /api/admin/products                  เพิ่มสินค้า + กฎบวกเพิ่ม ใน transaction เดียว
 *
 * การค้นและกรองทำฝั่งเซิร์ฟเวอร์ทั้งคู่ ไม่ใช่กรองอาร์เรย์ในเบราว์เซอร์ — รายการสินค้าโตได้เรื่อย ๆ
 * และ MongoDB มีดัชนีให้อยู่แล้ว หน้าเว็บเป็นคนหน่วง 300ms ก่อนยิงมา
 */

export async function GET(request: Request) {
  return handle("GET products", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const params = new URL(request.url).searchParams;
    const products = await listProducts({
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
    });

    return NextResponse.json({ products });
  });
}

export async function POST(request: Request) {
  return handle("POST products", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const parsed = productInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await createProduct(parsed.data);
    if (!result.ok) {
      // ประเภทที่เพิ่งถูกปิดใช้งานระหว่างที่โมดัลเปิดค้างอยู่ — ข้อความต้องบอกว่าให้ทำอะไรต่อ
      // ไม่ใช่แค่บอกว่าผิด เพราะคนกรอกไม่มีทางรู้ว่ามีคนอื่นไปปิดประเภทนั้นเมื่อกี้
      if (result.code === "category_inactive") {
        return jsonError("ประเภทสินค้านี้ถูกปิดใช้งานแล้ว เลือกประเภทอื่นหรือเปิดใช้งานก่อน", 409);
      }
      return jsonError("ไม่พบประเภทสินค้าที่เลือก", 400);
    }

    return NextResponse.json({ product: result.product }, { status: 201 });
  });
}
