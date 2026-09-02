import { NextResponse } from "next/server";
import { handle, jsonError, readJsonBody, requireAdmin } from "@/lib/pricing/api";
import {
  categoryActiveSchema,
  categoryInputSchema,
  firstErrorMessage,
} from "@/lib/pricing/schema";
import { renameCategory, setCategoryActive } from "@/lib/db/pricing";

/**
 * ประเภทสินค้ารายตัว
 *
 * PUT   /api/admin/categories/[id]  แก้ชื่อ
 * PATCH /api/admin/categories/[id]  เปิด/ปิดการใช้งาน
 *
 * แยกสองกริยาเพราะเป็นสองเจตนา: PUT แทนที่เนื้อหาของทรัพยากร PATCH แก้สถานะบางส่วน
 * และหน้าเว็บเรียกคนละที่กัน (โมดัลแก้ชื่อ กับ ปุ่มสลับสถานะในตาราง)
 */

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  return handle("PUT category", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const parsed = categoryInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await renameCategory(id, parsed.data.name);
    if (!result.ok) {
      return result.code === "duplicate"
        ? jsonError("มีประเภทสินค้าชื่อนี้อยู่แล้ว", 409)
        : jsonError("ไม่พบประเภทสินค้านี้", 404);
    }

    return NextResponse.json({ category: result.category });
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return handle("PATCH category", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const parsed = categoryActiveSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await setCategoryActive(id, parsed.data.isActive);
    if (!result.ok) return jsonError("ไม่พบประเภทสินค้านี้", 404);

    return NextResponse.json({ category: result.category });
  });
}
