import { NextResponse } from "next/server";
import { handle, jsonError, readJsonBody, requireAdmin } from "@/lib/pricing/api";
import { categoryInputSchema, firstErrorMessage } from "@/lib/pricing/schema";
import { createCategory, listCategories } from "@/lib/db/pricing";

/**
 * ประเภทสินค้า — รายการทั้งหมด และการเพิ่มใหม่
 *
 * GET  /api/admin/categories        ทุกประเภท
 * GET  /api/admin/categories?active=1  เฉพาะที่เปิดใช้งาน (ดรอปดาวน์ในฟอร์มสินค้าใช้ตัวนี้)
 * POST /api/admin/categories        เพิ่มประเภทใหม่
 */

export async function GET(request: Request) {
  return handle("GET categories", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const activeOnly = new URL(request.url).searchParams.get("active") === "1";
    const categories = await listCategories({ activeOnly });
    return NextResponse.json({ categories });
  });
}

export async function POST(request: Request) {
  return handle("POST categories", async () => {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const parsed = categoryInputSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return jsonError(firstErrorMessage(parsed.error), 400);

    const result = await createCategory(parsed.data.name);
    // 409 ไม่ใช่ 400 — ข้อมูลที่ส่งมาถูกต้องตามรูปแบบทุกอย่าง สิ่งที่ชนคือสถานะของข้อมูลที่มีอยู่แล้ว
    if (!result.ok) return jsonError("มีประเภทสินค้าชื่อนี้อยู่แล้ว", 409);

    return NextResponse.json({ category: result.category }, { status: 201 });
  });
}
