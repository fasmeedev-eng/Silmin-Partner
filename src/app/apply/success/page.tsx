import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/lib/db/mongo";

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

  return (
    <>
      <SiteHeader signedIn email={session.user.email} role={session.user.role} />
      <main className="mx-auto w-full max-w-[640px] px-6 py-16 sm:px-8 sm:py-24">
        <CircleCheck aria-hidden className="size-10 text-accent-ink" strokeWidth={1.75} />

        <h1 className="mt-6 text-h3 sm:text-h2">ส่งใบสมัครสำเร็จ</h1>
        <p className="mt-4 text-body text-ink-80">
          ขอบคุณที่สนใจร่วมเป็นพาร์ทเนอร์กับเรา
          เจ้าหน้าที่จะตรวจสอบข้อมูลและติดต่อกลับตามช่องทางที่ท่านแจ้งไว้
        </p>

        <div className="mt-8 rounded-lg bg-parchment p-6 ring-1 ring-hairline ring-inset">
          <p className="text-caption text-ink-48">เลขที่ใบสมัคร</p>
          <p className="mt-1 text-h3 tabular-nums">{application.applicationId}</p>
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

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/me"
            className="inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-body text-on-accent transition-colors hover:bg-accent-hover"
          >
            ดูใบสมัครของฉัน
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[52px] items-center rounded-full bg-pearl px-7 text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </main>
    </>
  );
}
