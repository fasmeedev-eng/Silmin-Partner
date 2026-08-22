import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/site-header";
import { ApplyForm } from "@/app/apply/apply-form";
import { findOwnApplication } from "@/lib/db/applications";
import { STATUS_META, editBlockedReason, isEditable } from "@/lib/application/status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return { title: `แก้ไขใบสมัคร ${applicationId}` };
}

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/me");

  const { applicationId } = await params;
  const application = await findOwnApplication(session.user.id, applicationId);
  // ไม่พบ = ไม่มีจริง หรือไม่ใช่ของคนนี้ ตอบเหมือนกันทั้งสองกรณี
  if (!application) redirect("/me");

  // ด่านนี้เป็นแค่ UX — updateApplicationAction ตรวจสถานะซ้ำบนเซิร์ฟเวอร์ตอนกดบันทึกอยู่แล้ว
  if (!isEditable(application.status)) {
    return (
      <>
        <SiteHeader signedIn email={session.user.email} role={session.user.role} />
        <main className="mx-auto w-full max-w-[560px] px-6 py-16 sm:px-8 sm:py-24">
          <Lock aria-hidden className="size-8 text-ink-48" strokeWidth={1.5} />
          <h1 className="mt-6 text-h3">แก้ไขใบสมัครนี้ไม่ได้แล้ว</h1>
          <p className="mt-4 text-body text-ink-80">
            {editBlockedReason(application.status)}
          </p>
          <p className="mt-4 text-caption text-ink-48">
            สถานะปัจจุบัน: {STATUS_META[application.status].label}
          </p>
          <Link
            href={`/me/${applicationId}`}
            className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-pearl px-7 text-body text-ink ring-1 ring-hairline ring-inset transition-colors hover:bg-parchment"
          >
            <ArrowLeft aria-hidden className="size-4" />
            กลับไปดูใบสมัคร
          </Link>
        </main>
      </>
    );
  }

  // ความยินยอมถูกเก็บเป็นหลักฐานแยกไว้ตอนส่งครั้งแรกแล้ว (พร้อม timestamp, IP, เวอร์ชันนโยบาย)
  // ฟอร์มจึงติ๊กให้เพื่อให้ผ่านการตรวจ แต่ไม่ถามซ้ำและไม่เขียนทับหลักฐานเดิม
  const initialData = {
    ...application.data,
    consent: { truthful: true, pdpa: true },
  };

  return (
    <>
      <SiteHeader signedIn email={session.user.email} role={session.user.role} />
      <main>
        <div className="mx-auto w-full max-w-[720px] px-6 pt-8 sm:px-8">
          <Link
            href={`/me/${applicationId}`}
            className="inline-flex min-h-[44px] items-center gap-2 text-caption text-ink-80 transition-colors hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            ยกเลิกและกลับไปดูใบสมัคร
          </Link>
          <p className="mt-2 text-caption tabular-nums text-ink-48">
            กำลังแก้ไข {application.applicationId}
          </p>
        </div>
        <ApplyForm initialData={initialData} applicationId={applicationId} />
      </main>
    </>
  );
}
