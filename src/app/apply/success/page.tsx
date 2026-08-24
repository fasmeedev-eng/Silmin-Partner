import { redirect } from "next/navigation";
import { ArrowRight, CircleCheck } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { CtaButton } from "@/components/ui/cta-button";
import { getDb } from "@/lib/db/mongo";
import { isActivePartnerUser } from "@/lib/auth/guard";

export const metadata = { title: "ส่งใบสมัครสำเร็จ" };

export default async function ApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/me");

  const { id } = await searchParams;
  if (!id) redirect("/me");

  // ตรวจว่าเลขที่ใบสมัครนี้เป็นของผู้ใช้คนนี้จริง ไม่ใช่แค่พิมพ์เลขมั่วมาใน URL
  // การอนุญาตต้องตรวจที่ query ทุกครั้ง ไม่ใช่แค่ซ่อนลิงก์บนหน้าเว็บ
  const db = await getDb();
  const application = await db
    .collection("applications")
    .findOne(
      { applicationId: id, ownerUserId: session.user.id },
      { projection: { applicationId: 1, "data.shop.name": 1, "data.interests.callbackSlot": 1 } },
    );

  if (!application) redirect("/me");

  const isActivePartner = await isActivePartnerUser(session.user.id, session.user.role);

  return (
    <>
      <SiteHeader
        signedIn
        email={session.user.email}
        role={session.user.role}
        isActivePartner={isActivePartner}
      />
      <main className="surface-tint min-h-svh">
        <div className="mx-auto w-full max-w-[640px] px-6 py-16 lg:px-8 lg:py-24">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand text-on-brand">
          <CircleCheck aria-hidden className="size-7" strokeWidth={2} />
        </span>

        <h1 className="mt-7 text-h3 font-bold sm:text-h2">ส่งใบสมัครสำเร็จ</h1>
        <p className="mt-4 text-lead text-ink-80">
          ขอบคุณที่สนใจร่วมเป็นพาร์ทเนอร์กับเรา
          เจ้าหน้าที่จะตรวจสอบข้อมูลและติดต่อกลับตามช่องทางที่ท่านแจ้งไว้
        </p>

        <div className="mt-9 rounded-card bg-canvas p-7 shadow-soft ring-1 ring-hairline/70">
          <p className="text-caption text-ink-48">เลขที่ใบสมัคร</p>
          <p className="mt-1 text-h3 font-bold tabular-nums">{application.applicationId}</p>
          <p className="mt-4 text-caption text-ink-80">
            เก็บเลขนี้ไว้อ้างอิงเวลาติดต่อกลับมา
            หรือเปิดดูได้ตลอดในหน้าใบสมัครของฉัน
          </p>
          <p className="mt-4 border-t border-hairline pt-4 text-caption">
            <span className="text-ink-48">สถานะปัจจุบัน </span>
            <span className="font-semibold">รอดำเนินการ</span>
          </p>
        </div>

        <p className="mt-8 text-caption text-ink-80">
          ทีมงานตรวจสอบเอกสารภายใน 1–3 วันทำการ
          หากข้อมูลไม่ครบเราจะแจ้งให้แก้ไขในใบเดิม ไม่ต้องกรอกใหม่
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <CtaButton href="/me" variant="brand">
            ดูใบสมัครของฉัน
            <ArrowRight aria-hidden className="size-[18px]" />
          </CtaButton>
          <CtaButton href="/" variant="brand-outline">
            กลับหน้าแรก
          </CtaButton>
        </div>
        </div>
      </main>
    </>
  );
}
