import { NextResponse } from "next/server";
import { handle, jsonError, readJsonBody, requireAdmin } from "@/lib/pricing/api";
import {
  firstErrorMessage,
  productInputSchema,
  productStatusSchema,
} from "@/lib/pricing/schema";
import { findProduct, setProductStatus, updateProduct } from "@/lib/db/pricing";

/**
 * สินค้ารายตัว
 *
 * GET   /api/admin/products/[id]  ข้อมูลสินค้าพร้อมประเภทและกฎบวกเพิ่ม
 * PUT   /api/admin/products/[id]  แก้สินค้า + กฎบวกเพิ่ม ใน transaction เดียว
 * PATCH /api/admin/products/[id]  เปลี่ยนสถานะเครื่อง (active/inactive)
 */

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  return handle("GET product", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const product = await findProduct(id);
    if (!product) return jsonError("ไม่พบสินค้านี้", 404);

    return NextResponse.json({ product });
  });
}

export async function PUT(request: Request, { params }: Context) {
  return handle("PUT product", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const parsed = productInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await updateProduct(id, parsed.data);
    if (!result.ok) {
      if (result.code === "category_inactive") {
        return jsonError("ประเภทสินค้านี้ถูกปิดใช้งานแล้ว เลือกประเภทอื่นหรือเปิดใช้งานก่อน", 409);
      }
      if (result.code === "category_not_found") {
        return jsonError("ไม่พบประเภทสินค้าที่เลือก", 400);
      }
      return jsonError("ไม่พบสินค้านี้", 404);
    }

    return NextResponse.json({ product: result.product });
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return handle("PATCH product", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const parsed = productStatusSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await setProductStatus(id, parsed.data.status);
    if (!result.ok) return jsonError("ไม่พบสินค้านี้", 404);

    return NextResponse.json({ product: result.product });
  });
}
